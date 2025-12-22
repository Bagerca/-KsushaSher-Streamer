/* js/comets.js */

// Контейнеры и переменные состояния
let containerBg = null;
let showerInterval = null;
let bodyObserver = null; // Наблюдатель за изменением высоты страницы

// Цвета комет (Неоновая палитра)
const cometColors = [
    '#39ff14', // Neon Green
    '#ff2d95', // Neon Pink
    '#ff4444', // Red
    '#ff8c00', // Orange
    '#007bff', // Blue
    '#00ffff', // Cyan
    '#ffffff'  // White
];

/**
 * Инициализация системы комет (Фоновый режим)
 */
export function initCometSystem() {
    containerBg = document.getElementById('comet-system');
    
    if (!containerBg) return;

    // --- НАСТРОЙКА КОНТЕЙНЕРА ---
    // Используем absolute позиционирование, чтобы покрыть весь документ, включая скролл
    Object.assign(containerBg.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        zIndex: '0',    
        pointerEvents: 'none',
        overflow: 'hidden'
    });

    // Функция для обновления высоты контейнера под размер документа
    const updateContainerHeight = () => {
        const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        containerBg.style.height = `${docHeight}px`;
    };

    // 1. Устанавливаем высоту сразу
    updateContainerHeight();
    
    // 2. Следим за изменением размера контента (например, при разворачивании архива)
    bodyObserver = new ResizeObserver(() => {
        updateContainerHeight();
    });
    bodyObserver.observe(document.body);

    // 3. Следим за ресайзом окна браузера
    window.addEventListener('resize', updateContainerHeight);

    console.log('🌠 Comet system initialized (Auto-Resize Mode).');
    
    // Запускаем бесконечный цикл редких фоновых комет
    scheduleNextIdleCycle();
}

/**
 * Планировщик фоновых комет (Редкие пролеты)
 */
function scheduleNextIdleCycle() {
    // Случайная задержка между кометами (30-60 секунд)
    const delay = Math.random() * 30000 + 30000; 
    
    setTimeout(() => {
        // Проверяем, не идет ли сейчас активный шторм (команда COMET), чтобы не мешать
        if (!showerInterval) {
            const count = Math.random() > 0.7 ? 2 : 1;
            const side = Math.floor(Math.random() * 4);
            
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    spawnComet(side);
                }, i * 300); 
            }
        }
        // Планируем следующий цикл
        scheduleNextIdleCycle();
    }, delay);
}

/**
 * ЭКСПОРТ: Запуск метеоритного дождя (Вызывается из консоли/терминала)
 */
export function triggerCometShower() {
    if (!containerBg) return;
    
    console.log("🌠 METEOR SHOWER STARTED (10s duration)");

    // Если уже идет, перезапускаем
    if (showerInterval) clearInterval(showerInterval);

    const startTime = Date.now();
    const duration = 10000; // Длительность шторма

    showerInterval = setInterval(() => {
        // Проверка времени
        if (Date.now() - startTime > duration) {
            stopCometShower(); 
            return;
        }

        // Спавним пачку комет
        const batchSize = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < batchSize; i++) {
            spawnComet(null, true); // true = быстрые кометы
        }
    }, 100);
}

/**
 * ЭКСПОРТ: Остановка метеоритного дождя
 */
export function stopCometShower() {
    // 1. Останавливаем генератор
    if (showerInterval) {
        clearInterval(showerInterval);
        showerInterval = null;
        console.log("🌠 METEOR SHOWER STOPPED");
    }

    // 2. Удаляем все активные кометы мгновенно
    if (containerBg) {
        const activeComets = containerBg.querySelectorAll('.comet');
        activeComets.forEach(el => el.remove());
    }
}

/**
 * Создание и анимация одной кометы
 * @param {number|null} forcedSide - Принудительная сторона (0-3) или null для рандома
 * @param {boolean} isFast - Режим "шторма" (быстрее и короче)
 */
function spawnComet(forcedSide = null, isFast = false) {
    if (!containerBg) return;

    const comet = document.createElement('div');
    comet.className = 'comet';
    
    const scaleModifier = 1;
    const color = cometColors[Math.floor(Math.random() * cometColors.length)];
    
    // Стили самой кометы (голова + хвост градиентом)
    comet.style.color = color;
    comet.style.background = `linear-gradient(90deg, transparent, ${color}, #fff)`;
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scrollY = window.scrollY;
    const offset = 150; // Спавн за пределами экрана

    const side = forcedSide !== null ? forcedSide : Math.floor(Math.random() * 4);
    
    let startX, startY, endX, endY;

    // Определение координат старта и финиша в зависимости от стороны
    switch(side) {
        case 0: // Top -> Down
            startX = Math.random() * w; 
            startY = scrollY - offset; 
            endX = Math.random() * w; 
            endY = scrollY + h + offset; 
            break;
        case 1: // Right -> Left
            startX = w + offset; 
            startY = scrollY + Math.random() * h;
            endX = -offset; 
            endY = scrollY + Math.random() * h;
            break;
        case 2: // Bottom -> Up
            startX = Math.random() * w; 
            startY = scrollY + h + offset;
            endX = Math.random() * w; 
            endY = scrollY - offset; 
            break;
        case 3: // Left -> Right
            startX = -offset; 
            startY = scrollY + Math.random() * h;
            endX = w + offset; 
            endY = scrollY + Math.random() * h;
            break;
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Скорость
    let speedBase = isFast ? (Math.random() * 0.8 + 1.2) : (Math.random() * 0.3 + 0.2);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = distance / speedBase;

    // Размеры
    const length = Math.min(Math.max(speedBase * 300, 150), 600) * scaleModifier;
    const thickness = (Math.random() * 2 + 1) * scaleModifier;

    comet.style.width = `${length}px`;
    comet.style.height = `${thickness}px`;

    containerBg.appendChild(comet);

    // WAAPI Анимация
    const animation = comet.animate([
        { transform: `translate(${startX}px, ${startY}px) rotate(${angle}deg)`, opacity: 0 },
        { transform: `translate(${startX + deltaX * 0.15}px, ${startY + deltaY * 0.15}px) rotate(${angle}deg)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${endX}px, ${endY}px) rotate(${angle}deg)`, opacity: 0 }
    ], {
        duration: duration,
        easing: 'linear'
    });

    // Удаление DOM элемента после завершения анимации
    animation.onfinish = () => {
        if (comet.parentNode) comet.remove();
    };
}