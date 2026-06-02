/* js/ui-components.js */

export function initializeUI() {
    console.log('🎨 [UI] Инициализация базовых компонентов...');
    
    new SmoothScrollManager();
    new CryptoCardManager();
    new NavRailManager(); 
}

/**
 * Менеджер Плавного Скролла
 */
class SmoothScrollManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (anchor) {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId !== '#') this.scrollTo(targetId);
            }
        });
    }

    scrollTo(targetSelector) {
        const targetEl = typeof targetSelector === 'string' ? document.querySelector(targetSelector) : targetSelector;
        if (!targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();
        let targetPosition = targetRect.top + window.scrollY;
        
        if (targetRect.height < window.innerHeight) {
            targetPosition -= (window.innerHeight - targetRect.height) / 2;
        }

        window.scrollTo({ top: Math.max(0, targetPosition), behavior: 'smooth' });
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
 * Менеджер Навигационного Луча (PROXIMITY ENGINE 3.0 - Точный маппинг)
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
            marker.dataset.targetId = sec.id;
            marker.style.top = '0%'; 

            marker.innerHTML = `<div class="nav-shape"></div><div class="nav-tooltip">${sec.label}</div>`;
            
            // Идеальный клик-скролл на вычисленную позицию
            marker.addEventListener('click', (e) => {
                e.preventDefault();
                const targetScroll = parseFloat(marker.dataset.targetScroll);
                if (!isNaN(targetScroll)) {
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }
            });
            
            this.rail.appendChild(marker);
        });
        
        // 3. Биндим слушатели
        this.updatePositions = this.updatePositions.bind(this);
        window.addEventListener('scroll', this.updatePositions, { passive: true });
        new ResizeObserver(() => requestAnimationFrame(this.updatePositions)).observe(document.body);

        setTimeout(this.updatePositions, 100);
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

        // Оптимальный вид: мы хотим, чтобы при клике заголовок секции 
        // оказывался чуть ниже верха экрана (на 15% высоты окна)
        const viewOffset = winHeight * 0.15;

        let currentId = 'hero';
        let closestDist = Infinity;

        this.sections.forEach((sec, index) => {
            const element = document.getElementById(sec.id);
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            
            if (element && marker) {
                // 1. УМНЫЙ МАППИНГ 
                const topPos = element.offsetTop;
                let targetScroll = topPos - viewOffset;
                
                // Жесткая привязка краев (Первая секция - всегда 0%, Последняя - всегда 100%)
                if (index === 0) targetScroll = 0;
                if (index === this.sections.length - 1) targetScroll = scrollableHeight;

                // Не даем значению выйти за пределы возможного скролла
                targetScroll = Math.max(0, Math.min(scrollableHeight, targetScroll));
                
                // Сохраняем это идеальное значение скролла для обработчика клика
                marker.dataset.targetScroll = targetScroll;

                // Переводим targetScroll в проценты для позиционирования маркера на рельсе
                let markerPercent = (targetScroll / scrollableHeight) * 100;
                marker.style.top = `${markerPercent}%`;

                // 2. PROXIMITY ЭФФЕКТ (Определение близости лазера)
                // Разница между лазером и маркером (в процентах экрана)
                let distancePct = Math.abs(percentLine - markerPercent);
                
                // Лазер "чувствует" маркер в радиусе 15% 
                let proximity = Math.max(0, 1 - (distancePct / 15));
                
                // Смягчаем кривую затухания для плавности (квадратичная функция)
                proximity = Math.pow(proximity, 2).toFixed(3);
                
                marker.style.setProperty('--proximity', proximity);

                // 3. Вычисление активной секции (кто ближе всего к текущему скроллу)
                const absDist = Math.abs(scrolled - targetScroll);
                if (absDist < closestDist) {
                    closestDist = absDist;
                    currentId = sec.id;
                }
            }
        });

        // Обновляем UI активной секции
        document.querySelectorAll('.nav-marker').forEach(m => {
            m.classList.toggle('active', m.dataset.targetId === currentId);
        });
    }
}