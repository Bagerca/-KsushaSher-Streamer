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
        
        // Сглаженные переменные для плавности анимации
        this.smoothedBeat = 0;
        this.smoothedMarkers = [0, 0, 0, 0, 0, 0];

        this.els = {
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
            // Убрали Math.round()! Теперь возвращаем точное значение с плавающей точкой.
            // Это полностью избавляет от микро-рывка при перехвате анимации.
            return Math.atan2(values[1], values[0]) * (180 / Math.PI);
        }
        return 0;
    }

    start() {
        this.ringRot1 = this.getComputedRotation(this.els.ring1);
        this.ringRot2 = this.getComputedRotation(this.els.ring2);
        this.ringRot3 = this.getComputedRotation(this.els.ring3);

        // Отключаем CSS анимацию вращения, теперь крутит JS
        [this.els.ring1, this.els.ring2, this.els.ring3].forEach(el => {
            if (el) el.style.animation = 'none';
        });

        // Отключаем "дыхание" контейнера, переводим в режим бита
        if (this.els.ringsContainer) {
            this.els.ringsContainer.classList.add('js-beat-controlled');
        }

        this.smoothedBeat = 0;
        this.smoothedMarkers.fill(0);
        this.loop();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Сброс аватара
        if (this.els.mainAvatar) this.els.mainAvatar.style.filter = '';
        
        // Возвращаем кольца в стандартный режим дыхания
        if (this.els.ringsContainer) {
            this.els.ringsContainer.style.transform = '';
            this.els.ringsContainer.style.removeProperty('--beat');
            this.els.ringsContainer.classList.remove('js-beat-controlled');
        }

        // Возвращаем вращение обратно CSS ключам (с точки, где остановил JS)
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

        // Сброс маркеров луча
        document.querySelectorAll('.nav-marker .nav-shape').forEach(shape => {
            shape.style.removeProperty('--audio-scale');
            shape.style.removeProperty('--audio-glow');
            shape.style.removeProperty('--audio-color');
        });
    }

    loop() {
        if (!this.isActive) return;
        this.animationId = requestAnimationFrame(() => this.loop());

        const dataArray = this.core.getFrequencyData();
        
        if (!dataArray) {
            if (this.els.mainAvatar) this.els.mainAvatar.style.filter = '';
            if (this.els.ringsContainer) {
                this.els.ringsContainer.style.removeProperty('--beat');
                this.els.ringsContainer.style.transform = '';
            }
            return;
        }

        // --- ВЫЧИСЛЕНИЯ БАСА ---
        let bassTotal = 0;
        for (let i = 0; i < 8; i++) bassTotal += dataArray[i];
        const bassAverage = bassTotal / 8;

        // 1. ИДЕАЛЬНЫЕ ТАНЦУЮЩИЕ МАРКЕРЫ (Сглаживание Lerp)
        const liveShapes = document.querySelectorAll('.nav-marker .nav-shape');
        if (liveShapes.length > 0) {
            const bands = [
                { start: 0, end: 2 },   { start: 3, end: 5 },   
                { start: 6, end: 10 },  { start: 11, end: 16 }, 
                { start: 17, end: 24 }, { start: 25, end: 31 }  
            ];

            liveShapes.forEach((shape, i) => {
                const band = bands[i % bands.length];
                let energy = 0;
                for (let j = band.start; j <= band.end; j++) {
                    energy += (dataArray[j] || 0);
                }
                const rawIntensity = (energy / (band.end - band.start + 1)) / 255;

                const smoothing = rawIntensity > this.smoothedMarkers[i] ? 0.6 : 0.1;
                this.smoothedMarkers[i] += (rawIntensity - this.smoothedMarkers[i]) * smoothing;
                const finalValue = this.smoothedMarkers[i];

                if (finalValue > 0.05) {
                    shape.style.setProperty('--audio-scale', finalValue * 0.8);
                    shape.style.setProperty('--audio-glow', `${finalValue * 25}px`);
                    shape.style.setProperty('--audio-color', `rgba(255, 45, 149, ${0.4 + finalValue * 0.6})`);
                } else {
                    shape.style.setProperty('--audio-scale', 0);
                    shape.style.setProperty('--audio-glow', '0px');
                    shape.style.removeProperty('--audio-color');
                }
            });
        }

        // 2. Аватар
        if (this.els.mainAvatar) {
            const sharpIntensity = Math.pow(bassAverage / 255, 2);
            this.els.mainAvatar.style.filter = `drop-shadow(0 0 ${10 + (sharpIntensity * 35)}px var(--neon-pink))`;
        }

        // 3. НОВАЯ ПЛАВНАЯ ЛОГИКА КОЛЕЦ (ВОЛНА)
        const rawBeat = Math.pow(bassAverage / 255, 2); 
        
        // Линейная интерполяция (Lerp): быстрый взрыв (0.6), плавное затухание (0.1)
        const beatSmoothing = rawBeat > this.smoothedBeat ? 0.6 : 0.1;
        this.smoothedBeat += (rawBeat - this.smoothedBeat) * beatSmoothing;
        
        if (this.els.ringsContainer) {
            // Легкое масштабирование самого контейнера для вайба
            this.els.ringsContainer.style.transform = `scale(${1 + this.smoothedBeat * 0.05})`;
            // ПРОКИДЫВАЕМ СГЛАЖЕННУЮ ПЕРЕМЕННУЮ В CSS
            this.els.ringsContainer.style.setProperty('--beat', this.smoothedBeat.toFixed(3));
        }

        // 4. Вращение
        const rotationSpeed = 0.5 + this.smoothedBeat * 3.0;
        this.ringRot1 += rotationSpeed;
        this.ringRot2 -= rotationSpeed * 1.1;
        this.ringRot3 += rotationSpeed * 0.4;

        // JS крутит кольца без CSS scale, так как scale применяется к родительскому контейнеру
        if (this.els.ring1) this.els.ring1.style.transform = `rotate(${this.ringRot1}deg)`;
        if (this.els.ring2) this.els.ring2.style.transform = `rotate(${this.ringRot2}deg)`;
        if (this.els.ring3) this.els.ring3.style.transform = `rotate(${this.ringRot3}deg)`;
    }
}