/* js/audio-core.js */
import EventBus from './event-bus.js';
import { loadData } from './api.js';
import { AppConfig } from './config.js';

export class AudioCore {
    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audio.volume = 0.5;

        this.tracks = []; 
        this.currentTrackIdx = 0;
        this.isPlaying = false;

        this.audioCtx = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;

        this.initListeners();
    }

    async loadTracks() {
        try {
            const data = await loadData('music.json', AppConfig.audio.fallbackTracks);
            this.tracks = Array.isArray(data) && data.length > 0 ? data : AppConfig.audio.fallbackTracks;
            console.log(`🎵 [AudioCore] Загружено треков: ${this.tracks.length}`);
        } catch (error) {
            console.error("❌ [AudioCore] Ошибка загрузки плейлиста:", error);
            this.tracks = AppConfig.audio.fallbackTracks;
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
            console.log("🎵 [AudioCore] Web Audio API подключен для визуализатора");
        } catch (e) {
            console.error("❌ [AudioCore] Ошибка Web Audio API:", e);
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
        
        EventBus.emit('SYS_LOG', { type: 'system', tag: 'MUSIC', action: 'PLAYING', value: this.tracks[this.currentTrackIdx].title, color: 'var(--neon-pink)' });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        EventBus.emit('AUDIO_PLAY_STATE_CHANGED', false);
        
        EventBus.emit('SYS_LOG', { type: 'system', tag: 'MUSIC', action: 'STATUS', value: 'PAUSED', color: '#888' });
    }

    next() {
        if (!this.tracks || this.tracks.length === 0) return;
        let nextIdx = (this.currentTrackIdx + 1) % this.tracks.length;
        this.loadTrack(nextIdx);
        this.play();
        EventBus.emit('SYS_LOG', { type: 'system', tag: 'MUSIC', action: 'CMD', value: 'NEXT_TRACK >>', color: 'var(--neon-pink)' });
    }

    prev() {
        if (!this.tracks || this.tracks.length === 0) return;
        let prevIdx = (this.currentTrackIdx - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack(prevIdx);
        this.play();
        EventBus.emit('SYS_LOG', { type: 'system', tag: 'MUSIC', action: 'CMD', value: '<< PREV_TRACK', color: 'var(--neon-pink)' });
    }

    setVolume(vol) { this.audio.volume = Math.max(0, Math.min(1, vol)); }
    seek(time) { if (!isNaN(this.audio.duration)) this.audio.currentTime = time; }

    getFrequencyData() {
        if (!this.isPlaying || !this.analyser || !this.dataArray) return null;
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}