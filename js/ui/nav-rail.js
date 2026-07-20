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
        this.observer = null;
        
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
                const targetScroll = this.calculateTargetScroll(sec.id);
                customSmoothScroll(targetScroll, 1000);
            });
            
            this.rail.appendChild(marker);
        });

        this.setupIntersectionObserver();

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

        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollMagnetism();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });

        EventBus.on('LAYOUT_CHANGED', () => {
            setTimeout(() => this.updatePositions(), 300); 
        });

        setTimeout(() => this.updatePositions(), 500);
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-30% 0px -50% 0px', 
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveMarker(entry.target.id);
                }
            });
        }, options);

        this.sections.forEach(sec => {
            const el = document.getElementById(sec.id);
            if (el) this.observer.observe(el);
        });
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
        
        // Как только меняется секция — перерисовываем луч
        this.updateBeam();
    }

    calculateTargetScroll(sectionId) {
        const el = document.getElementById(sectionId);
        if (!el) return 0;

        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        
        const viewOffset = winHeight * 0.15; 
        let targetScroll = el.offsetTop - viewOffset;

        if (sectionId === this.sections[0].id) targetScroll = 0;
        if (sectionId === this.sections[this.sections.length - 1].id) targetScroll = maxScroll;

        return Math.max(0, Math.min(maxScroll, targetScroll));
    }

    updatePositions() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        
        this.sections.forEach(sec => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) {
                const targetScroll = this.calculateTargetScroll(sec.id);
                const markerDecimal = targetScroll / maxScroll;
                const safeDecimal = Math.max(0, Math.min(1, markerDecimal));
                
                marker.style.top = `${safeDecimal * 100}%`;
                sec.decimal = safeDecimal;
            }
        });
        
        this.updateScrollMagnetism();
        this.updateBeam();
    }

    // НОВАЯ ЛОГИКА: Растягиваем луч на размер текущей секции
    updateBeam() {
        if (!this.currentActiveId) return;
        
        const activeIndex = this.sections.findIndex(s => s.id === this.currentActiveId);
        if (activeIndex === -1) return;

        const activeSec = this.sections[activeIndex];
        const startDecimal = activeSec.decimal || 0;
        let endDecimal = 1;

        if (activeIndex < this.sections.length - 1) {
            endDecimal = this.sections[activeIndex + 1].decimal || 1;
        }

        const heightDecimal = endDecimal - startDecimal;

        this.rail.style.setProperty('--beam-top', startDecimal);
        this.rail.style.setProperty('--beam-height', heightDecimal);
    }

    updateScrollMagnetism() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        const scrollY = window.scrollY;

        let scrollPercentage = scrollY / maxScroll;
        scrollPercentage = Math.max(0, Math.min(1, scrollPercentage)); 
        
        this.sections.forEach(sec => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker && sec.decimal !== undefined) {
                let distance = Math.abs(scrollPercentage - sec.decimal);
                let proximity = Math.max(0, 1 - (distance * 6)); 
                proximity = Math.pow(proximity, 2).toFixed(3);
                marker.style.setProperty('--proximity', proximity);
            }
        });
    }
}

export function initNavRail() {
    new NavRailManager();
    console.log('🧭 [UI] Навигационный луч (Секционный) инициализирован');
}