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
        
        this.geometryCache = {}; 
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
            marker.style.setProperty('--marker-decimal', 0); 

            marker.innerHTML = `<div class="nav-shape"></div><div class="nav-tooltip">${sec.label}</div>`;
            
            marker.addEventListener('click', (e) => {
                e.preventDefault();
                this.updateGeometryCache();
                const targetScroll = this.calculateExactTarget(sec.id);
                customSmoothScroll(targetScroll, 1000); 
            });
            
            this.rail.appendChild(marker);
        });

        this.resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                this.updateGeometryCache();
                this.distributeMarkers();
                this.updateOnScroll();
            });
        });
        this.resizeObserver.observe(document.body);

        EventBus.on('LAYOUT_CHANGED', () => {
            setTimeout(() => {
                this.updateGeometryCache();
                this.distributeMarkers();
                this.updateOnScroll();
            }, 350); 
        });

        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateOnScroll();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });

        setTimeout(() => {
            this.updateGeometryCache();
            this.distributeMarkers();
            this.updateOnScroll();
        }, 500);
    }

    updateGeometryCache() {
        try {
            this.sections.forEach(sec => {
                const el = document.getElementById(sec.id);
                if (el) {
                    this.geometryCache[sec.id] = el.offsetTop;
                }
            });
        } catch(e) {
            console.warn("⚠️ [NavRail] Ошибка обновления кэша:", e);
        }
    }

    calculateExactTarget(sectionId) {
        if (this.geometryCache[sectionId] === undefined) return 0;

        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        
        const topPos = this.geometryCache[sectionId];
        const viewOffset = winHeight * 0.15; 
        let targetScroll = topPos - viewOffset;

        if (sectionId === this.sections[0].id) targetScroll = 0;
        if (sectionId === this.sections[this.sections.length - 1].id) targetScroll = maxScroll;

        return Math.max(0, Math.min(maxScroll, targetScroll));
    }

    distributeMarkers() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);

        this.sections.forEach((sec) => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) {
                const targetScroll = this.calculateExactTarget(sec.id);
                const markerDecimal = targetScroll / maxScroll;
                marker.style.setProperty('--marker-decimal', markerDecimal);
                sec.decimal = markerDecimal;
            }
        });
    }

    updateOnScroll() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        const scrollY = window.scrollY;

        let decimalPos = scrollY / maxScroll;
        decimalPos = Math.max(0, Math.min(1, decimalPos));
        
        this.rail.style.setProperty('--line-decimal', decimalPos);

        this.sections.forEach((sec) => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker && sec.decimal !== undefined) {
                let distancePct = Math.abs((decimalPos * 100) - (sec.decimal * 100));
                let proximity = Math.max(0, 1 - (distancePct / 15)); 
                proximity = Math.pow(proximity, 2).toFixed(3);
                marker.style.setProperty('--proximity', proximity);
            }
        });

        let activeIndex = 0;
        for (let i = this.sections.length - 1; i >= 0; i--) {
            const sec = this.sections[i];
            const targetScroll = this.calculateExactTarget(sec.id);
            
            if (scrollY >= targetScroll - 50) {
                activeIndex = i;
                break;
            }
        }

        const activeSec = this.sections[activeIndex];
        
        if (this.currentActiveId !== activeSec.id) {
            this.currentActiveId = activeSec.id;
            
            this.sections.forEach(s => {
                const m = document.getElementById(`nav-marker-${s.id}`);
                if (m) m.classList.toggle('active', s.id === activeSec.id);
            });
        }

        if (activeSec && activeSec.decimal !== undefined) {
            const startDecimal = activeSec.decimal;
            let endDecimal = 1;

            if (activeIndex < this.sections.length - 1) {
                endDecimal = this.sections[activeIndex + 1].decimal || 1;
            }

            const heightDecimal = endDecimal - startDecimal;
            this.rail.style.setProperty('--beam-top', startDecimal);
            this.rail.style.setProperty('--beam-height', heightDecimal);
        }
    }
}

export function initNavRail() {
    new NavRailManager();
    console.log('🧭 [UI] Навигационный луч инициализирован');
}