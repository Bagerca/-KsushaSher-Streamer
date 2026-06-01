/* js/ui-components.js */

export function initializeUI() {
    console.log('🎨 [UI] Инициализация базовых компонентов...');
    
    new SmoothScrollManager();
    new CryptoCardManager();
    new NavRailManager(); // Сам создаст свой HTML
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
 * Менеджер Навигационного Луча (Создает свой DOM)
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
            
            marker.addEventListener('click', (e) => {
                e.preventDefault();
                const element = document.getElementById(sec.id);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            
            this.rail.appendChild(marker);
        });
        
        // 3. Биндим слушатели
        this.updatePositions = this.updatePositions.bind(this);
        window.addEventListener('scroll', this.updatePositions);
        new ResizeObserver(() => requestAnimationFrame(this.updatePositions)).observe(document.body);

        setTimeout(this.updatePositions, 100);
    }

    updatePositions() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = docHeight - winHeight;
        const scrolled = window.scrollY;

        let percentLine = (scrollableHeight > 0) ? (scrolled / scrollableHeight) * 100 : 0;
        this.rail.style.setProperty('--line-pos', `${percentLine}%`);

        this.sections.forEach(sec => {
            const element = document.getElementById(sec.id);
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            if (element && marker) {
                const topPos = element.getBoundingClientRect().top + window.scrollY;
                let percent = (topPos / docHeight) * 100;
                marker.style.top = `${Math.max(2, Math.min(98, percent))}%`;
            }
        });

        this.checkActiveSection(scrolled, winHeight);
    }

    checkActiveSection(scrolled, winHeight) {
        const scrollPos = scrolled + winHeight / 3;
        let currentId = 'hero';
        
        if (scrolled >= 100) {
            this.sections.forEach(sec => {
                const el = document.getElementById(sec.id);
                if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) currentId = sec.id;
            });
        }

        document.querySelectorAll('.nav-marker').forEach(m => {
            m.classList.toggle('active', m.dataset.targetId === currentId);
        });
    }
}