/* js/ui/nav-rail.js */
import EventBus from '../event-bus.js';
import { customSmoothScroll } from './scroll-physics.js';

export class NavRailManager {
    constructor() {
        this.sections = [
            { id: 'hero', label: 'ГЛАВНАЯ' },
            { id: 'about', label: 'ОБО МНЕ' },
            { id: 'command-center', label: 'КОМАНДНЫЙ ЦЕНТР' },
            { id: 'media-archive', label: 'БАЗА ДАННЫХ' },
            { id: 'specs', label: 'ЖЕЛЕЗО' },
            { id: 'donation', label: 'ДОНАТ' }
        ];
        
        this.ticking = false;    
        this.currentActiveId = null;
        
        this.init();
    }

    init() {
        this.rail = document.createElement('div');
        this.rail.className = 'cyber-nav-rail';
        this.rail.id = 'cyber-nav-rail';
        
        this.laserBeam = document.createElement('div');
        this.laserBeam.className = 'nav-laser-beam';
        this.rail.appendChild(this.laserBeam);

        document.body.appendChild(this.rail);

        this.sections.forEach(sec => {
            const marker = document.createElement('div');
            marker.className = 'nav-marker';
            marker.id = `nav-marker-${sec.id}`; 
            
            marker.innerHTML = `<div class="nav-shape"></div><div class="nav-tooltip">${sec.label}</div>`;
            
            marker.addEventListener('click', (e) => {
                e.preventDefault();
                // Используем сохраненные координаты для идеального скролла
                if (sec.targetScroll !== undefined) {
                    customSmoothScroll(sec.targetScroll, 800);
                }
            });
            
            this.rail.appendChild(marker);
        });

        // Слушаем изменения размера экрана для перерасчета координат
        this.resizeObserver = new ResizeObserver(() => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updatePositions();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });
        this.resizeObserver.observe(document.body);

        // Главный слушатель скролла
        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollState();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });

        // Перерасчет при изменении контента
        EventBus.on('LAYOUT_CHANGED', () => {
            setTimeout(() => this.updatePositions(), 300); 
        });

        setTimeout(() => this.updatePositions(), 500);
    }

    // Вычисляем и сохраняем точные координаты каждой секции
    updatePositions() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        
        this.sections.forEach((sec, index) => {
            const el = document.getElementById(sec.id);
            if (el) {
                let targetScroll = el.offsetTop - (winHeight * 0.15);
                if (index === 0) targetScroll = 0;
                if (index === this.sections.length - 1) targetScroll = maxScroll;

                sec.targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
                sec.decimal = sec.targetScroll / maxScroll;

                const marker = document.getElementById(`nav-marker-${sec.id}`);
                if (marker) {
                    marker.style.top = `${sec.decimal * 100}%`;
                }
            } else {
                sec.targetScroll = 0;
                sec.decimal = 0;
            }
        });
        
        // Сортируем массив строго по порядку скролла (защита от багов)
        this.sections.sort((a, b) => a.targetScroll - b.targetScroll);
        this.updateScrollState();
    }

    setActiveMarker(sectionId) {
        if (this.currentActiveId === sectionId) return;
        this.currentActiveId = sectionId;

        this.sections.forEach(s => {
            const marker = document.getElementById(`nav-marker-${s.id}`);
            if (marker) {
                marker.classList.toggle('active', s.id === sectionId);
            }
        });
    }

    // НОВАЯ МАТЕМАТИЧЕСКАЯ ЛОГИКА (Заменила глючный IntersectionObserver)
    updateScrollState() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        const scrollY = window.scrollY;

        let globalProgress = scrollY / maxScroll;
        globalProgress = Math.max(0, Math.min(1, globalProgress));

        // 1. Находим активную секцию (какая сейчас на экране)
        let activeIndex = 0;
        for (let i = this.sections.length - 1; i >= 0; i--) {
            if (scrollY >= this.sections[i].targetScroll - 5) {
                activeIndex = i;
                break;
            }
        }

        const activeSec = this.sections[activeIndex];
        this.setActiveMarker(activeSec.id);

        // 2. Луч заливается ровно от активной секции до следующей
        const startDecimal = activeSec.decimal;
        let endDecimal = startDecimal;

        if (activeIndex < this.sections.length - 1) {
            endDecimal = this.sections[activeIndex + 1].decimal;
        } else {
            // Для последней секции уводим луч в конец
            endDecimal = 1.0;
        }

        const beamHeight = endDecimal - startDecimal;

        // 3. Отправляем координаты в CSS
        this.rail.style.setProperty('--beam-top', startDecimal);
        this.rail.style.setProperty('--beam-height', beamHeight);

        // 4. Магнетизм (свечение маркеров при приближении скролла)
        this.sections.forEach(sec => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker && sec.decimal !== undefined) {
                let distance = Math.abs(globalProgress - sec.decimal);
                let proximity = Math.max(0, 1 - (distance * 6)); 
                proximity = Math.pow(proximity, 2).toFixed(3);
                marker.style.setProperty('--proximity', proximity);
            }
        });
    }
}

export function initNavRail() {
    new NavRailManager();
    console.log('🧭 [UI] Навигационный луч (Математический трекинг) инициализирован');
}