/* js/services/PreloaderController.js */
import EventBus from '../event-bus.js';

export class PreloaderController {
    
    static getTemplate() {
        return `
            <div class="preloader-core">
                <div class="preloader-rings"></div>
                <div class="preloader-fox">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
                        <g stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" fill="none" class="fox-mesh">
                            <polygon points="60,105 30,80 12,55 22,15 42,40 60,32 78,40 98,15 108,55 90,80" />
                            <polygon points="30,80 12,55 48,65" />
                            <polygon points="90,80 108,55 72,65" />
                            <polygon points="60,75 48,65 60,32 72,65" />
                            <polyline points="22,15 48,65 42,40" />
                            <polyline points="98,15 72,65 78,40" />
                            <polyline points="12,55 48,65 42,40" />
                            <polyline points="108,55 72,65 78,40" />
                        </g>
                        <g class="fox-eyes">
                            <polygon points="32,58 44,62 40,65 30,61" />
                            <polygon points="88,58 76,62 80,65 90,61" />
                        </g>
                    </svg>
                </div>
            </div>
            <div class="preloader-status">
                <div class="p-text">DECRYPTING CORE PROTOCOLS... [<span id="p-percent">0</span>%]</div>
                <div class="p-bar"><div class="p-bar-fill" id="p-bar-fill"></div></div>
                <div class="p-hint">Нажми любую клавишу для пропуска</div>
            </div>
        `;
    }

    static async init() {
        if (document.documentElement.classList.contains('skip-preloader')) {
            const preloader = document.getElementById('app-preloader');
            if (preloader) preloader.remove();
            return;
        }

        // Ждем загрузки шрифтов Google Fonts перед стартом анимации (предотвращает FOUC)
        try {
            await document.fonts.ready;
        } catch (e) {
            console.warn("[Preloader] Ошибка ожидания шрифтов", e);
        }
        
        this.runSequence();
    }

    static trigger() {
        let preloader = document.getElementById('app-preloader');
        
        if (!preloader) {
            preloader = document.createElement('div');
            preloader.id = 'app-preloader';
            preloader.innerHTML = this.getTemplate();
            document.body.appendChild(preloader);
        }
        
        preloader.classList.remove('flash', 'finished');
        preloader.style.display = 'flex';
        
        const percentEl = document.getElementById('p-percent');
        const fillEl = document.getElementById('p-bar-fill');
        if (percentEl) percentEl.textContent = '0';
        if (fillEl) fillEl.style.width = '0%';

        this.runSequence();
    }

    static runSequence() {
        const preloader = document.getElementById('app-preloader');
        if (!preloader) return;

        let progress = 0;
        const percentEl = document.getElementById('p-percent');
        const fillEl = document.getElementById('p-bar-fill');
        let isSkipped = false;
        let intervalId = null;

        const complete = () => {
            if (isSkipped) return;
            isSkipped = true;
            clearInterval(intervalId);
            
            if (percentEl) percentEl.textContent = '100';
            if (fillEl) fillEl.style.width = '100%';

            sessionStorage.setItem('tetla_os_booted', 'true');
            
            preloader.classList.add('flash');
            EventBus.emit('PLAY_SOUND', 'expand'); 

            setTimeout(() => {
                preloader.classList.add('finished');
                setTimeout(() => {
                    preloader.remove();
                }, 500); 
            }, 150);
        };

        const skipHandler = (e) => {
            if (e.type === 'keydown' && !['Escape', 'Enter', ' ', 'Spacebar'].includes(e.key)) return;
            complete();
            document.removeEventListener('click', skipHandler);
            document.removeEventListener('keydown', skipHandler);
        };

        document.addEventListener('click', skipHandler);
        document.addEventListener('keydown', skipHandler);

        intervalId = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 2; 
            
            if (progress >= 100) {
                progress = 100;
                complete();
                document.removeEventListener('click', skipHandler);
                document.removeEventListener('keydown', skipHandler);
            } else {
                if (percentEl && !isSkipped) percentEl.textContent = progress;
                if (fillEl && !isSkipped) fillEl.style.width = `${progress}%`;
            }
        }, 150);
    }
}