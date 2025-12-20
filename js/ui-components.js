/* js/ui-components.js */

/**
 * Инициализация общих UI компонентов
 */
export function initializeUI() {
    console.log('🎨 Initializing UI components...');
    
    initSmoothScroll();
    initCardCopy();
    initNavRail();
    // initLiquidScrollbar(); <--- ОТКЛЮЧЕНО (Используем нативный CSS скролл)
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
                // Отступ сверху (чтобы заголовок не прилипал к краю экрана)
                const offset = 80; 
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
 * 2. Логика копирования номера карты
 */
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

    // Функция обновления позиций маркеров (ГЛОБАЛЬНАЯ)
    window.updateNavRail = function() {
        rail.innerHTML = ''; 
        
        // Берем полную высоту страницы с учетом прокрутки
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        
        // Доступная высота для маркеров (чтобы нижний не улетал за экран)
        // Вычитаем немного (например, 10%), чтобы маркеры не прилипали к самому низу
        const usableHeight = docHeight - winHeight * 0.1; 

        sections.forEach(sec => {
            const element = document.getElementById(sec.id);
            if (element) {
                // Точная позиция элемента от верха страницы
                const topPos = element.getBoundingClientRect().top + window.scrollY;
                
                // Рассчитываем процентное положение на рейке
                let percent = (topPos / docHeight) * 100;
                
                // Ограничиваем, чтобы не вылетало (от 2% до 95%)
                percent = Math.max(2, Math.min(98, percent));
                
                const marker = document.createElement('div');
                marker.className = 'nav-marker';
                marker.style.top = `${percent}%`; 
                marker.dataset.targetId = sec.id;
                
                const tooltip = document.createElement('div');
                tooltip.className = 'nav-tooltip';
                tooltip.textContent = sec.label;
                
                marker.appendChild(tooltip);
                
                // Клик по маркеру
                marker.addEventListener('click', () => {
                    const el = document.getElementById(sec.id);
                    if(el) {
                        const offset = 80; // Отступ сверху
                        const elementPos = el.getBoundingClientRect().top;
                        const offsetPos = elementPos + window.pageYOffset - offset;
                        
                        window.scrollTo({
                            top: offsetPos,
                            behavior: 'smooth'
                        });
                    }
                });
                rail.appendChild(marker);
            }
        });

        // Перезапускаем подсветку активного маркера
        checkActiveSection();
    };

    // Функция проверки активной секции при скролле
    function checkActiveSection() {
        const scrollPos = window.scrollY + window.innerHeight / 3; // Точка срабатывания - треть экрана

        let currentId = '';
        sections.forEach(sec => {
            const el = document.getElementById(sec.id);
            if (el) {
                const top = el.offsetTop;
                const bottom = top + el.offsetHeight;
                
                if (scrollPos >= top && scrollPos < bottom) {
                    currentId = sec.id;
                }
            }
        });

        document.querySelectorAll('.nav-marker').forEach(m => {
            m.classList.remove('active');
            if (m.dataset.targetId === currentId) {
                m.classList.add('active');
            }
        });
    }

    // Запускаем
    window.updateNavRail();
    
    // Слушаем скролл для подсветки
    window.addEventListener('scroll', checkActiveSection);

    // Слушаем ресайз окна и ДОМ-изменения
    const resizeObserver = new ResizeObserver(() => {
        // Debounce (ждем 100мс перед обновлением)
        clearTimeout(window.navUpdateTimeout);
        window.navUpdateTimeout = setTimeout(() => {
            window.updateNavRail();
        }, 100);
    });
    
    resizeObserver.observe(document.body);
}