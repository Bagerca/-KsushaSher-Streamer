/* js/ui-components.js */
import EventBus from './event-bus.js';

export function initializeUI() {
    console.log('🎨 [UI] Инициализация базовых компонентов...');
    
    new SmoothScrollManager();
    new CryptoCardManager();
    new NavRailManager(); 
}

/**
 * КИБЕР-ФИЗИКА СКРОЛЛА
 */
function customSmoothScroll(targetPosition, duration = 800) {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    document.body.classList.add('is-scrolling');

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
            document.body.classList.remove('is-scrolling');
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
 * Менеджер Карты Крипто-Доната (REMASTERED 4.0: Non-Breaking Glitch)
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
                
                // Подстраховка через CSS
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
        
        const glitchWidth = 4; // Ширина "волны" случайных символов
        const maxIters = Math.max(startLen, targetLen) + glitchWidth;
        let iterations = 0;
        
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            let displayText = "";
            const progress = Math.min(iterations / maxIters, 1);
            
            // Плавное изменение длины строки от 19 символов к 12 (или наоборот)
            const currentLen = Math.floor(startLen + (targetLen - startLen) * progress);
            
            for (let i = 0; i < currentLen; i++) {
                if (i < iterations - glitchWidth) {
                    // Зона 1: Расшифровано (Слева)
                    displayText += targetText[i] !== undefined ? targetText[i] : "";
                } else if (i < iterations) {
                    // Зона 2: Волна глитча (По центру)
                    displayText += this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    // Зона 3: Старый текст не тронут (Справа)
                    displayText += startText[i] !== undefined ? startText[i] : "";
                }
            }
            
            // АБСОЛЮТНАЯ ЗАЩИТА ОТ ПЕРЕНОСОВ СТРОК:
            // Заменяем все пробелы на неразрывные пробелы (\u00A0). 
            // textContent используется вместо innerText, чтобы браузер не пытался парсить HTML
            this.digitsContainer.textContent = displayText.replace(/ /g, '\u00A0');
            
            iterations += 0.5; // Скорость волны
            
            if (iterations >= maxIters) { 
                clearInterval(this.intervalId);
                // Финальный текст тоже вставляем с защитой от переносов
                this.digitsContainer.textContent = targetText.replace(/ /g, '\u00A0'); 
                if (onComplete) onComplete();
            }
        }, 30); 
    }
}

/**
 * Менеджер Навигационного Луча (С идеальной ScrollSpy логикой)
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
        
        this.updatePositions = this.updatePositions.bind(this);
        
        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updatePositions();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateGeometryCache();
                this.updatePositions();
            }, 200);
        });

        // Обновляем кэш при открытии/закрытии модалок или развороте базы
        EventBus.on('LAYOUT_CHANGED', () => {
            setTimeout(() => {
                this.updateGeometryCache();
                this.updatePositions();
            }, 350); 
        });

        setTimeout(() => {
            this.updateGeometryCache();
            this.updatePositions();
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
        const scrollableHeight = Math.max(1, docHeight - winHeight);
        
        const topPos = this.geometryCache[sectionId];
        // Отступ сверху, чтобы заголовок не прилипал к краю экрана при клике
        const viewOffset = winHeight * 0.15; 
        let targetScroll = topPos - viewOffset;

        // Жесткие якоря для первой и последней секции
        if (sectionId === this.sections[0].id) targetScroll = 0;
        if (sectionId === this.sections[this.sections.length - 1].id) targetScroll = scrollableHeight;

        return Math.max(0, Math.min(scrollableHeight, targetScroll));
    }

    updatePositions() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = Math.max(1, docHeight - winHeight);
        const scrolled = window.scrollY;

        // 1. Позиция лазера
        let decimalPos = scrolled / scrollableHeight;
        decimalPos = Math.max(0, Math.min(1, decimalPos));
        this.rail.style.setProperty('--line-decimal', decimalPos);

        let currentId = this.sections[0].id; // По умолчанию активна первая секция

        this.sections.forEach((sec) => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) {
                const targetScroll = this.calculateExactTarget(sec.id);
                
                // 2. Расставляем точки по их реальным координатам
                let markerDecimal = targetScroll / scrollableHeight;
                marker.style.setProperty('--marker-decimal', markerDecimal);

                // 3. Вычисляем свечение (Proximity). Светится, если лазер рядом.
                let distancePct = Math.abs((decimalPos * 100) - (markerDecimal * 100));
                let proximity = Math.max(0, 1 - (distancePct / 15)); // Радиус свечения 15%
                proximity = Math.pow(proximity, 2).toFixed(3);
                marker.style.setProperty('--proximity', proximity);

                // 4. НОВАЯ ЛОГИКА АКТИВНОСТИ (ScrollSpy)
                // Если мы проскроллили ниже начала этой секции (с небольшим буфером в 50px),
                // значит мы находимся в ней. Цикл идет сверху вниз, поэтому последняя 
                // пройденная секция перезапишет currentId и станет активной.
                if (scrolled >= targetScroll - 50) {
                    currentId = sec.id;
                }
            }
        });

        // 5. Применяем активный класс
        this.sections.forEach(sec => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) marker.classList.toggle('active', sec.id === currentId);
        });
    }
}