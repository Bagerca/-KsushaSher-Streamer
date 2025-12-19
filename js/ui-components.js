/* js/ui-components.js */

/**
 * Инициализация общих UI компонентов
 */
export function initializeUI() {
    console.log('🎨 Initializing UI components...');
    
    initSmoothScroll();
    initCardCopy();
    initNavRail();
    initLiquidScrollbar(); // Запуск физики скроллбара
}

/**
 * 1. Плавный скролл по якорным ссылкам
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = 50; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 2. Логика копирования номера карты (CYBER DECODE EFFECT)
 */
function initCardCopy() {
    const cardElement = document.getElementById('card-number');
    
    // Данные карты
    const rawNumber = '4276 1805 5058 1960';
    const cleanNumber = rawNumber.replace(/\s/g, '');
    
    // Исходный HTML (со спанами для красивых отступов в покое)
    const originalHTML = `<span>4276</span><span>1805</span><span>5058</span><span>1960</span>`;
    // Текст для анимации (монолитный)
    const originalText = "4276 1805 5058 1960"; 
    const successText = "СКОПИРОВАНО!";

    // Набор символов для "шума"
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
                for (let i = 0; i < randomCount; i++) {
                    randomPart += chars[Math.floor(Math.random() * chars.length)];
                }
                displayText = revealedPart + randomPart;
            } else {
                const startIdx = Math.max(0, targetText.length - revealCount);
                const revealedPart = targetText.substring(startIdx);
                let randomCount = currentLen - revealedPart.length;
                if (randomCount < 0) randomCount = 0;
                
                let randomPart = "";
                for (let i = 0; i < randomCount; i++) {
                    randomPart += chars[Math.floor(Math.random() * chars.length)];
                }
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
            .catch(err => {
                console.error('Copy failed', err);
                if (digitsContainer) {
                    digitsContainer.innerText = "ERROR";
                    digitsContainer.style.color = "#ff4444";
                    setTimeout(() => {
                        digitsContainer.innerHTML = originalHTML;
                        digitsContainer.style.color = "";
                        isAnimating = false;
                    }, 2000);
                }
            });
    });
}

/**
 * 3. Навигационная рейка (Скролл-маркеры справа)
 */
function initNavRail() {
    const rail = document.getElementById('cyber-nav-rail');
    if (!rail) return;

    const sections = [
        { id: 'about', label: 'ОБО МНЕ' },
        { id: 'command-center', label: 'DASHBOARD' },
        { id: 'media-archive', label: 'БАЗА ДАННЫХ' },
        { id: 'specs', label: 'ЖЕЛЕЗО' },
        { id: 'donation', label: 'ДОНАТ' }
    ];

    function updateMarkers() {
        rail.innerHTML = ''; 
        const docHeight = document.documentElement.scrollHeight; 
        
        sections.forEach(sec => {
            const element = document.getElementById(sec.id);
            if (element) {
                const topPos = element.offsetTop;
                const percent = (topPos / docHeight) * 100;
                const marker = document.createElement('div');
                marker.className = 'nav-marker';
                marker.style.top = `${percent}%`; 
                marker.dataset.targetId = sec.id;
                const tooltip = document.createElement('div');
                tooltip.className = 'nav-tooltip';
                tooltip.textContent = sec.label;
                marker.appendChild(tooltip);
                marker.addEventListener('click', () => {
                    window.scrollTo({
                        top: topPos - 50,
                        behavior: 'smooth'
                    });
                });
                rail.appendChild(marker);
            }
        });
    }

    updateMarkers();
    window.addEventListener('resize', updateMarkers);
    const resizeObserver = new ResizeObserver(() => {
        updateMarkers();
    });
    resizeObserver.observe(document.body);
    
    const observerOptions = {
        root: null,
        rootMargin: '-45% 0px -45% 0px', 
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.nav-marker').forEach(m => m.classList.remove('active'));
                const activeMarker = Array.from(document.querySelectorAll('.nav-marker'))
                    .find(m => m.dataset.targetId === entry.target.id);
                if (activeMarker) {
                    activeMarker.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) sectionObserver.observe(el);
    });
}

/**
 * 4. Кастомный скроллбар с физикой жидкости
 */
function initLiquidScrollbar() {
    const track = document.getElementById('liquid-scrollbar-track');
    const thumb = document.getElementById('liquid-scrollbar-thumb');
    
    // Если элементов нет, выходим
    if (!track || !thumb) return;
    
    const liquid = thumb.querySelector('.liquid-inner');

    let lastScrollTop = 0;
    
    // Функция обновления (Game Loop)
    function update() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        
        // 1. Расчет высоты и позиции ползунка
        // Если контента мало, высота ползунка может быть равна высоте окна
        const scrollableDistance = docHeight - winHeight;
        
        // Защита от деления на ноль, если контента мало
        if (scrollableDistance <= 0) {
            thumb.style.display = 'none';
            requestAnimationFrame(update);
            return;
        } else {
            thumb.style.display = 'block';
        }

        const scrollPercent = scrollTop / scrollableDistance;
        const trackHeight = winHeight;
        
        // Высота ползунка (пропорционально, но не меньше 80px)
        let thumbHeight = Math.max((winHeight / docHeight) * trackHeight, 80);
        thumb.style.height = `${thumbHeight}px`;

        // Доступное место для движения ползунка
        const availableSpace = trackHeight - thumbHeight;
        const thumbTop = scrollPercent * availableSpace;
        
        thumb.style.transform = `translateY(${thumbTop}px)`;

        // 2. Физика жидкости (Наклон)
        const velocity = scrollTop - lastScrollTop;
        lastScrollTop = scrollTop;

        // Ограничиваем угол наклона
        const maxSkew = 20; 
        
        // Коэффициент чувствительности
        let skew = -velocity * 0.5; 
        
        if (skew > maxSkew) skew = maxSkew;
        if (skew < -maxSkew) skew = -maxSkew;

        // Применяем наклон к жидкости
        if (liquid) {
            liquid.style.transform = `skewY(${skew}deg)`;
        }

        requestAnimationFrame(update);
    }

    // Запускаем цикл анимации
    requestAnimationFrame(update);
}