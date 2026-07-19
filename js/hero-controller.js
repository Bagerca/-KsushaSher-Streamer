/* js/hero-controller.js */
import { AppConfig } from './config.js';
import EventBus from './event-bus.js';

export class HeroController {
    constructor() {
        this.scanline = document.querySelector('.hud-scanline');
        this.dataTicker = document.getElementById('data-ticker');
        this.heroSection = document.querySelector('.hero-section-hud');
        
        // ПРАВИЛЬНАЯ ПРИВЯЗКА:
        // statusOuter - это внешняя "таблетка" (меняем ей рамку и свечение)
        this.statusOuter = document.querySelector('.main-display-status');
        // statusInner - это внутренний блок (меняем там текст и точку)
        this.statusInner = document.getElementById('live-status-container');
        
        if (this.statusInner) {
            this.statusText = this.statusInner.querySelector('.status-text');
            this.statusDot = this.statusInner.querySelector('.status-indicator');
        }
        
        this.messages = AppConfig.texts.heroTicker || ["СИСТЕМЫ В НОРМЕ."];
        
        this.messageIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        this.typingTimeout = null;

        this.init();
    }

    init() {
        if (!this.heroSection) return;
        if (this.scanline) this.initScanline();
        if (this.dataTicker) setTimeout(() => this.typeData(), 1000);
        
        // Подписываемся на реальные данные с Twitch API
        EventBus.on('TWITCH_DATA_UPDATED', (data) => this.updateDynamicData(data));
    }

    updateDynamicData(data) {
        // Функция для красивых чисел (5200 -> 5.2K)
        const formatNum = (num) => num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();

        // 1. ПЕРЕСБОРКА БЕГУЩЕЙ СТРОКИ С РЕАЛЬНЫМИ ЦИФРАМИ
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

        // 2. СМЕНА БЕЙДЖИКА СТАТУСА (Красим ВНЕШНЮЮ рамку)
        if (this.statusText && this.statusDot && this.statusOuter) {
            if (data.isLive) {
                this.statusText.textContent = "В ЭФИРЕ";
                this.statusText.style.color = "#ff4444";
                
                this.statusDot.style.background = "#ff4444";
                this.statusDot.style.boxShadow = "0 0 10px #ff4444";
                
                // Применяем свечение к внешнему контейнеру
                this.statusOuter.style.borderColor = "#ff4444";
                this.statusOuter.style.boxShadow = "0 0 15px rgba(255, 68, 68, 0.3)";
            } else {
                this.statusText.textContent = "СИСТЕМА АКТИВНА";
                this.statusText.style.color = "var(--neon-pink)";
                
                this.statusDot.style.background = "var(--neon-pink)";
                this.statusDot.style.boxShadow = "0 0 10px var(--neon-pink)";
                
                // Применяем свечение к внешнему контейнеру
                this.statusOuter.style.borderColor = "var(--neon-pink)";
                this.statusOuter.style.boxShadow = "0 0 15px rgba(255, 45, 149, 0.2)";
            }
        }
    }

    initScanline() {
        let lastScanTime = 0;
        const scanSpeed = 0.05;
        
        const animate = (timestamp) => {
            if (!lastScanTime) lastScanTime = timestamp;
            const deltaTime = timestamp - lastScanTime;
            lastScanTime = timestamp;
            
            let currentTop = parseFloat(getComputedStyle(this.scanline).top) || 0;
            currentTop += scanSpeed * deltaTime;
            
            if (currentTop > this.heroSection.offsetHeight) {
                currentTop = -this.scanline.offsetHeight;
            }
            
            this.scanline.style.top = `${currentTop}px`;
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    typeData() {
        clearTimeout(this.typingTimeout);
        
        // Защита от сбоя, если длина массива изменилась на лету
        this.messageIndex = this.messageIndex % this.messages.length;
        const fullMessage = this.messages[this.messageIndex];
        
        let currentMessage = this.isDeleting 
            ? fullMessage.substring(0, this.charIndex--) 
            : fullMessage.substring(0, this.charIndex++);
        
        this.dataTicker.textContent = currentMessage + '|';
        
        let typeSpeed = this.isDeleting ? 30 : 80;
        
        if (!this.isDeleting && this.charIndex === fullMessage.length + 1) { 
            this.isDeleting = true; 
            typeSpeed = 2000; // Пауза в конце слова
        } else if (this.isDeleting && this.charIndex === -1) { 
            this.isDeleting = false; 
            this.messageIndex = (this.messageIndex + 1) % this.messages.length; 
        }
        
        this.typingTimeout = setTimeout(() => this.typeData(), typeSpeed);
    }
}