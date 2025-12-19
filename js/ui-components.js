/* js/ui-components.js */

/**
 * Инициализация общих UI компонентов
 */
export function initializeUI() {
    console.log('🎨 Initializing UI components...');
    
    initSmoothScroll();
    initCardCopy();
    initNavRail(); // Запуск боковой навигации
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
 * 2. Логика копирования номера карты (ЦИФРЫ -> ТЕКСТ)
 */
function initCardCopy() {
    const cardElement = document.getElementById('card-number');
    
    // Номер для буфера обмена (чистый)
    const rawNumber = '4276 1805 5058 1960';
    const cleanNumber = rawNumber.replace(/\s/g, '');
    
    // HTML с исходными цифрами (чтобы вернуть их обратно)
    // Структура должна совпадать с версткой
    const originalDigitsHTML = `<span>4276</span><span>1805</span><span>5058</span><span>1960</span>`;

    if (!cardElement) return;

    // Находим контейнер с цифрами
    const digitsContainer = cardElement.querySelector('.card-digits');
    let isAnimating = false; // Флаг, чтобы не спамить кликами

    cardElement.addEventListener('click', () => {
        if (isAnimating) return; 

        navigator.clipboard.writeText(cleanNumber)
            .then(() => {
                isAnimating = true;
                
                // 1. Добавляем классы стиля (зеленый цвет, неон)
                cardElement.classList.add('copied');
                if (digitsContainer) {
                    digitsContainer.classList.add('success-mode');
                    
                    // 2. Подменяем содержимое на текст
                    digitsContainer.innerHTML = 'СКОПИРОВАНО!';
                    
                    // 3. Через 2 секунды возвращаем всё как было
                    setTimeout(() => {
                        // Эффект затухания перед возвратом
                        digitsContainer.style.opacity = '0';
                        
                        setTimeout(() => {
                            // Сброс классов и возврат HTML
                            digitsContainer.classList.remove('success-mode');
                            cardElement.classList.remove('copied');
                            digitsContainer.innerHTML = originalDigitsHTML;
                            
                            // Возврат видимости
                            digitsContainer.style.opacity = '1';
                            isAnimating = false;
                        }, 200); // Короткая пауза для анимации opacity
                        
                    }, 2000);
                }
            })
            .catch(err => {
                console.error('Ошибка при копировании: ', err);
                if (digitsContainer) {
                    digitsContainer.innerHTML = 'ОШИБКА!';
                    digitsContainer.style.color = '#ff4444';
                    setTimeout(() => {
                        digitsContainer.innerHTML = originalDigitsHTML;
                        digitsContainer.style.color = '';
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

    // Список секций, к которым будем привязываться
    const sections = [
        { id: 'about', label: 'ОБО МНЕ' },
        { id: 'command-center', label: 'DASHBOARD' },
        { id: 'media-archive', label: 'БАЗА ДАННЫХ' },
        { id: 'specs', label: 'ЖЕЛЕЗО' },
        { id: 'donation', label: 'ДОНАТ' }
    ];

    /**
     * Функция создания/обновления маркеров.
     * Вызывается при загрузке, ресайзе окна и изменении контента.
     */
    function updateMarkers() {
        rail.innerHTML = ''; // Очищаем, чтобы перерисовать заново
        
        // Полная высота документа
        const docHeight = document.documentElement.scrollHeight; 
        
        sections.forEach(sec => {
            const element = document.getElementById(sec.id);
            if (element) {
                // Отступ элемента от самого верха страницы
                const topPos = element.offsetTop;
                
                // Вычисляем процент положения (0% - верх, 100% - низ)
                const percent = (topPos / docHeight) * 100;

                // Создаем HTML элемента маркера
                const marker = document.createElement('div');
                marker.className = 'nav-marker';
                marker.style.top = `${percent}%`; 
                
                // Сохраняем ID целевой секции для Observer'а
                marker.dataset.targetId = sec.id;

                // Создаем тултип (всплывашку)
                const tooltip = document.createElement('div');
                tooltip.className = 'nav-tooltip';
                tooltip.textContent = sec.label;
                marker.appendChild(tooltip);

                // Обработка клика по черточке
                marker.addEventListener('click', () => {
                    window.scrollTo({
                        top: topPos - 50, // Небольшой отступ для заголовка
                        behavior: 'smooth'
                    });
                });

                rail.appendChild(marker);
            }
        });
    }

    // Первичный запуск
    updateMarkers();
    
    // Пересчет при ресайзе окна
    window.addEventListener('resize', updateMarkers);
    
    // ВАЖНО: Пересчет при изменении высоты страницы
    // (например, когда загрузились картинки или развернулась "База данных")
    const resizeObserver = new ResizeObserver(() => {
        updateMarkers();
    });
    resizeObserver.observe(document.body);

    // --- ПОДСВЕТКА АКТИВНОГО МАРКЕРА (Scroll Spy) ---
    
    const observerOptions = {
        root: null,
        // Срабатывает, когда секция проходит через середину экрана
        rootMargin: '-45% 0px -45% 0px', 
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 1. Убираем класс active у всех маркеров
                document.querySelectorAll('.nav-marker').forEach(m => m.classList.remove('active'));
                
                // 2. Ищем маркер, соответствующий этой секции
                const activeMarker = Array.from(document.querySelectorAll('.nav-marker'))
                    .find(m => m.dataset.targetId === entry.target.id);
                
                // 3. Добавляем класс active
                if (activeMarker) {
                    activeMarker.classList.add('active');
                }
            }
        });
    }, observerOptions);

    // Начинаем следить за каждой секцией
    sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) sectionObserver.observe(el);
    });
}