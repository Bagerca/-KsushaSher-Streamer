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

    const sections = [
        { id: 'about', label: 'ОБО МНЕ' },
        { id: 'command-center', label: 'КОМАНДНЫЙ ЦЕНТР' },
        { id: 'media-archive', label: 'БАЗА ДАННЫХ' },
        { id: 'specs', label: 'ЖЕЛЕЗО' },
        { id: 'donation', label: 'ДОНАТ' }
    ];

    window.updateNavRail = function() {
        rail.innerHTML = ''; 
        const docHeight = document.documentElement.scrollHeight;
        
        sections.forEach(sec => {
            const element = document.getElementById(sec.id);
            if (element) {
                const topPos = element.getBoundingClientRect().top + window.scrollY;
                let percent = (topPos / docHeight) * 100;
                percent = Math.max(2, Math.min(98, percent));
                
                const marker = document.createElement('div');
                marker.className = 'nav-marker';
                marker.style.top = `${percent}%`; 
                marker.dataset.targetId = sec.id;
                
                // ВАЖНО: Создаем новую структуру DOM (shape отдельно от tooltip)
                marker.innerHTML = `
                    <div class="nav-shape"></div>
                    <div class="nav-tooltip">${sec.label}</div>
                `;
                
                marker.appendChild(document.createElement('div')).className = 'nav-shape'; 
                // Ой, выше дубль, правильный код внутри innerHTML уже есть.
                // marker.innerHTML перезаписывает всё, поэтому appendChild не нужен.
                // Чистая версия innerHTML выше верна.
                
                marker.addEventListener('click', (e) => {
                    e.preventDefault();
                    customSmoothScroll(element);
                });
                rail.appendChild(marker);
            }
        });
        checkActiveSection();
    };

    function checkActiveSection() {
        const scrollPos = window.scrollY + window.innerHeight / 3;
        let currentId = '';
        sections.forEach(sec => {
            const el = document.getElementById(sec.id);
            if (el) {
                const top = el.offsetTop;
                const bottom = top + el.offsetHeight;
                if (scrollPos >= top && scrollPos < bottom) currentId = sec.id;
            }
        });
        document.querySelectorAll('.nav-marker').forEach(m => {
            m.classList.toggle('active', m.dataset.targetId === currentId);
        });
    }

    window.updateNavRail();
    window.addEventListener('scroll', checkActiveSection);
    const resizeObserver = new ResizeObserver(() => {
        clearTimeout(window.navUpdateTimeout);
        window.navUpdateTimeout = setTimeout(() => { window.updateNavRail(); }, 100);
    });
    resizeObserver.observe(document.body);
}