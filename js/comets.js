/* js/comets.js */

const COMET_COLORS = ['#39ff14', '#ff2d95', '#ff4444', '#ff8c00', '#007bff', '#00ffff', '#ffffff'];

export class CometEngine {
    constructor() {
        this.containerBg = document.getElementById('comet-system');
        this.resizeObserver = null;
        
        this.idleTimeoutId = null;
        this.showerIntervalId = null;
        this.activeComets = new Set();
        
        this.onResize = this.onResize.bind(this);
    }

    startIdle() {
        if (!this.containerBg) return;

        Object.assign(this.containerBg.style, {
            position: 'absolute', top: '0', left: '0', width: '100%',
            zIndex: '0', pointerEvents: 'none', overflow: 'hidden'
        });

        this.onResize();
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(document.body);
        window.addEventListener('resize', this.onResize);

        this.scheduleNextIdleCycle();
        console.log('🌠 [CometEngine] Фоновый режим запущен');
    }

    stopIdle() {
        if (this.idleTimeoutId) clearTimeout(this.idleTimeoutId);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        window.removeEventListener('resize', this.onResize);
        
        // Не удаляем кометы сразу, позволяем им долететь (красивее)
    }

    triggerShower() {
        if (!this.containerBg) return;
        this.stopShower(); // сброс если уже идет

        console.log("🌠 [CometEngine] Шторм начат!");
        const duration = 10000;
        const startTime = Date.now();

        this.showerIntervalId = setInterval(() => {
            if (Date.now() - startTime > duration) {
                this.stopShower(); 
                return;
            }
            const batchSize = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < batchSize; i++) this.spawnComet(null, true);
        }, 100);
    }

    stopShower() {
        if (this.showerIntervalId) {
            clearInterval(this.showerIntervalId);
            this.showerIntervalId = null;
            console.log("🌠 [CometEngine] Шторм окончен");
        }
    }

    scheduleNextIdleCycle() {
        const delay = Math.random() * 30000 + 30000; 
        this.idleTimeoutId = setTimeout(() => {
            if (!this.showerIntervalId) {
                const count = Math.random() > 0.7 ? 2 : 1;
                const side = Math.floor(Math.random() * 4);
                for (let i = 0; i < count; i++) {
                    setTimeout(() => this.spawnComet(side), i * 300); 
                }
            }
            this.scheduleNextIdleCycle();
        }, delay);
    }

    spawnComet(forcedSide = null, isFast = false) {
        if (!this.containerBg) return;

        const comet = document.createElement('div');
        comet.className = 'comet';
        
        const color = COMET_COLORS[Math.floor(Math.random() * COMET_COLORS.length)];
        comet.style.color = color;
        comet.style.background = `linear-gradient(90deg, transparent, ${color}, #fff)`;
        
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scrollY = window.scrollY;
        const offset = 150; 

        const side = forcedSide !== null ? forcedSide : Math.floor(Math.random() * 4);
        let startX, startY, endX, endY;

        switch(side) {
            case 0: startX = Math.random() * w; startY = scrollY - offset; endX = Math.random() * w; endY = scrollY + h + offset; break;
            case 1: startX = w + offset; startY = scrollY + Math.random() * h; endX = -offset; endY = scrollY + Math.random() * h; break;
            case 2: startX = Math.random() * w; startY = scrollY + h + offset; endX = Math.random() * w; endY = scrollY - offset; break;
            case 3: startX = -offset; startY = scrollY + Math.random() * h; endX = w + offset; endY = scrollY + Math.random() * h; break;
        }

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        let speedBase = isFast ? (Math.random() * 0.8 + 1.2) : (Math.random() * 0.3 + 0.2);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = distance / speedBase;

        const length = Math.min(Math.max(speedBase * 300, 150), 600);
        const thickness = (Math.random() * 2 + 1);

        comet.style.width = `${length}px`;
        comet.style.height = `${thickness}px`;

        this.containerBg.appendChild(comet);
        this.activeComets.add(comet);

        const animation = comet.animate([
            { transform: `translate(${startX}px, ${startY}px) rotate(${angle}deg)`, opacity: 0 },
            { transform: `translate(${startX + deltaX * 0.15}px, ${startY + deltaY * 0.15}px) rotate(${angle}deg)`, opacity: 1, offset: 0.1 },
            { transform: `translate(${endX}px, ${endY}px) rotate(${angle}deg)`, opacity: 0 }
        ], { duration: duration, easing: 'linear' });

        animation.onfinish = () => {
            if (comet.parentNode) comet.remove();
            this.activeComets.delete(comet);
        };
    }

    onResize() {
        if (!this.containerBg) return;
        const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        this.containerBg.style.height = `${docHeight}px`;
    }
}