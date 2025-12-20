/* js/comets.js */

// Контейнеры
let containerBg = null;
let showerInterval = null;

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
    
    if (!containerBg) return;

    // --- НАСТРОЙКА КОНТЕЙНЕРА ---
    // Превращаем его из fixed (экран) в absolute (документ)
    Object.assign(containerBg.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%', // Будет растягиваться CSS-ом, но лучше подстраховаться
        zIndex: '0',    // Задний план
        pointerEvents: 'none',
        overflow: 'hidden'
    });

    // Функция обновления высоты контейнера при ресайзе/скролле
    const updateContainerHeight = () => {
        const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        containerBg.style.height = `${docHeight}px`;
    };

    // Обновляем высоту сразу и при изменении размера окна
    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    
    // (Опционально) Обновляем высоту раз в пару секунд на случай динамической подгрузки контента
    setInterval(updateContainerHeight, 2000);

    console.log('🌠 Comet system initialized (Absolute Document Mode).');
    
    // Запускаем фоновый цикл
    scheduleNextIdleCycle();
}

/**
 * Планировщик редких событий (Фоновый режим)
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
 * ЭКСПОРТ: Метеоритный дождь (10 секунд активности)
 */
export function triggerCometShower() {
    if (!containerBg) return;
    
    console.log("🌠 METEOR SHOWER STARTED (10s duration)");

    if (showerInterval) clearInterval(showerInterval);

    const startTime = Date.now();
    const duration = 10000;

    showerInterval = setInterval(() => {
        if (Date.now() - startTime > duration) {
            clearInterval(showerInterval);
            showerInterval = null;
            console.log("🌠 METEOR SHOWER ENDED");
            return;
        }

        const batchSize = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < batchSize; i++) {
            spawnComet(null, true); 
        }
    }, 100);
}

/**
 * Создание одной кометы
 */
function spawnComet(forcedSide = null, isFast = false) {
    if (!containerBg) return;

    const comet = document.createElement('div');
    comet.className = 'comet';
    
    const scaleModifier = 1;
    const color = cometColors[Math.floor(Math.random() * cometColors.length)];
    
    comet.style.color = color;
    comet.style.background = `linear-gradient(90deg, transparent, ${color}, #fff)`;
    
    // --- РАСЧЕТ КООРДИНАТ (С УЧЕТОМ СКРОЛЛА) ---
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Получаем текущую прокрутку страницы
    const scrollY = window.scrollY;
    
    const offset = 150; // Запас за границей экрана

    const side = forcedSide !== null ? forcedSide : Math.floor(Math.random() * 4);
    
    let startX, startY, endX, endY;

    // ВАЖНО: Во всех расчетах Y добавляем scrollY, чтобы координаты были относительно документа,
    // но визуально начинались в области видимости пользователя.

    switch(side) {
        case 0: // Top -> Down
            startX = Math.random() * w; 
            startY = scrollY - offset; // Чуть выше текущего экрана
            endX = Math.random() * w; 
            endY = scrollY + h + offset; // Чуть ниже текущего экрана
            break;
            
        case 1: // Right -> Left
            startX = w + offset; 
            startY = scrollY + Math.random() * h; // Случайная высота в пределах текущего экрана
            endX = -offset; 
            endY = scrollY + Math.random() * h;
            break;
            
        case 2: // Bottom -> Up
            startX = Math.random() * w; 
            startY = scrollY + h + offset; // Чуть ниже текущего экрана
            endX = Math.random() * w; 
            endY = scrollY - offset; // Чуть выше текущего экрана
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
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    let speedBase = isFast ? (Math.random() * 0.8 + 1.2) : (Math.random() * 0.3 + 0.2);
    const duration = distance / speedBase;

    const length = Math.min(Math.max(speedBase * 300, 150), 600) * scaleModifier;
    const thickness = (Math.random() * 2 + 1) * scaleModifier;

    comet.style.width = `${length}px`;
    comet.style.height = `${thickness}px`;

    containerBg.appendChild(comet);

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