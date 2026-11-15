/* js/audio-ui.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';

const VOLUME_TICKS_COUNT = 20;
const GLITCH_DURATION = 400;
const SWAP_DELAY = 200;

/**
 * UI плеера. Режим переключается ТОЛЬКО из Store, а во время
 * glitch-анимации запрос не отбрасывается, а откладывается —
 * иначе Store и панель навсегда расходились бы по состоянию.
 */
export class AudioUI {
    constructor(audioCore) {
        this.core = audioCore;
        this.isMusicModeActive = false;
        this.pendingTarget = null;
        this.swapTimer = null;
        this.glitchTimer = null;
        this.isDraggingVolume = false;

        this.els = {
            squadView: document.getElementById('squad-view'),
            musicView: document.getElementById('music-view'),
            liveStatus: document.getElementById('live-status-container'),
            musicControls: document.getElementById('music-controls-container'),
            playlist: document.getElementById('playlist-list'),
            btnPlay: document.getElementById('btn-play'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            hudRight: document.querySelector('.hud-side-panel.right'),
            panelContent: document.querySelector('.hud-side-panel.right .panel-content'),
            statusContainer: document.querySelector('.main-display-status'),
            progressArea: document.getElementById('progress-area'),
            progressFill: document.getElementById('progress-fill'),
            volumeTicksContainer: document.getElementById('volume-ticks')
        };

        this.init();
    }

    init() {
        if (!this.els.playlist) {
            console.warn('⚠️ [AudioUI] Плейлист не найден — модуль отключён.');
            return;
        }
        this.renderPlaylist();
        if (this.els.volumeTicksContainer) {
            this.createVolumeTicks();
            this.updateVolumeUI(this.core.audio.volume);
        }
        this.bindEvents();
        // Первичная синхронизация, если Store уже включил режим до создания UI.
        const target = AppStore.getState().audio.isMusicModeActive;
        if (target !== this.isMusicModeActive) this.toggleMode(target);
    }

    bindEvents() {
        if (this.els.btnPlay) this.els.btnPlay.addEventListener('click', () => this.core.togglePlay());
        if (this.els.btnPrev) this.els.btnPrev.addEventListener('click', () => { this.core.initContext(); this.core.prev(); });
        if (this.els.btnNext) this.els.btnNext.addEventListener('click', () => { this.core.initContext(); this.core.next(); });
        if (this.els.playlist) this.els.playlist.addEventListener('click', () => this.core.initContext());

        if (this.els.progressArea) {
            this.els.progressArea.addEventListener('click', (e) => {
                if (!this.isMusicModeActive || isNaN(this.core.audio.duration)) return;
                const rect = this.els.progressArea.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const newTime = ratio * this.core.audio.duration;
                this.core.seek(newTime);
                const timeStr = `${Math.floor(newTime / 60)}:${Math.floor(newTime % 60).toString().padStart(2, '0')}`;
                EventBus.emit('SYS_LOG', { type: 'system', tag: 'MUSIC', action: 'SEEK_TO', value: timeStr, color: 'var(--color-text-light)' });
            });
        }

        if (this.els.volumeTicksContainer) {
            this.els.volumeTicksContainer.addEventListener('mousedown', (e) => {
                this.isDraggingVolume = true;
                this.handleVolumeInput(e);
            });
            document.addEventListener('mousemove', (e) => {
                if (this.isDraggingVolume) this.handleVolumeInput(e);
            });
            document.addEventListener('mouseup', () => {
                if (this.isDraggingVolume && this.isMusicModeActive) {
                    EventBus.emit('SYS_LOG', {
                        type: 'system', tag: 'MUSIC', action: 'VOL_UPDATE',
                        value: `${Math.round(this.core.audio.volume * 100)}%`, color: 'var(--color-text-light)'
                    });
                }
                this.isDraggingVolume = false;
            });
        }

        EventBus.on('AUDIO_PLAY_STATE_CHANGED', (isPlaying) => {
            if (this.els.btnPlay) {
                const icon = this.els.btnPlay.querySelector('i');
                if (icon) icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
                this.els.btnPlay.title = isPlaying ? 'Пауза' : 'Играть';
            }
            if (AppStore.getState().audio.isPlaying !== isPlaying) {
                AppStore.dispatch({ type: 'AUDIO_SET_PLAYING', payload: isPlaying });
            }
            this.renderPlaylist();
        });

        EventBus.on('AUDIO_TRACK_LOADED', (index) => {
            if (AppStore.getState().audio.currentTrackIdx !== index) {
                AppStore.dispatch({ type: 'AUDIO_SET_TRACK', payload: index });
            }
            this.renderPlaylist();
        });

        EventBus.on('AUDIO_TIME_UPDATE', ({ currentTime, duration }) => {
            if (isNaN(duration) || !this.els.progressFill) return;
            this.els.progressFill.style.width = `${(currentTime / duration) * 100}%`;
        });

        AppStore.subscribe((state, prevState) => {
            const target = state.audio.isMusicModeActive;
            const prev = prevState && prevState.audio.isMusicModeActive;
            if (target !== prev) this.toggleMode(target);
        });
    }

    handleVolumeInput(e) {
        if (!this.isMusicModeActive || !this.els.volumeTicksContainer) return;
        const rect = this.els.volumeTicksContainer.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const step = 1 / VOLUME_TICKS_COUNT;
        const volume = Math.max(0, Math.min(1, Math.round((x / rect.width) / step) * step));
        this.core.setVolume(volume);
        this.updateVolumeUI(volume);
        if (AppStore.getState().audio.volume !== volume) {
            AppStore.dispatch({ type: 'AUDIO_SET_VOLUME', payload: volume });
        }
    }

    createVolumeTicks() {
        this.els.volumeTicksContainer.innerHTML = '';
        for (let i = 0; i < VOLUME_TICKS_COUNT; i++) {
            const tick = document.createElement('div');
            tick.className = 'vol-tick';
            this.els.volumeTicksContainer.appendChild(tick);
        }
    }

    updateVolumeUI(volume) {
        if (!this.els.volumeTicksContainer) return;
        const ticks = this.els.volumeTicksContainer.children;
        const activeCount = Math.round(volume * VOLUME_TICKS_COUNT);
        for (let i = 0; i < ticks.length; i++) ticks[i].classList.toggle('active', i < activeCount);
        this.els.volumeTicksContainer.title = `Громкость: ${Math.round(volume * 100)}%`;
    }

    renderPlaylist() {
        if (!this.els.playlist) return;
        const tracks = this.core.tracks || [];
        if (tracks.length === 0) {
            this.els.playlist.innerHTML = '<div class="suggestion-empty" style="padding:20px;">Плейлист пуст</div>';
            return;
        }

        this.els.playlist.innerHTML = tracks.map((track, index) => {
            const isCurrent = index === this.core.currentTrackIdx;
            const icon = (isCurrent && this.core.isPlaying) ? 'fas fa-volume-up' : 'fas fa-music';
            return `
                <div class="track-item ${isCurrent ? 'active' : ''}" data-index="${index}">
                    <div class="track-icon"><i class="${icon}"></i></div>
                    <div class="track-info">
                        <span class="track-title">${track.title}</span>
                        <span class="track-artist">${track.artist}</span>
                    </div>
                </div>`;
        }).join('');

        this.els.playlist.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', () => {
                this.core.initContext();
                this.core.loadTrack(parseInt(item.dataset.index, 10));
                this.core.play();
            });
        });
    }

    toggleMode(isActive) {
        const target = Boolean(isActive);
        if (target === this.isMusicModeActive && this.pendingTarget === null) return;

        const panel = this.els.panelContent;
        if (!panel) {
            // Панель скрыта (мобильный режим) — фиксируем состояние без анимации.
            this.applyMode(target);
            return;
        }

        if (panel.classList.contains('is-glitching')) {
            // Не отбрасываем запрос: применим сразу после текущей анимации.
            this.pendingTarget = target;
            return;
        }

        this.pendingTarget = null;
        panel.classList.add('is-glitching');
        if (this.els.statusContainer) this.els.statusContainer.classList.add('status-switching');

        clearTimeout(this.swapTimer);
        this.swapTimer = setTimeout(() => {
            this.swapTimer = null;
            this.applyMode(target);
            if (this.els.statusContainer) this.els.statusContainer.classList.remove('status-switching');
        }, SWAP_DELAY);

        clearTimeout(this.glitchTimer);
        this.glitchTimer = setTimeout(() => {
            this.glitchTimer = null;
            panel.classList.remove('is-glitching');
            const stateTarget = AppStore.getState().audio.isMusicModeActive;
            if (this.pendingTarget !== null) {
                const queued = this.pendingTarget;
                this.pendingTarget = null;
                if (queued !== this.isMusicModeActive) this.toggleMode(queued);
            } else if (stateTarget !== this.isMusicModeActive) {
                this.toggleMode(stateTarget);
            }
        }, GLITCH_DURATION);
    }

    applyMode(isActive) {
        this.isMusicModeActive = isActive;
        EventBus.emit('SYS_SET_NOISE', !isActive);
        EventBus.emit('STATE_MUSIC_CHANGED', isActive);

        if (isActive) {
            if (this.els.squadView) this.els.squadView.style.display = 'none';
            if (this.els.musicView) this.els.musicView.style.display = 'flex';
            if (this.els.liveStatus) this.els.liveStatus.style.display = 'none';
            if (this.els.musicControls) this.els.musicControls.style.display = 'flex';
            if (this.els.hudRight) this.els.hudRight.classList.add('music-mode-active');
            this.updateVolumeUI(this.core.audio.volume);
            this.renderPlaylist();
            EventBus.emit('SYS_LOG', {
                type: 'system', tag: 'MUSIC', action: 'MODULE_INIT',
                value: 'READY', color: 'var(--color-neon-pink)', forceScroll: true
            });
        } else {
            if (this.core.isPlaying) this.core.pause();
            if (this.els.squadView) this.els.squadView.style.display = 'flex';
            if (this.els.musicView) this.els.musicView.style.display = 'none';
            if (this.els.liveStatus) this.els.liveStatus.style.display = 'flex';
            if (this.els.musicControls) this.els.musicControls.style.display = 'none';
            if (this.els.hudRight) this.els.hudRight.classList.remove('music-mode-active');
            if (this.els.progressFill) this.els.progressFill.style.width = '0%';
            EventBus.emit('SYS_LOG', {
                type: 'system', tag: 'MUSIC', action: 'MODULE',
                value: 'DEACTIVATED', color: 'var(--color-text-muted)', forceScroll: true
            });
        }
        console.log(`🎧 [AudioUI] Режим плеера: ${isActive ? 'ACTIVE' : 'OFF'}`);
    }
}