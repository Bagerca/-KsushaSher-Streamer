/* js/ui-components.js */

export function initializeUI() {
    console.log('🎨 Initializing UI components...');
    initSmoothScroll();
    initCardCopy();
    initNavRail();
}

/**
 * УМНЫЙ СКРОЛЛ:
 * Центрирует маленькие блоки, большие прижимает к верху.
 */
function customSmoothScroll(targetSelector) {
    const targetEl = typeof targetSelector === 'string' 
        ? document.querySelector(targetSelector) 
        : targetSelector;

    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const elementTop = targetRect.top + window.pageYOffset;
    const elementHeight = targetRect.height;
    const viewportHeight = window.innerHeight;

    let targetPosition;

    // Логика центрирования
    if (elementHeight < viewportHeight) {
        targetPosition = elementTop - (viewportHeight - elementHeight) / 2;
    } else {
        targetPosition = elementTop;
    }

    targetPosition = Math.max(0, targetPosition);

    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000; 
    let start = null;

    function easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    function step(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = easeInOutQuad(elapsed, startPosition, distance, duration);
        
        window.scrollTo(0, progress);

        if (elapsed < duration) {
            window.requestAnimationFrame(step);
        } else {
            window.scrollTo(0, targetPosition);
        }
    }

    window.requestAnimationFrame(step);
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            customSmoothScroll(targetId);
        });
    });
}

function initCardCopy() {
    const cardElement = document.getElementById('card-number');
    const rawNumber = '4276 1805 5058 1960';
    const cleanNumber = rawNumber.replace(/\s/g, '');
    const originalHTML = `<span>4276</span><span>1805</span><span>5058</span><span>1960</span>`;
    const originalText = "4276 1805 5058 1960"; 
    const successText = "СКОПИРОВАНО!";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&<>[]/\\";

    if (!cardElement) return;

    const digitsContainer = cardElement.querySelector('.card-digits');
    let isAnimating = false; 

    function runCyberTextEffect(targetText, reverseDirection, onComplete) {
        const startText = digitsContainer.innerText;
        const startLen = startText.length;
        const endLen = targetText.length;
        let iterations = 0;
        
        if (digitsContainer.dataset.interval) clearInterval(digitsContainer.dataset.interval);

        const interval = setInterval(() => {
            const totalSteps = targetText.length;
            const progress = Math.min(iterations / totalSteps, 1);
            const currentLen = Math.floor(startLen + (endLen - startLen) * progress);
            
            let displayText = "";
            const revealCount = Math.floor(iterations);

            if (!reverseDirection) {
                const revealedPart = targetText.substring(0, revealCount);
                let randomCount = currentLen - revealedPart.length;
                if (randomCount < 0) randomCount = 0;
                let randomPart = "";
                for (let i = 0; i < randomCount; i++) { randomPart += chars[Math.floor(Math.random() * chars.length)]; }
                displayText = revealedPart + randomPart;
            } else {
                const startIdx = Math.max(0, targetText.length - revealCount);
                const revealedPart = targetText.substring(startIdx);
                let randomCount = currentLen - revealedPart.length;
                if (randomCount < 0) randomCount = 0;
                let randomPart = "";
                for (let i = 0; i < randomCount; i++) { randomPart += chars[Math.floor(Math.random() * chars.length)]; }
                displayText = randomPart + revealedPart;
            }
            digitsContainer.innerText = displayText;
            if (iterations >= targetText.length) { 
                clearInterval(interval);
                digitsContainer.innerText = targetText; 
                if (onComplete) onComplete();
            }
            iterations += 1 / 2; 
        }, 30); 
        digitsContainer.dataset.interval = interval;
    }

    cardElement.addEventListener('click', () => {
        if (isAnimating) return; 
        isAnimating = true;
        navigator.clipboard.writeText(cleanNumber)
            .then(() => {
                cardElement.classList.add('copied');
                if (digitsContainer) digitsContainer.classList.add('success-mode');
                runCyberTextEffect(successText, false, () => {
                    setTimeout(() => {
                        runCyberTextEffect(originalText, true, () => {
                            if (digitsContainer) {
                                digitsContainer.classList.remove('success-mode');
                                digitsContainer.innerHTML = originalHTML; 
                            }
                            cardElement.classList.remove('copied');
                            isAnimating = false;
                        });
                    }, 2000);
                });
            })
            .catch(err => { console.error('Copy failed', err); isAnimating = false; });
    });
}

function initNavRail() {
    const rail = document.getElementById('cyber-nav-rail');
    if (!rail) return;

    // Секции, по которым строим навигацию
    const sections = [
        { id: 'hero', label: 'ГЛАВНАЯ' },
        { id: 'about', label: 'ОБО МНЕ' },
        { id: 'command-center', label: 'КОМАНДНЫЙ ЦЕНТР' },
        { id: 'media-archive', label: 'БАЗА ДАННЫХ' },
        { id: 'specs', label: 'ЖЕЛЕЗО' },
        { id: 'donation', label: 'ДОНАТ' }
    ];

    // 1. СОЗДАЕМ МАРКЕРЫ (ОДИН РАЗ)
    // Очищаем на всякий случай, но только при старте, а не при каждом обновлении
    rail.innerHTML = ''; 
    
    sections.forEach(sec => {
        const marker = document.createElement('div');
        marker.className = 'nav-marker';
        // Устанавливаем уникальный ID для последующего поиска
        marker.id = `nav-marker-${sec.id}`; 
        marker.dataset.targetId = sec.id;
        
        // Начальная позиция
        marker.style.top = '0%'; 

        marker.innerHTML = `
            <div class="nav-shape"></div>
            <div class="nav-tooltip">${sec.label}</div>
        `;
        
        // Клик с плавным скроллом
        marker.addEventListener('click', (e) => {
            e.preventDefault();
            const element = document.getElementById(sec.id);
            if (element) customSmoothScroll(element);
        });
        
        rail.appendChild(marker);
    });

    // --- ФУНКЦИЯ ОБНОВЛЕНИЯ ПОЗИЦИЙ (ЛУЧ + МАРКЕРЫ) ---
    // Теперь она не пересоздает DOM, а меняет стили существующим элементам
    window.updateNavRail = function() {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = docHeight - winHeight;
        const scrolled = window.scrollY;

        // 1. Обновляем луч
        let percentLine = 0;
        if (scrollableHeight > 0) {
            percentLine = (scrolled / scrollableHeight) * 100;
        }
        rail.style.setProperty('--line-pos', `${percentLine}%`);

        // 2. Обновляем позиции маркеров
        sections.forEach(sec => {
            const element = document.getElementById(sec.id);
            const marker = document.getElementById(`nav-marker-${sec.id}`);
            
            if (element && marker) {
                // Вычисляем центр секции относительно всей высоты документа
                const topPos = element.getBoundingClientRect().top + window.scrollY;
                
                // Рассчитываем процент
                let percent = (topPos / docHeight) * 100;
                
                // Ограничители (чтобы не улетали за края экрана в крайних точках)
                percent = Math.max(2, Math.min(98, percent));
                
                // Просто меняем свойство top. 
                // Благодаря CSS transition в global.css маркер плавно поедет на новое место.
                marker.style.top = `${percent}%`;
            }
        });

        checkActiveSection();
    };

    // --- ПОДСВЕТКА АКТИВНОЙ СЕКЦИИ ---
    function checkActiveSection() {
        const scrollPos = window.scrollY + window.innerHeight / 3;
        let currentId = '';
        
        // Особая проверка для Hero (если мы в самом верху)
        if (window.scrollY < 100) {
            currentId = 'hero';
        } else {
            sections.forEach(sec => {
                const el = document.getElementById(sec.id);
                if (el) {
                    const top = el.offsetTop;
                    const bottom = top + el.offsetHeight;
                    if (scrollPos >= top && scrollPos < bottom) currentId = sec.id;
                }
            });
        }

        // Просто переключаем класс active
        document.querySelectorAll('.nav-marker').forEach(m => {
            m.classList.toggle('active', m.dataset.targetId === currentId);
        });
    }

    // Слушатели событий
    window.addEventListener('scroll', () => {
        // Обновляем луч на скролле (он должен быть реактивным)
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = docHeight - winHeight;
        const scrolled = window.scrollY;
        let percentLine = (scrollableHeight > 0) ? (scrolled / scrollableHeight) * 100 : 0;
        rail.style.setProperty('--line-pos', `${percentLine}%`);
        
        checkActiveSection();
    });

    // ResizeObserver следит за изменением высоты body (например, при раскрытии архива)
    // Это и запустит плавное перемещение маркеров
    const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
            if (window.updateNavRail) window.updateNavRail();
        });
    });
    
    resizeObserver.observe(document.body);

    // Первичный запуск (с небольшой задержкой, чтобы DOM успел отрендериться)
    setTimeout(window.updateNavRail, 100);
}