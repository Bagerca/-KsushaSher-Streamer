/* js/ui-components.js */

/**
 * Инициализация общих UI компонентов
 */
export function initializeUI() {
    console.log('🎨 Initializing UI components...');
    
    initSmoothScroll();
    initCardCopy();
    initNavRail(); 
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
 * 2. Логика копирования номера карты (CYBER DECODE EFFECT - ADVANCED)
 * - Интерполяция длины (сжатие/растяжение)
 * - Зеркальное направление открытия (Right-to-Left)
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

    /**
     * Продвинутая функция анимации текста
     * @param {string} targetText - Целевой текст
     * @param {boolean} reverseDirection - true для открытия Справа-Налево (восстановление)
     * @param {function} onComplete - Коллбек
     */
    function runCyberTextEffect(targetText, reverseDirection, onComplete) {
        // Фиксируем начальную длину и конечную
        const startText = digitsContainer.innerText;
        const startLen = startText.length;
        const endLen = targetText.length;
        
        let iterations = 0;
        
        if (digitsContainer.dataset.interval) clearInterval(digitsContainer.dataset.interval);

        const interval = setInterval(() => {
            // Расчет прогресса (от 0.0 до 1.0)
            // Используем длину целевого текста как базу для скорости
            const totalSteps = targetText.length;
            const progress = Math.min(iterations / totalSteps, 1);
            
            // 1. ИНТЕРПОЛЯЦИЯ ДЛИНЫ
            // Плавно меняем длину текущей строки от startLen до endLen
            const currentLen = Math.floor(startLen + (endLen - startLen) * progress);
            
            // 2. ГЕНЕРАЦИЯ СТРОКИ
            let displayText = "";
            const revealCount = Math.floor(iterations);

            if (!reverseDirection) {
                // --- ЛОГИКА "СЛЕВА-НАПРАВО" (Сжатие в "СКОПИРОВАНО") ---
                // Открываем символы с начала строки
                const revealedPart = targetText.substring(0, revealCount);
                
                // Остальное заполняем мусором до currentLen
                let randomCount = currentLen - revealedPart.length;
                if (randomCount < 0) randomCount = 0;
                
                let randomPart = "";
                for (let i = 0; i < randomCount; i++) {
                    randomPart += chars[Math.floor(Math.random() * chars.length)];
                }
                
                displayText = revealedPart + randomPart;

            } else {
                // --- ЛОГИКА "СПРАВА-НАЛЕВО" (Рост в Цифры) ---
                // Открываем символы с КОНЦА строки
                // Если targetText = "4276...", берем подстроку с конца
                const startIdx = Math.max(0, targetText.length - revealCount);
                const revealedPart = targetText.substring(startIdx);
                
                // Начало заполняем мусором
                let randomCount = currentLen - revealedPart.length;
                if (randomCount < 0) randomCount = 0;
                
                let randomPart = "";
                for (let i = 0; i < randomCount; i++) {
                    randomPart += chars[Math.floor(Math.random() * chars.length)];
                }
                
                // Сначала мусор, потом восстановленный хвост
                displayText = randomPart + revealedPart;
            }
            
            digitsContainer.innerText = displayText;

            // Условие завершения
            if (iterations >= targetText.length) { 
                clearInterval(interval);
                digitsContainer.innerText = targetText; // Финализируем чистовой текст
                if (onComplete) onComplete();
            }

            iterations += 1 / 2; // Скорость анимации

        }, 30); // 30ms на кадр

        digitsContainer.dataset.interval = interval;
    }

    // --- ОБРАБОТЧИК КЛИКА ---
    cardElement.addEventListener('click', () => {
        if (isAnimating) return; 
        isAnimating = true;

        navigator.clipboard.writeText(cleanNumber)
            .then(() => {
                cardElement.classList.add('copied');
                if (digitsContainer) digitsContainer.classList.add('success-mode');

                // 1. ПРЯМАЯ АНИМАЦИЯ (Цифры -> Слово)
                // reverseDirection = false (Слева-Направо)
                runCyberTextEffect(successText, false, () => {
                    
                    setTimeout(() => {
                        
                        // 2. ОБРАТНАЯ АНИМАЦИЯ (Слово -> Цифры)
                        // reverseDirection = true (Справа-Налево, Зеркально)
                        runCyberTextEffect(originalText, true, () => {
                            
                            if (digitsContainer) {
                                digitsContainer.classList.remove('success-mode');
                                digitsContainer.innerHTML = originalHTML; // Возвращаем спаны
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