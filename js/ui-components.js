/* js/ui-components.js */
import EventBus from './event-bus.js';

export function initializeUI() {
    console.log('🎨 [UI] Инициализация базовых компонентов...');
    
    new GlobalScrollBooster();
    new SmoothScrollManager();
    new CryptoCardManager();
    new NavRailManager(); 
}

/**
 * ГЛОБАЛЬНЫЙ БУСТЕР СКРОЛЛА
 * Отключает pointer-events во время прокрутки колесика. 
 */
class GlobalScrollBooster {
    constructor() {
        this.scrollTimeout = null;
        this.isScrolling = false;
        
        window.addEventListener('scroll', () => {
            // Если идет автоматический скролл (по клику), бустер не вмешивается
            if (document.body.classList.contains('is-auto-scrolling')) return;

            if (!this.isScrolling) {
                this.isScrolling = true;
                document.body.classList.add('is-mouse-scrolling');
            }
            
            clearTimeout(this.scrollTimeout);
            
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
                document.body.classList.remove('is-mouse-scrolling');
            }, 150);
        }, { passive: true });
    }
}

/**
 * КИБЕР-ФИЗИКА СКРОЛЛА
 */
function customSmoothScroll(targetPosition, duration = 800) {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    // Свой независимый класс для автоскролла
    document.body.classList.add('is-auto-scrolling');

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        const ease = progress < 0.5 
            ? 8 * progress * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 4) / 2;

        window.scrollTo(0, startPosition + distance * ease);

        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        } else {
            // Снимаем блокировку только когда долетели
            document.body.classList.remove('is-auto-scrolling');
        }
    }
    requestAnimationFrame(animation);
}

class SmoothScrollManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (anchor && anchor.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                this.scrollTo(targetId);
            }
        });
    }

    scrollTo(targetId) {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();
        const viewOffset = window.innerHeight * 0.15; 
        let targetPosition = targetRect.top + window.scrollY - viewOffset;
        
        customSmoothScroll(Math.max(0, targetPosition), 800);
    }
}

/**
 * Менеджер Карты Крипто-Доната (REMASTERED 4.0)
 */
class CryptoCardManager {
    constructor() {
        this.cardElement = document.getElementById('card-number');
        this.chars = "ABCDEFGHJKLNPQRSTUVWXYZ0123456789#$<>[]/\\";
        this.isAnimating = false;
        
        this.rawNumber = '4276 1805 5058 1960';
        this.cleanNumber = '4276180550581960';
        this.originalHTML = `<span>4276</span><span>1805</span><span>5058</span><span>1960</span>`;
        this.successText = "СКОПИРОВАНО!";
        
        if (this.cardElement) this.init();
    }

    init() {
        this.digitsContainer = this.cardElement.querySelector('.card-digits');
        
        this.cardElement.addEventListener('click', () => {
            if (this.isAnimating) return; 
            this.isAnimating = true;
            
            navigator.clipboard.writeText(this.cleanNumber).then(() => {
                this.cardElement.classList.add('copied');
                this.digitsContainer.classList.add('success-mode');
                
                this.digitsContainer.style.whiteSpace = 'nowrap';
                this.digitsContainer.style.wordBreak = 'keep-all';
                
                this.runDecryptEffect(this.successText, () => {
                    setTimeout(() => {
                        this.runDecryptEffect(this.rawNumber, () => {
                            this.digitsContainer.style.whiteSpace = ''; 
                            this.digitsContainer.style.wordBreak = ''; 
                            this.digitsContainer.classList.remove('success-mode');
                            this.digitsContainer.innerHTML = this.originalHTML; 
                            this.cardElement.classList.remove('copied');
                            this.isAnimating = false;
                        });
                    }, 2000);
                });
            });
        });
    }

    runDecryptEffect(targetText, onComplete) {
        const startText = this.digitsContainer.innerText;
        const startLen = startText.length;
        const targetLen = targetText.length;
        
        const glitchWidth = 4; 
        const maxIters = Math.max(startLen, targetLen) + glitchWidth;
        let iterations = 0;
        
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            let displayText = "";
            const progress = Math.min(iterations / maxIters, 1);
            const currentLen = Math.floor(startLen + (targetLen - startLen) * progress);
            
            for (let i = 0; i < currentLen; i++) {
                if (i < iterations - glitchWidth) {
                    displayText += targetText[i] !== undefined ? targetText[i] : "";
                } else if (i < iterations) {
                    displayText += this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    displayText += startText[i] !== undefined ? startText[i] : "";
                }
            }
            
            this.digitsContainer.textContent = displayText.replace(/ /g, '\u00A0');
            iterations += 0.5; 
            
            if (iterations >= maxIters) { 
                clearInterval(this.intervalId);
                this.digitsContainer.textContent = targetText.replace(/ /g, '\u00A0'); 
                if (onComplete) onComplete();
            }
        }, 30); 
    }
}

/**
 * ОПТИМИЗИРОВАННЫЙ Менеджер Навигационного Луча
 */
class NavRailManager {
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
        this.currentActiveId = 'hero';
        
        this.init();
    }

    init() {
        this.rail = document.createElement('div');
        this.rail.className = 'cyber-nav-rail';
        this.rail.id = 'cyber-nav-rail';
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

        this.setupIntersectionObserver();
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateGeometryCache();
                this.distributeMarkers();
            }, 200);
        });

        EventBus.on('LAYOUT_CHANGED', () => {
            setTimeout(() => {
                this.updateGeometryCache();
                this.distributeMarkers();
            }, 350); 
        });

        this.updateLaserPosition = this.updateLaserPosition.bind(this);
        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateLaserPosition();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });

        setTimeout(() => {
            this.updateGeometryCache();
            this.distributeMarkers();
            this.updateLaserPosition();
        }, 500);
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-30% 0px -50% 0px', 
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveMarker(entry.target.id);
                }
            });
        }, options);

        this.sections.forEach(sec => {
            const el = document.getElementById(sec.id);
            if (el) observer.observe(el);
        });
    }

    setActiveMarker(sectionId) {
        this.currentActiveId = sectionId;
        this.sections.forEach(sec => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) marker.classList.toggle('active', sec.id === sectionId);
        });
    }

    updateGeometryCache() {
        try {
            this.sections.forEach(sec => {
                const el = document.getElementById(sec.id);
                if (el) this.geometryCache[sec.id] = el.offsetTop;
            });
        } catch(e) {
            console.warn("⚠️ [NavRail] Ошибка обновления кэша:", e);
        }
    }

    calculateExactTarget(sectionId) {
        if (this.geometryCache[sectionId] === undefined) return 0;

        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = Math.max(1, docHeight - winHeight);
        
        const topPos = this.geometryCache[sectionId];
        const viewOffset = winHeight * 0.15; 
        let targetScroll = topPos - viewOffset;

        if (sectionId === this.sections[0].id) targetScroll = 0;
        if (sectionId === this.sections[this.sections.length - 1].id) targetScroll = scrollableHeight;

        return Math.max(0, Math.min(scrollableHeight, targetScroll));
    }

    distributeMarkers() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = Math.max(1, docHeight - winHeight);

        this.sections.forEach((sec) => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) {
                const targetScroll = this.calculateExactTarget(sec.id);
                let markerDecimal = targetScroll / scrollableHeight;
                marker.style.setProperty('--marker-decimal', markerDecimal);
            }
        });
    }

    updateLaserPosition() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = Math.max(1, docHeight - winHeight);
        const scrolled = window.scrollY;

        let decimalPos = scrolled / scrollableHeight;
        decimalPos = Math.max(0, Math.min(1, decimalPos));
        
        this.rail.style.setProperty('--line-decimal', decimalPos);

        this.sections.forEach((sec) => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) {
                const markerDecimal = parseFloat(marker.style.getPropertyValue('--marker-decimal') || 0);
                let distancePct = Math.abs((decimalPos * 100) - (markerDecimal * 100));
                let proximity = Math.max(0, 1 - (distancePct / 15)); 
                proximity = Math.pow(proximity, 2).toFixed(3);
                marker.style.setProperty('--proximity', proximity);
            }
        });
    }
}