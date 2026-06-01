/* js/hero-controller.js */
export class HeroController {
    constructor() {
        this.scanline = document.querySelector('.hud-scanline');
        this.dataTicker = document.getElementById('data-ticker');
        this.heroSection = document.querySelector('.hero-section-hud');
        
        this.messages = [
            "АНАЛИЗ СТАТИСТИКИ КАНАЛА...", 
            "ПОДПИСЧИКОВ: 5.2K+", 
            "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%", 
            "АКТИВНОСТЬ ЧАТА: ВЫСОКАЯ", 
            "СИСТЕМЫ В НОРМЕ."
        ];
        
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