/* js/comets.js */

// Контейнеры
let containerBg = null;
let containerFg = null;

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
    containerBg = document.getElementById('comet-system');
    containerFg = document.getElementById('comet-system-fg');
    
    if (!containerBg) return;

    console.log('🌠 Comet system initialized (3D Mode). Waiting for cycle...');
    
    // Запускаем бесконечный цикл редкого появления
    scheduleNextIdleCycle();
}

/**
 * Планировщик редких событий (1-2 кометы раз в 30-60 сек)
 */
function scheduleNextIdleCycle() {
    const delay = Math.random() * 30000 + 30000; 
    
    setTimeout(() => {
        const count = Math.random() > 0.7 ? 2 : 1;
        const side = Math.floor(Math.random() * 4);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                spawnComet(side);
            }, i * 300); 
        }

        scheduleNextIdleCycle();
    }, delay);
}

/**
 * ЭКСПОРТ: Метеоритный дождь
 */
export function triggerCometShower() {
    if (!containerBg) return;
    
    const count = 30;
    
    for (let i = 0; i < count; i++) {
        const delay = Math.random() * 3000;
        setTimeout(() => {
            spawnComet(null, true); 
        }, delay);
    }
}

/**
 * Создание одной кометы
 */
function spawnComet(forcedSide = null, isFast = false) {
    // 1. РЕШАЕМ, ГДЕ ЛЕТИТ КОМЕТА (Сзади или Спереди)
    // 30% шанс пролететь перед лицом (над кольцами)
    const isForeground = Math.random() < 0.3;
    
    // Выбираем нужный контейнер
    const targetContainer = isForeground ? containerFg : containerBg;
    
    if (!targetContainer) return;

    const comet = document.createElement('div');
    comet.className = 'comet';
    
    // Если комета летит спереди, делаем её чуть ярче и толще (эффект перспективы)
    const scaleModifier = isForeground ? 1.5 : 1;
    
    const color = cometColors[Math.floor(Math.random() * cometColors.length)];
    comet.style.color = color;
    comet.style.background = `linear-gradient(90deg, transparent, ${color}, #fff)`;
    
    // Если спереди - добавляем размытие, типа "расфокус" от близость
    if (isForeground) {
        comet.style.filter = `drop-shadow(0 0 8px ${color}) blur(1px)`;
        comet.style.zIndex = "20"; // На всякий случай
    }

    // Геометрия экрана
    const w = window.innerWidth;
    const h = window.innerHeight;
    const offset = 150;

    const side = forcedSide !== null ? forcedSide : Math.floor(Math.random() * 4);
    
    let startX, startY, endX, endY;

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

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Скорость
    let speedBase = isFast ? (Math.random() * 0.7 + 0.8) : (Math.random() * 0.3 + 0.2);
    
    // Кометы на переднем плане визуально должны лететь быстрее (параллакс)
    if (isForeground) speedBase *= 1.5;

    const duration = distance / speedBase;

    // Размеры с учетом перспективы
    const length = Math.min(Math.max(speedBase * 300, 150), 600) * scaleModifier;
    const thickness = (Math.random() * 2 + 1) * scaleModifier;

    comet.style.width = `${length}px`;
    comet.style.height = `${thickness}px`;

    targetContainer.appendChild(comet);

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