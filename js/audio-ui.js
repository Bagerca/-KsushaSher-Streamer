/* js/audio-ui.js */
import EventBus from './event-bus.js';

const VOLUME_TICKS_COUNT = 20;

export class AudioUI {
    constructor(audioCore) {
        this.core = audioCore;
        this.isMusicModeActive = false;
        
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
            progressArea: document.getElementById('progress-area'), // Может отсутствовать в DOM
            progressFill: document.getElementById('progress-fill'), // Может отсутствовать в DOM
            volumeTicksContainer: document.getElementById('volume-ticks')
        };

        this.init();
    }

    init() {
        if (!this.els.playlist) return;

        this.renderPlaylist();
        if (this.els.volumeTicksContainer) {
            this.createVolumeTicks();
            this.updateVolumeUI(this.core.audio.volume);
        }
        this.bindEvents();
    }

    bindEvents() {
        // Контролы (Безопасная привязка)
        if (this.els.btnPlay) this.els.btnPlay.addEventListener('click', () => this.core.togglePlay());
        if (this.els.btnPrev) this.els.btnPrev.addEventListener('click', () => { this.core.initContext(); this.core.prev(); });
        if (this.els.btnNext) this.els.btnNext.addEventListener('click', () => { this.core.initContext(); this.core.next(); });
        if (this.els.playlist) this.els.playlist.addEventListener('click', () => this.core.initContext());

        // Прогресс бар (с проверкой существования)
        if (this.els.progressArea) {
            this.els.progressArea.addEventListener('click', (e) => {
                if (!this.isMusicModeActive || isNaN(this.core.audio.duration)) return;
                const clickX = e.offsetX;
                const newTime = (clickX / this.els.progressArea.clientWidth) * this.core.audio.duration;
                this.core.seek(newTime);
                EventBus.emit('SYS_LOG', { html: `[MUSIC] SEEK_TO: <span style="color:#fff">${Math.floor(newTime/60)}:${Math.floor(newTime%60).toString().padStart(2, '0')}</span>` });
            });
        }

        // Громкость (Drag) - только если элемент есть
        if (this.els.volumeTicksContainer) {
            let isDraggingVolume = false;
            this.els.volumeTicksContainer.addEventListener('mousedown', (e) => {
                isDraggingVolume = true;
                this.handleVolumeInput(e);
            });
            document.addEventListener('mousemove', (e) => {
                if (isDraggingVolume) this.handleVolumeInput(e);
            });
            document.addEventListener('mouseup', () => {
                if (isDraggingVolume && this.isMusicModeActive) {
                    EventBus.emit('SYS_LOG', { html: `[MUSIC] VOL_UPDATE: <span style="color:#fff">${Math.round(this.core.audio.volume * 100)}%</span>` });
                }
                isDraggingVolume = false;
            });
        }

        // Подписки на Core
        EventBus.on('AUDIO_PLAY_STATE_CHANGED', (isPlaying) => {
            if (this.els.btnPlay) {
                const icon = this.els.btnPlay.querySelector('i');
                if (icon) icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
            this.renderPlaylist();
        });

        EventBus.on('AUDIO_TRACK_LOADED', () => this.renderPlaylist());

        EventBus.on('AUDIO_TIME_UPDATE', ({ currentTime, duration }) => {
            if (isNaN(duration) || !this.els.progressFill) return;
            this.els.progressFill.style.width = `${(currentTime / duration) * 100}%`;
        });

        // Слушаем переключение режима UI
        EventBus.on('UI_CLICK_MUSIC', () => this.toggleMode());
    }

    handleVolumeInput(e) {
        if (!this.isMusicModeActive || !this.els.volumeTicksContainer) return;
        const rect = this.els.volumeTicksContainer.getBoundingClientRect();
        let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const step = 1 / VOLUME_TICKS_COUNT;
        let newVolume = Math.round((x / rect.width) / step) * step;
        
        this.core.setVolume(newVolume);
        this.updateVolumeUI(newVolume);
    }

    createVolumeTicks() {
        if (!this.els.volumeTicksContainer) return;
        this.els.volumeTicksContainer.innerHTML = '';
        for (let i = 0; i < VOLUME_TICKS_COUNT; i++) {
            const tick = document.createElement('div');
            tick.className = 'vol-tick';
            this.els.volumeTicksContainer.appendChild(tick);
        }
    }

    updateVolumeUI(vol) {
        if (!this.els.volumeTicksContainer) return;
        const ticks = this.els.volumeTicksContainer.children;
        const activeCount = Math.round(vol * VOLUME_TICKS_COUNT);
        for (let i = 0; i < ticks.length; i++) {
            ticks[i].classList.toggle('active', i < activeCount);
        }
    }

    renderPlaylist() {
        const tracks = this.core.tracks;
        if (!tracks || tracks.length === 0) {
            if (this.els.playlist) this.els.playlist.innerHTML = '<div style="padding:15px; color:#666; text-align:center;">Плейлист пуст</div>';
            return;
        }

        if (this.els.playlist) {
            this.els.playlist.innerHTML = tracks.map((track, index) => `
                <div class="track-item ${index === this.core.currentTrackIdx ? 'active' : ''}" data-index="${index}">
                    <div class="track-icon">
                        ${index === this.core.currentTrackIdx && this.core.isPlaying ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-music"></i>'}
                    </div>
                    <div class="track-info">
                        <span class="track-title">${track.title}</span>
                        <span class="track-artist">${track.artist}</span>
                    </div>
                </div>
            `).join('');

            this.els.playlist.querySelectorAll('.track-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.core.initContext();
                    this.core.loadTrack(parseInt(item.dataset.index));
                    this.core.play();
                });
            });
        }
    }

    toggleMode() {
        const panelContent = document.querySelector('.hud-side-panel.right .panel-content');
        const statusContainer = document.querySelector('.main-display-status');
        
        if (!panelContent || panelContent.classList.contains('is-glitching')) return;

        panelContent.classList.add('is-glitching');
        if (statusContainer) statusContainer.classList.add('status-switching');

        setTimeout(() => {
            this.isMusicModeActive = !this.isMusicModeActive;
            
            EventBus.emit('SYS_SET_NOISE', !this.isMusicModeActive);
            EventBus.emit('STATE_MUSIC_CHANGED', this.isMusicModeActive);

            if (this.isMusicModeActive) {
                if (this.els.squadView) this.els.squadView.style.display = 'none';
                if (this.els.musicView) this.els.musicView.style.display = 'flex';
                if (this.els.liveStatus) this.els.liveStatus.style.display = 'none';
                if (this.els.musicControls) this.els.musicControls.style.display = 'flex';
                if (this.els.hudRight) this.els.hudRight.classList.add('music-mode-active');
                
                this.updateVolumeUI(this.core.audio.volume);
                this.renderPlaylist();
                
                EventBus.emit('SYS_LOG', { html: `MUSIC MODULE: <span style='color:var(--neon-pink)'>ACTIVATING...</span>`, forceScroll: true });
                EventBus.emit('SYS_LOG', { html: `[MUSIC] MODULE_INIT <span style="color:#fff">READY</span>` });
            } else {
                if (this.core.isPlaying) this.core.pause();
                
                if (this.els.squadView) this.els.squadView.style.display = 'flex';
                if (this.els.musicView) this.els.musicView.style.display = 'none';
                if (this.els.liveStatus) this.els.liveStatus.style.display = 'flex';
                if (this.els.musicControls) this.els.musicControls.style.display = 'none';
                if (this.els.hudRight) this.els.hudRight.classList.remove('music-mode-active');
                if (this.els.progressFill) this.els.progressFill.style.width = '0%';
                
                EventBus.emit('SYS_LOG', { html: `MUSIC MODULE: <span style='color:var(--neon-green)'>DEACTIVATING...</span>`, forceScroll: true });
            }
            
            if (statusContainer) statusContainer.classList.remove('status-switching');
        }, 200);

        setTimeout(() => panelContent.classList.remove('is-glitching'), 400);
    }
}