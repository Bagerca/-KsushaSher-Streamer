/* js/comets.js */

export function initCometSystem() {
    const container = document.getElementById('comet-system');
    if (!container) return;

    // Цвета подписчиков (и общие неоновые)
    const cometColors = [
        '#39ff14', // Neon Green
        '#ff2d95', // Neon Pink
        '#ff4444', // BAGERca Red
        '#ff8c00', // Angel Orange
        '#007bff', // Kiriki Blue
        '#ff000a', // Dragon Red
        '#2e8b57', // Forest Green
        '#00ffff', // Cyan
        '#bd00ff', // Purple
        '#ffffff'  // White (Classic)
    ];

    function spawnComet() {
        // Создаем элемент
        const comet = document.createElement('div');
        comet.className = 'comet';
        
        // 1. Выбор цвета
        const color = cometColors[Math.floor(Math.random() * cometColors.length)];
        comet.style.color = color; // Для drop-shadow через currentColor
        
        // Градиент: Прозрачный -> Цвет -> Белая голова
        comet.style.background = `linear-gradient(90deg, transparent, ${color}, #fff)`;

        // 2. Расчет координат (Откуда -> Куда)
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Сторона появления: 0-Top, 1-Right, 2-Bottom, 3-Left
        const side = Math.floor(Math.random() * 4);
        
        let startX, startY, endX, endY;
        const offset = 100; // Вылет за пределы экрана

        switch(side) {
            case 0: // Top -> летим вниз (и немного вбок)
                startX = Math.random() * w;
                startY = -offset;
                endX = Math.random() * w; // Можно усовершенствовать, чтобы летело по диагонали
                endY = h + offset;
                break;
            case 1: // Right -> летим влево
                startX = w + offset;
                startY = Math.random() * h;
                endX = -offset;
                endY = Math.random() * h; // Рандомная высота финиша
                break;
            case 2: // Bottom -> летим вверх
                startX = Math.random() * w;
                startY = h + offset;
                endX = Math.random() * w;
                endY = -offset;
                break;
            case 3: // Left -> летим вправо
                startX = -offset;
                startY = Math.random() * h;
                endX = w + offset;
                endY = Math.random() * h;
                break;
        }

        // 3. Математика вектора и угла
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Угол в градусах

        // 4. Скорость и Хвост
        // Базовая скорость: чем больше экран, тем дольше лететь, плюс рандом
        // Скорость (пикселей в мс)
        const speedBase = Math.random() * 0.5 + 0.3; // 0.3 - 0.8 px/ms
        const duration = distance / speedBase; // Время полета

        // Длина хвоста зависит от скорости (быстрее = длиннее)
        // size: 100px - 400px
        const length = Math.min(Math.max(speedBase * 400, 100), 500);
        const thickness = Math.random() * 2 + 1; // 1-3px

        // Применяем стили
        comet.style.width = `${length}px`;
        comet.style.height = `${thickness}px`;
        
        // Позиционируем в 0,0 и двигаем через transform, чтобы не вызывать перерисовку layout
        // ВАЖНО: transform-origin у нас right center (голова).
        // Поэтому начальная позиция должна учитывать, что мы рисуем хвост ВЛЕВО от точки.
        // Но проще использовать animate() API.

        container.appendChild(comet);

        // 5. Запуск анимации через Web Animations API
        const animation = comet.animate([
            {
                transform: `translate(${startX}px, ${startY}px) rotate(${angle}deg)`,
                opacity: 0
            },
            {
                transform: `translate(${startX + deltaX * 0.1}px, ${startY + deltaY * 0.1}px) rotate(${angle}deg)`,
                opacity: 1,
                offset: 0.1 // Быстрое появление
            },
            {
                transform: `translate(${endX}px, ${endY}px) rotate(${angle}deg)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'linear'
        });

        // Удаление после завершения
        animation.onfinish = () => {
            comet.remove();
        };

        // 6. Планирование следующей кометы
        // Рандомная задержка (чем чаще, тем динамичнее)
        const nextDelay = Math.random() * 1000 + 500; // 0.5 - 1.5 сек
        setTimeout(spawnComet, nextDelay);
    }

    // Запускаем несколько потоков для плотности
    spawnComet();
    setTimeout(spawnComet, 1000);
    setTimeout(spawnComet, 2000);
}