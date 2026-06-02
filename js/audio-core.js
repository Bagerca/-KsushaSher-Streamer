/* js/audio-core.js */
import EventBus from './event-bus.js';
import { loadData } from './api.js';

const FALLBACK_TRACKS = [
    { title: "СЛАВА БОССУ", artist: "5opka", url: "assets/music/5opka_slava_bossu.mp3" },
    { title: "Котлетки с Пюрешкой", artist: "Enjoykin", url: "assets/music/enjoykin_kotletki.mp3" }
];

export class AudioCore {
    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audio.volume = 0.5;

        this.tracks = []; 
        this.currentTrackIdx = 0;
        this.isPlaying = false;

        // Web Audio API
        this.audioCtx = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;

        this.initListeners();
    }

    async loadTracks() {
        try {
            const data = await loadData('music.json', FALLBACK_TRACKS);
            this.tracks = Array.isArray(data) && data.length > 0 ? data : FALLBACK_TRACKS;
            console.log(`🎵 [AudioCore] Загружено треков: ${this.tracks.length}`);
        } catch (error) {
            console.error("❌ [AudioCore] Ошибка загрузки плейлиста, используем Fallback:", error);
            this.tracks = FALLBACK_TRACKS;
        }
    }

    initListeners() {
        this.audio.addEventListener('ended', () => this.next());
        this.audio.addEventListener('timeupdate', () => {
            EventBus.emit('AUDIO_TIME_UPDATE', { 
                currentTime: this.audio.currentTime, 
                duration: this.audio.duration 
            });
        });

        // Слушатель для синтеза системных звуков на лету
        EventBus.on('PLAY_SOUND', (type) => this.playSynthSound(type));
    }

    initContext() {
        if (this.audioCtx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 64;
            
            this.source = this.audioCtx.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            console.log("🎵 [AudioCore] Web Audio API подключен");
        } catch (e) {
            console.error("❌ [AudioCore] Ошибка Web Audio API:", e);
        }
    }

    /**
     * Легковесный синтезатор системных звуков на основе встроенных осцилляторов
     * Не загружает сеть и работает мгновенно в контексте аудиопроцессора
     */
    playSynthSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = this.audioCtx || new AudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'click') {
                // Системный кибер-клик (короткий высокочастотный спад)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                
                osc.start(now);
                osc.stop(now + 0.08);
            } 
            else if (type === 'hover') {
                // Тонкое скольжение при наведении на важный объект
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
                
                gainNode.gain.setValueAtTime(0.02, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                
                osc.start(now);
                osc.stop(now + 0.04);
            }
            else if (type === 'expand') {
                // Мягкий басовый импульс открытия/развертывания меню
                osc.type = 'sine';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(350, now + 0.25);
                
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                
                osc.start(now);
                osc.stop(now + 0.25);
            }
        } catch (e) {
            console.warn("⚠️ [AudioCore] Синтезатор заблокирован браузером до первого взаимодействия", e.message);
        }
    }

    loadTrack(index) {
        if (!this.tracks || this.tracks.length === 0) return;
        this.currentTrackIdx = index;
        this.audio.src = this.tracks[index].url;
        this.audio.load();
        EventBus.emit('AUDIO_TRACK_LOADED', index);
    }

    togglePlay() {
        this.initContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        if (this.isPlaying) {
            this.pause();
        } else {
            if (!this.audio.src && this.tracks.length > 0) this.loadTrack(this.currentTrackIdx);
            this.play();
        }
    }

    play() {
        if (!this.tracks || this.tracks.length === 0) return;
        this.audio.play().catch(e => console.error("❌ [AudioCore] Ошибка Play:", e));
        this.isPlaying = true;
        EventBus.emit('AUDIO_PLAY_STATE_CHANGED', true);
        EventBus.emit('SYS_LOG', { html: `[MUSIC] PLAYING: <span style="color:#fff">${this.tracks[this.currentTrackIdx].title}</span>` });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        EventBus.emit('AUDIO_PLAY_STATE_CHANGED', false);
        EventBus.emit('SYS_LOG', { html: `[MUSIC] STATUS: <span style="color:#fff">PAUSED</span>` });
    }

    next() {
        if (!this.tracks || this.tracks.length === 0) return;
        let nextIdx = this.currentTrackIdx + 1;
        if (nextIdx >= this.tracks.length) nextIdx = 0;
        this.loadTrack(nextIdx);
        this.play();
        EventBus.emit('SYS_LOG', { html: `[MUSIC] CMD: <span style="color:#fff">NEXT_TRACK >></span>` });
    }

    prev() {
        if (!this.tracks || this.tracks.length === 0) return;
        let prevIdx = this.currentTrackIdx - 1;
        if (prevIdx < 0) prevIdx = this.tracks.length - 1;
        this.loadTrack(prevIdx);
        this.play();
        EventBus.emit('SYS_LOG', { html: `[MUSIC] CMD: <span style="color:#fff"><< PREV_TRACK</span>` });
    }

    setVolume(vol) {
        this.audio.volume = Math.max(0, Math.min(1, vol));
    }

    seek(time) {
        if (!isNaN(this.audio.duration)) {
            this.audio.currentTime = time;
        }
    }

    getFrequencyData() {
        if (!this.isPlaying || !this.analyser || !this.dataArray) return null;
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}