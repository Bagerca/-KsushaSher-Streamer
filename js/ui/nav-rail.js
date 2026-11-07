/* js/ui/nav-rail.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js'; 
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
        this.isReady = false; 
        this.lastDocHeight = 0; 
        
        this.init();
    }

    init() {
        this.rail = document.createElement('div');
        this.rail.className = 'cyber-nav-rail';
        this.rail.id = 'cyber-nav-rail';
        
        this.rail.style.opacity = '0';
        this.rail.style.transition = 'opacity 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';

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
                if (sec.targetScroll !== undefined) {
                    customSmoothScroll(sec.targetScroll, 800);
                }
            });
            
            this.rail.appendChild(marker);
        });

        this.resizeObserver = new ResizeObserver(() => this.requestUpdate());
        this.resizeObserver.observe(document.documentElement);
        this.resizeObserver.observe(document.body);

        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollState();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });

        EventBus.on('LAYOUT_CHANGED', () => this.requestUpdate(true));
        EventBus.on('MEDIA_STORE_LOADED', () => this.requestUpdate(true));
        EventBus.on('TWITCH_DATA_UPDATED', () => this.requestUpdate(true));

        setInterval(() => {
            const currentHeight = document.documentElement.scrollHeight;
            if (currentHeight !== this.lastDocHeight) {
                this.requestUpdate();
            }
        }, 500);

        window.addEventListener('load', () => this.requestUpdate(true));
        this.requestUpdate(true);
    }

    requestUpdate(force = false) {
        if (force || !this.ticking) {
            window.requestAnimationFrame(() => {
                this.updatePositions();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updatePositions() {
        const currentPath = AppStore.getState().route.path;
        const isDashboard = currentPath === '/' || (currentPath.startsWith('/archive') && !currentPath.startsWith('/item'));

        if (isDashboard && !document.body.classList.contains('route-dashboard')) {
            document.body.classList.add('route-dashboard');
        }

        if (!isDashboard) {
            this.rail.style.opacity = '0';
            this.isReady = false;
            return;
        }

        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = docHeight - winHeight;
        
        this.lastDocHeight = docHeight; 

        if (maxScroll <= 0) {
            this.rail.style.opacity = '0';
            this.isReady = false;
            return;
        }

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
        
        this.sections.sort((a, b) => a.targetScroll - b.targetScroll);
        
        if (!this.isReady) {
            this.isReady = true;
            this.rail.style.opacity = '1';
        }

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

    updateScrollState() {
        if (!document.body.classList.contains('route-dashboard') || !this.isReady) return;

        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        const scrollY = window.scrollY;

        let globalProgress = scrollY / maxScroll;
        globalProgress = Math.max(0, Math.min(1, globalProgress));

        let activeIndex = 0;
        for (let i = this.sections.length - 1; i >= 0; i--) {
            if (scrollY >= this.sections[i].targetScroll - 5) {
                activeIndex = i;
                break;
            }
        }

        const activeSec = this.sections[activeIndex];
        this.setActiveMarker(activeSec.id);

        const startDecimal = activeSec.decimal;
        let endDecimal = startDecimal;
        let localProgress = 0;

        if (activeIndex < this.sections.length - 1) {
            const nextSec = this.sections[activeIndex + 1];
            endDecimal = nextSec.decimal;
            
            const segmentHeight = nextSec.targetScroll - activeSec.targetScroll;
            if (segmentHeight > 0) {
                localProgress = (scrollY - activeSec.targetScroll) / segmentHeight;
                localProgress = Math.max(0, Math.min(1, localProgress));
            }
        } else {
            endDecimal = 1.0;
            localProgress = 1;
        }

        const beamHeight = endDecimal - startDecimal;

        this.rail.style.setProperty('--beam-top', startDecimal);
        this.rail.style.setProperty('--beam-height', beamHeight);
        // Передаем в CSS прогресс текущего отрезка для градиентного лазера
        this.rail.style.setProperty('--beam-progress', localProgress.toFixed(3));

        this.sections.forEach((sec, idx) => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (!marker || sec.decimal === undefined) return;
            
            let proximity = 0;
            
            if (idx === activeIndex) {
                proximity = 1;
            } else if (idx === activeIndex + 1) {
                // Эффект зажигания: плавно разгорается вместе с приближением луча
                proximity = Math.pow(localProgress, 1.5);
            } else {
                // Остальные маркеры просто мягко гаснут от расстояния
                let distance = Math.abs(globalProgress - sec.decimal);
                proximity = Math.max(0, 1 - (distance * 4)); 
                proximity = Math.pow(proximity, 3);
            }
            
            marker.style.setProperty('--proximity', proximity.toFixed(3));
        });
    }
}

export function initNavRail() {
    const railInstance = new NavRailManager();
    console.log('🧭 [UI] Навигационный луч инициализирован (Dynamic Gradient Mode)');
    return railInstance;
}