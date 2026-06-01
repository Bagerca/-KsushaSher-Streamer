/* js/matrix-engine.js */
import EventBus from './event-bus.js';

const SECRET_WORDS = [
    "KSUSHA", "SHER", "TETLA", "BAGERCA", "ANGEL", "KIRIKI", 
    "FOLLOW", "SUBSCRIBE", "DONATE", "LOVE", "MATRIX", "SYSTEM"
];
const CHARS = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export class MatrixEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.curtain = null;
        
        this.drops = [];
        this.activeEasterEggs = {};
        
        this.rafId = null;
        this.lastDrawTime = 0;
        this.fps = 30;
        this.interval = 1000 / this.fps;
        
        this.isGodMode = false;
        
        // Привязываем контекст для слушателей
        this.onResize = this.onResize.bind(this);
        this.toggleGodMode = this.toggleGodMode.bind(this);

        // Слушаем команды терминала напрямую
        EventBus.on('CMD_GOD', this.toggleGodMode);
        EventBus.on('CMD_GODMODE', this.toggleGodMode);
    }

    start() {
        if (this.canvas) return;

        // 1. Создаем Canvas
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        Object.assign(this.canvas.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-10', pointerEvents: 'none', opacity: '0.15'
        });
        document.body.appendChild(this.canvas);

        // 2. Создаем Шторку (Фон)
        this.curtain = document.createElement('div');
        Object.assign(this.curtain.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: '#050508', zIndex: '-5', pointerEvents: 'none',
            transition: 'opacity 2s ease-in-out', opacity: '1'
        });
        document.body.appendChild(this.curtain);

        // 3. Биндим события
        window.addEventListener('resize', this.onResize);
        this.onResize();

        // 4. Запускаем цикл
        this.lastDrawTime = performance.now();
        this.loop();
        
        console.log('🤖 [MatrixEngine] Запущен');
    }

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        if (this.curtain) {
            this.curtain.remove();
            this.curtain = null;
        }
        window.removeEventListener('resize', this.onResize);
        console.log('🤖 [MatrixEngine] Остановлен');
    }

    onResize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        const columns = Math.floor(this.canvas.width / 16);
        this.drops = new Array(columns).fill(1);
    }

    loop() {
        this.rafId = requestAnimationFrame(() => this.loop());

        const now = performance.now();
        const delta = now - this.lastDrawTime;

        // Дросселирование FPS
        if (delta > this.interval) {
            this.draw();
            this.lastDrawTime = now - (delta % this.interval);
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.fillStyle = 'rgba(5, 5, 8, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '14px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            let text = "";
            
            if (this.activeEasterEggs[i]) {
                const egg = this.activeEasterEggs[i];
                text = egg.word[egg.charIndex]; 
                this.ctx.fillStyle = egg.color; 
                this.activeEasterEggs[i].charIndex++;
                if (this.activeEasterEggs[i].charIndex >= egg.word.length) delete this.activeEasterEggs[i];
            } 
            else if (Math.random() > 0.999) {
                const randomWord = SECRET_WORDS[Math.floor(Math.random() * SECRET_WORDS.length)];
                const colors = ['#ff2d95', '#ffffff', '#ffd700']; 
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                this.activeEasterEggs[i] = { word: randomWord, charIndex: 0, color: randomColor };
                text = randomWord[0];
                this.ctx.fillStyle = randomColor;
                this.activeEasterEggs[i].charIndex++;
            }
            else {
                text = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
                this.ctx.fillStyle = '#0F0'; 
            }

            this.ctx.fillText(text, i * 16, this.drops[i] * 16);

            if (this.drops[i] * 16 > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
                if (this.activeEasterEggs[i]) delete this.activeEasterEggs[i];
            }
            this.drops[i]++;
        }
    }

    toggleGodMode() {
        this.isGodMode = !this.isGodMode;
        if (this.curtain) {
            this.curtain.style.opacity = this.isGodMode ? '0' : '1';
        }
        EventBus.emit('STATE_GODMODE_CHANGED', this.isGodMode);
    }
}