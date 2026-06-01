/* js/audio-visualizer.js */
import EventBus from './event-bus.js';

export class AudioVisualizer {
    constructor(audioCore) {
        this.core = audioCore;
        this.animationId = null;
        this.isActive = false;

        this.ringRot1 = 0;
        this.ringRot2 = 0;
        this.ringRot3 = 0;

        this.els = {
            waveformContainer: document.querySelector('.sync-waveform'),
            waveformBars: document.querySelectorAll('.sync-waveform .bar'),
            ringsContainer: document.querySelector('.main-display-rings'),
            mainAvatar: document.querySelector('.main-display-avatar'),
            ring1: document.querySelector('.ring-1'),
            ring2: document.querySelector('.ring-2'),
            ring3: document.querySelector('.ring-3')
        };

        this.injectSeamlessKeyframes();
        this.initListeners();
    }

    injectSeamlessKeyframes() {
        if (document.getElementById('seamless-rotation-style')) return;
        const style = document.createElement('style');
        style.id = 'seamless-rotation-style';
        style.innerHTML = `
            @keyframes rotate-seamless {
                from { transform: rotate(var(--rot-start, 0deg)); }
                to { transform: rotate(calc(var(--rot-start, 0deg) + 360deg)); }
            }
        `;
        document.head.appendChild(style);
    }

    initListeners() {
        EventBus.on('STATE_MUSIC_CHANGED', (isActive) => {
            this.isActive = isActive;
            if (isActive) {
                this.start();
            } else {
                this.stop();
            }
        });
    }

    getComputedRotation(el) {
        if (!el) return 0;
        const style = window.getComputedStyle(el);
        const transform = style.transform || style.webkitTransform;
        if (transform !== 'none') {
            const values = transform.split('(')[1].split(')')[0].split(',');
            return Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
        }
        return 0;
    }

    start() {
        // Подхватываем текущий угол вращения CSS-анимации, чтобы JS не дергал кольца
        this.ringRot1 = this.getComputedRotation(this.els.ring1);
        this.ringRot2 = this.getComputedRotation(this.els.ring2);
        this.ringRot3 = this.getComputedRotation(this.els.ring3);

        [this.els.ring1, this.els.ring2, this.els.ring3].forEach(el => {
            if (el) el.style.animation = 'none';
        });

        this.loop();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Сброс интерфейса
        this.els.waveformBars.forEach(bar => { bar.style.height = '4px'; });
        if (this.els.waveformContainer) this.els.waveformContainer.classList.remove('js-controlled');
        if (this.els.mainAvatar) this.els.mainAvatar.style.filter = '';
        if (this.els.ringsContainer) this.els.ringsContainer.style.transform = '';

        // Возврат плавного CSS вращения с текущей точки
        if (this.els.ring1) {
            this.els.ring1.style.setProperty('--rot-start', `${this.ringRot1 % 360}deg`);
            this.els.ring1.style.animationName = 'rotate-seamless';
            this.els.ring1.style.transform = '';
        }
        if (this.els.ring2) {
            this.els.ring2.style.setProperty('--rot-start', `${this.ringRot2 % 360}deg`);
            this.els.ring2.style.animationName = 'rotate-seamless';
            this.els.ring2.style.transform = '';
        }
        if (this.els.ring3) {
            this.els.ring3.style.setProperty('--rot-start', `${this.ringRot3 % 360}deg`);
            this.els.ring3.style.animationName = 'rotate-seamless';
            this.els.ring3.style.transform = '';
        }

        // Сброс маркеров навигации
        document.querySelectorAll('.nav-marker .nav-shape').forEach(shape => {
            if (shape.dataset.pulseTimer) clearTimeout(parseInt(shape.dataset.pulseTimer));
            shape.style = '';
        });
    }

    loop() {
        if (!this.isActive) return;
        this.animationId = requestAnimationFrame(() => this.loop());

        const dataArray = this.core.getFrequencyData();
        
        if (!dataArray) {
            // Если звук на паузе, но режим активен
            this.els.waveformBars.forEach(bar => { bar.style.height = '4px'; });
            if (this.els.waveformContainer) this.els.waveformContainer.classList.remove('js-controlled');
            if (this.els.mainAvatar) this.els.mainAvatar.style.filter = '';
            return;
        }

        // --- ВЫЧИСЛЕНИЯ ---
        let bassTotal = 0;
        for (let i = 0; i < 8; i++) bassTotal += dataArray[i];
        const bassAverage = bassTotal / 8;

        // 1. Волны
        this.els.waveformBars.forEach((bar, index) => {
            let value = dataArray[index] || 0;
            let heightPercent = (value / 255) * 100;
            bar.style.height = heightPercent < 2 ? '4px' : `${heightPercent}%`;
        });
        if (this.els.waveformContainer) this.els.waveformContainer.classList.add('js-controlled');

        // 2. Навигационные маркеры
        const liveShapes = document.querySelectorAll('.nav-marker .nav-shape');
        if (liveShapes.length > 0) {
            const freqBands = [
                { start: 0, end: 4, threshold: 0.4 }, { start: 2, end: 6, threshold: 0.35 },
                { start: 4, end: 8, threshold: 0.3 }, { start: 6, end: 12, threshold: 0.3 },
                { start: 8, end: 16, threshold: 0.3 }, { start: 0, end: 5, threshold: 0.4 }
            ];

            liveShapes.forEach((shape, i) => {
                const band = freqBands[i % freqBands.length];
                let energy = 0;
                for (let j = band.start; j <= Math.min(band.end, dataArray.length - 1); j++) energy += dataArray[j];
                
                const avgIntensity = (energy / (band.end - band.start + 1)) / 255;

                if (avgIntensity > band.threshold) {
                    if (shape.dataset.pulseTimer) clearTimeout(parseInt(shape.dataset.pulseTimer));
                    shape.style.borderColor = 'var(--neon-green)';
                    shape.style.backgroundColor = 'var(--neon-green)';
                    shape.style.boxShadow = `0 0 ${25 * avgIntensity}px var(--neon-green)`;
                    shape.style.transform = `rotate(45deg) scale(${1.1 + (avgIntensity * 0.5)})`;
                    
                    shape.dataset.pulseTimer = setTimeout(() => { shape.style = ''; }, 100);
                }
            });
        }

        // 3. Аватар
        if (this.els.mainAvatar) {
            const sharpIntensity = Math.pow(bassAverage / 255, 2);
            this.els.mainAvatar.style.filter = `drop-shadow(0 0 ${10 + (sharpIntensity * 35)}px var(--neon-pink))`;
        }

        // 4. Кольца
        if (this.els.ringsContainer) {
            this.els.ringsContainer.style.transform = `scale(${bassAverage > 40 ? 1 + (bassAverage / 255) * 0.3 : 1})`;
        }

        const rotationSpeed = 0.5 + (bassAverage / 255) * 3.0;
        this.ringRot1 += rotationSpeed;
        this.ringRot2 -= rotationSpeed * 1.1;
        this.ringRot3 += rotationSpeed * 0.4;

        if (this.els.ring1) this.els.ring1.style.transform = `rotate(${this.ringRot1}deg)`;
        if (this.els.ring2) this.els.ring2.style.transform = `rotate(${this.ringRot2}deg)`;
        if (this.els.ring3) this.els.ring3.style.transform = `rotate(${this.ringRot3}deg)`;
    }
}