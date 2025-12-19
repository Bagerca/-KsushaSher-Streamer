/* js/comets.js */

// Основной контейнер
let container = null;

// Цвета
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
 * Инициализация системы комет
 */
export function initCometSystem() {
    container = document.getElementById('comet-system');
    if (!container) return;

    console.log('🌠 Comet system initialized. Waiting for cycle...');
    
    // Запускаем бесконечный цикл редкого появления
    scheduleNextIdleCycle();
}

/**
 * Планировщик редких событий (1-2 кометы раз в 30-60 сек)
 */
function scheduleNextIdleCycle() {
    // Рандомная задержка от 30 до 60 секунд
    const delay = Math.random() * 30000 + 30000; 
    
    setTimeout(() => {
        // Решаем, сколько комет запустить: 1 (70%) или 2 (30%)
        const count = Math.random() > 0.7 ? 2 : 1;
        
        // Чтобы если их 2, они летели примерно с одной стороны,
        // передаем фиксированную сторону (side) в spawnComet
        const side = Math.floor(Math.random() * 4);
        
        for (let i = 0; i < count; i++) {
            // Небольшая задержка между парой комет (0 - 500мс)
            setTimeout(() => {
                spawnComet(side);
            }, i * 300); 
        }

        // Планируем следующий цикл
        scheduleNextIdleCycle();
    }, delay);
}

/**
 * ЭКСПОРТ: Функция для вызова из консоли (Метеоритный дождь)
 * Запускает много комет за короткое время
 */
export function triggerCometShower() {
    if (!container) return;
    
    // Количество комет в залпе (20-30 штук)
    const count = 30;
    
    for (let i = 0; i < count; i++) {
        // Разбрасываем их старт на протяжении 3 секунд
        const delay = Math.random() * 3000;
        
        setTimeout(() => {
            // В дожде кометы летят отовсюду (side = null -> рандом внутри функции)
            spawnComet(null, true); // true = быстрый режим
        }, delay);
    }
}

/**
 * Создание одной кометы
 * @param {number|null} forcedSide - Принудительная сторона (0-3) или null
 * @param {boolean} isFast - Если true, комета летит быстрее (для дождя)
 */
function spawnComet(forcedSide = null, isFast = false) {
    if (!container) return;

    const comet = document.createElement('div');
    comet.className = 'comet';
    
    const color = cometColors[Math.floor(Math.random() * cometColors.length)];
    comet.style.color = color;
    comet.style.background = `linear-gradient(90deg, transparent, ${color}, #fff)`;

    // Геометрия экрана
    const w = window.innerWidth;
    const h = window.innerHeight;
    const offset = 150;

    // Выбор стороны: 0-Top, 1-Right, 2-Bottom, 3-Left
    const side = forcedSide !== null ? forcedSide : Math.floor(Math.random() * 4);
    
    let startX, startY, endX, endY;

    // Логика координат (немного рандома в конечной точке)
    switch(side) {
        case 0: // Top -> Down
            startX = Math.random() * w; startY = -offset;
            endX = Math.random() * w; endY = h + offset;
            break;
        case 1: // Right -> Left
            startX = w + offset; startY = Math.random() * h;
            endX = -offset; endY = Math.random() * h;
            break;
        case 2: // Bottom -> Up
            startX = Math.random() * w; startY = h + offset;
            endX = Math.random() * w; endY = -offset;
            break;
        case 3: // Left -> Right
            startX = -offset; startY = Math.random() * h;
            endX = w + offset; endY = Math.random() * h;
            break;
    }

    // Векторная математика
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Скорость
    // Если "дождь" (isFast), то скорость выше (0.8 - 1.5 px/ms)
    // Если обычно, то медленнее (0.2 - 0.5 px/ms) для красоты
    const speedBase = isFast ? (Math.random() * 0.7 + 0.8) : (Math.random() * 0.3 + 0.2);
    const duration = distance / speedBase;

    // Размеры
    const length = Math.min(Math.max(speedBase * 300, 150), 600);
    const thickness = Math.random() * 2 + 1;

    comet.style.width = `${length}px`;
    comet.style.height = `${thickness}px`;

    container.appendChild(comet);

    // Анимация
    const animation = comet.animate([
        { transform: `translate(${startX}px, ${startY}px) rotate(${angle}deg)`, opacity: 0 },
        { transform: `translate(${startX + deltaX * 0.15}px, ${startY + deltaY * 0.15}px) rotate(${angle}deg)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${endX}px, ${endY}px) rotate(${angle}deg)`, opacity: 0 }
    ], {
        duration: duration,
        easing: 'linear'
    });

    animation.onfinish = () => comet.remove();
}