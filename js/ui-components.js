/* js/ui-components.js */

export function initializeUI() {
    console.log('🎨 [UI] Инициализация базовых компонентов...');
    
    new SmoothScrollManager();
    new CryptoCardManager();
    new NavRailManager(); 
}

/**
 * КИБЕР-ФИЗИКА СКРОЛЛА (Глобальная функция анимации)
 * Использует функцию плавности easeInOutQuart для кинематографичного эффекта
 */
function customSmoothScroll(targetPosition, duration = 800) {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // Математика плавности (Quartic easing in/out)
        // Медленный старт, быстрое движение посередине, мягкое торможение в конце
        const ease = progress < 0.5 
            ? 8 * progress * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 4) / 2;

        window.scrollTo(0, startPosition + distance * ease);

        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }
    requestAnimationFrame(animation);
}

/**
 * Менеджер Плавного Скролла (Для обычных якорных ссылок)
 */
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
        const viewOffset = window.innerHeight * 0.15; // Отступ сверху (15% экрана)
        let targetPosition = targetRect.top + window.scrollY - viewOffset;
        
        // Запускаем нашу кастомную анимацию (скорость 800мс)
        customSmoothScroll(Math.max(0, targetPosition), 800);
    }
}

/**
 * Менеджер Карты Крипто-Доната
 */
class CryptoCardManager {
    constructor() {
        this.cardElement = document.getElementById('card-number');
        this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&<>[]/\\";
        this.isAnimating = false;
        
        this.rawNumber = '4276 1805 5058 1960';
        this.cleanNumber = this.rawNumber.replace(/\s/g, '');
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
                
                this.runCyberTextEffect(this.successText, false, () => {
                    setTimeout(() => {
                        this.runCyberTextEffect(this.rawNumber, true, () => {
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

    runCyberTextEffect(targetText, reverseDirection, onComplete) {
        const startText = this.digitsContainer.innerText;
        const startLen = startText.length;
        const endLen = targetText.length;
        let iterations = 0;
        
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            const progress = Math.min(iterations / targetText.length, 1);
            const currentLen = Math.floor(startLen + (endLen - startLen) * progress);
            
            let displayText = "";
            const revealCount = Math.floor(iterations);

            if (!reverseDirection) {
                const revealedPart = targetText.substring(0, revealCount);
                displayText = revealedPart + this._generateRandomString(Math.max(0, currentLen - revealedPart.length));
            } else {
                const startIdx = Math.max(0, targetText.length - revealCount);
                const revealedPart = targetText.substring(startIdx);
                displayText = this._generateRandomString(Math.max(0, currentLen - revealedPart.length)) + revealedPart;
            }
            
            this.digitsContainer.innerText = displayText;
            
            if (iterations >= targetText.length) { 
                clearInterval(this.intervalId);
                this.digitsContainer.innerText = targetText; 
                if (onComplete) onComplete();
            }
            iterations += 0.5; 
        }, 30); 
    }

    _generateRandomString(length) {
        let res = "";
        for (let i = 0; i < length; i++) res += this.chars[Math.floor(Math.random() * this.chars.length)];
        return res;
    }
}

/**
 * Менеджер Навигационного Луча (PROXIMITY ENGINE 4.0 - Кастомный скролл и динамика)
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
        
        this.init();
    }

    init() {
        // 1. Создаем DOM элемент рельса
        this.rail = document.createElement('div');
        this.rail.className = 'cyber-nav-rail';
        this.rail.id = 'cyber-nav-rail';
        document.body.appendChild(this.rail);

        // 2. Создаем маркеры
        this.sections.forEach(sec => {
            const marker = document.createElement('div');
            marker.className = 'nav-marker';
            marker.id = `nav-marker-${sec.id}`; 
            marker.style.top = '0%'; 

            marker.innerHTML = `<div class="nav-shape"></div><div class="nav-tooltip">${sec.label}</div>`;
            
            // Идеальный клик-скролл с использованием свежей математики
            marker.addEventListener('click', (e) => {
                e.preventDefault();
                // Рассчитываем актуальную позицию прямо в момент клика
                const targetScroll = this.calculateExactTarget(sec.id);
                // Запускаем плавную кинематографичную анимацию
                customSmoothScroll(targetScroll, 1000); 
            });
            
            this.rail.appendChild(marker);
        });
        
        // 3. Биндим слушатели
        this.updatePositions = this.updatePositions.bind(this);
        window.addEventListener('scroll', this.updatePositions, { passive: true });
        new ResizeObserver(() => requestAnimationFrame(this.updatePositions)).observe(document.body);

        setTimeout(this.updatePositions, 100);
    }

    /**
     * Вычисляет идеальную позицию для скролла к секции, учитывая динамическую высоту контента
     */
    calculateExactTarget(sectionId) {
        const element = document.getElementById(sectionId);
        if (!element) return 0;

        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = Math.max(1, docHeight - winHeight);
        
        const topPos = element.offsetTop;
        const viewOffset = winHeight * 0.15; // Центрирование заголовка
        let targetScroll = topPos - viewOffset;

        // Жесткая привязка краев
        if (sectionId === this.sections[0].id) targetScroll = 0;
        if (sectionId === this.sections[this.sections.length - 1].id) targetScroll = scrollableHeight;

        return Math.max(0, Math.min(scrollableHeight, targetScroll));
    }

    updatePositions() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = Math.max(1, docHeight - winHeight);
        const scrolled = window.scrollY;

        // Позиция центра лазера в процентах от скролла (от 0 до 100%)
        let percentLine = (scrolled / scrollableHeight) * 100;
        percentLine = Math.max(0, Math.min(100, percentLine));
        this.rail.style.setProperty('--line-pos', `${percentLine}%`);

        let currentId = 'hero';
        let closestDist = Infinity;

        this.sections.forEach(sec => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) {
                // Вычисляем актуальный таргет для рендера
                const targetScroll = this.calculateExactTarget(sec.id);
                
                // Переводим targetScroll в проценты для позиционирования маркера на рельсе
                let markerPercent = (targetScroll / scrollableHeight) * 100;
                marker.style.top = `${markerPercent}%`;

                // PROXIMITY ЭФФЕКТ (Определение близости лазера)
                let distancePct = Math.abs(percentLine - markerPercent);
                let proximity = Math.max(0, 1 - (distancePct / 15));
                proximity = Math.pow(proximity, 2).toFixed(3); // Квадратичное затухание
                
                marker.style.setProperty('--proximity', proximity);

                // Вычисление активной секции (кто ближе всего к текущему скроллу)
                const absDist = Math.abs(scrolled - targetScroll);
                if (absDist < closestDist) {
                    closestDist = absDist;
                    currentId = sec.id;
                }
            }
        });

        // Обновляем UI активной секции
        this.sections.forEach(sec => {
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (marker) {
                marker.classList.toggle('active', sec.id === currentId);
            }
        });
    }
}