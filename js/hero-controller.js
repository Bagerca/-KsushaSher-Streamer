/* js/hero-controller.js */
import { AppConfig } from './config.js';
import EventBus from './event-bus.js';
import { Typewriter } from './utils/Typewriter.js'; // Подключаем наш новый модуль

export class HeroController {
    constructor() {
        this.els = {
            heroSection: document.querySelector('.hero-section-hud'),
            dataTicker: document.getElementById('data-ticker'),
            statusOuter: document.querySelector('.main-display-status'),
            statusInner: document.getElementById('live-status-container')
        };
        
        if (this.els.statusInner) {
            this.els.statusText = this.els.statusInner.querySelector('.status-text');
            this.els.statusDot = this.els.statusInner.querySelector('.status-indicator');
        }
        
        this.messages = AppConfig.texts.heroTicker || ["СИСТЕМЫ В НОРМЕ."];
        this.typewriter = null;

        this.init();
    }

    init() {
        if (!this.els.heroSection) return;
        
        // Инициализируем бегущую строку через наш новый класс
        if (this.els.dataTicker) {
            this.typewriter = new Typewriter(this.els.dataTicker);
            // Передаем функцию () => this.messages, чтобы при обновлении массива машинка подхватывала новые данные
            setTimeout(() => this.typewriter.loop(() => this.messages), 1000);
        }
        
        // Подписываемся на реальные данные с Twitch API
        EventBus.on('TWITCH_DATA_UPDATED', (data) => this.updateDynamicData(data));
    }

    updateDynamicData(data) {
        const formatNum = (num) => num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();

        // 1. Обновляем массив сообщений
        let newMessages = [
            "АНАЛИЗ СТАТИСТИКИ КАНАЛА...",
            `АГЕНТОВ В СЕТИ: ${formatNum(data.followers)}`,
            "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%"
        ];

        if (data.isLive) {
            newMessages.push(`ПРЯМАЯ ТРАНСЛЯЦИЯ: ${data.game.toUpperCase()}`);
            newMessages.push(`ЗРИТЕЛЕЙ В ЭФИРЕ: ${formatNum(data.viewers)}`);
        } else {
            newMessages.push("СИСТЕМЫ В НОРМЕ.");
            newMessages.push("ОЖИДАНИЕ СИГНАЛА СТРИМЕРА.");
        }

        this.messages = newMessages;

        // 2. Обновляем UI бейджа статуса
        if (this.els.statusText && this.els.statusDot && this.els.statusOuter) {
            const isLive = data.isLive;
            const color = isLive ? '#ff4444' : 'var(--neon-pink)';
            const text = isLive ? 'В ЭФИРЕ' : 'СИСТЕМА АКТИВНА';
            
            this.els.statusText.textContent = text;
            this.els.statusText.style.color = color;
            
            this.els.statusDot.style.background = color;
            this.els.statusDot.style.boxShadow = `0 0 10px ${color}`;
            
            this.els.statusOuter.style.borderColor = color;
            this.els.statusOuter.style.boxShadow = `0 0 15px ${isLive ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 45, 149, 0.2)'}`;
        }
    }
}