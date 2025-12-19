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
 * 2. Логика копирования номера карты
 */
function initCardCopy() {
    const cardElement = document.getElementById('card-number');
    const tooltip = document.getElementById('copy-tooltip');
    
    const rawNumber = '4276 1805 5058 1960';
    const cleanNumber = rawNumber.replace(/\s/g, '');

    if (!cardElement) return;

    cardElement.addEventListener('click', () => {
        navigator.clipboard.writeText(cleanNumber)
            .then(() => {
                cardElement.classList.add('copied');
                
                if (tooltip) {
                    // Визуальный фидбек
                    const originalText = tooltip.textContent; // Сохраняем "Скопировать" (не обязательно, но хорошая практика)
                    tooltip.textContent = 'СКОПИРОВАНО!';
                    tooltip.style.color = 'var(--neon-green)';
                    tooltip.style.fontWeight = 'bold';
                    
                    setTimeout(() => {
                        cardElement.classList.remove('copied');
                        tooltip.textContent = 'Скопировать';
                        tooltip.style.color = '';
                        tooltip.style.fontWeight = '';
                    }, 2000);
                }
            })
            .catch(err => {
                console.error('Ошибка при копировании: ', err);
                if (tooltip) {
                    tooltip.textContent = 'ОШИБКА!';
                    tooltip.style.color = '#ff4444';
                    setTimeout(() => {
                        tooltip.textContent = 'Скопировать';
                        tooltip.style.color = '';
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