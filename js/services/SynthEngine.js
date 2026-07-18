/* js/services/SynthEngine.js */
import EventBus from '../event-bus.js';

/**
 * Легковесный синтезатор системных звуков на основе Web Audio API.
 * Генерирует звуки (клики, ховеры) на лету без загрузки внешних MP3 файлов.
 */
export class SynthEngine {
    constructor() {
        this.audioCtx = null;
        this.initListeners();
        console.log("🎹 [SynthEngine] Сервис UI звуков инициализирован");
    }

    initContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    initListeners() {
        EventBus.on('PLAY_SOUND', (type) => this.playSound(type));
        
        // Разблокировка аудио контекста по первому клику пользователя
        document.addEventListener('click', () => this.initContext(), { once: true });
    }

    playSound(type) {
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            const now = this.audioCtx.currentTime;

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
            } 
            else if (type === 'hover') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
                gainNode.gain.setValueAtTime(0.02, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.start(now); osc.stop(now + 0.04);
            }
            else if (type === 'expand') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(350, now + 0.25);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now); osc.stop(now + 0.25);
            }
        } catch (e) {
            console.warn("⚠️ [SynthEngine] Ошибка синтезатора:", e.message);
        }
    }
}