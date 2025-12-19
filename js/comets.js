/* js/comets.js */

export function initCometSystem() {
    const container = document.getElementById('comet-system');
    if (!container) return;

    // Настройки
    const minDelay = 2000;  // Мин. пауза между кометами (мс)
    const maxDelay = 8000;  // Макс. пауза
    
    function spawnComet() {
        const comet = document.createElement('div');
        comet.className = 'comet';
        
        // Рандомизация параметров
        const startY = Math.random() * window.innerHeight * 0.7; // Появляются в верхней части
        const size = Math.random() * 2 + 1; // Толщина (1px - 3px)
        const duration = Math.random() * 1.5 + 0.8; // Скорость (0.8с - 2.3с)
        const colorVariant = Math.random() > 0.8 ? 'var(--neon-pink)' : 'var(--neon-green)'; // Иногда розовые
        
        // Применяем стили
        comet.style.top = `${startY}px`;
        comet.style.height = `${size}px`;
        comet.style.animationDuration = `${duration}s`;
        comet.style.filter = `drop-shadow(0 0 5px ${colorVariant})`;
        
        // Для разнообразия иногда меняем градиент
        if (colorVariant.includes('pink')) {
            comet.style.background = `linear-gradient(90deg, transparent, rgba(255, 45, 149, 0.5), #fff)`;
        }

        container.appendChild(comet);

        // Удаляем элемент после завершения анимации (чтобы не забивать память)
        setTimeout(() => {
            comet.remove();
        }, duration * 1000);

        // Планируем следующую комету
        const nextDelay = Math.random() * (maxDelay - minDelay) + minDelay;
        setTimeout(spawnComet, nextDelay);
    }

    // Запуск первой кометы
    setTimeout(spawnComet, 1000);
}