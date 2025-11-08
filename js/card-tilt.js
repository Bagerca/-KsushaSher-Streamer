document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section-cards');
    if (!heroSection) return;

    const wrapper = heroSection.querySelector('.cards-wrapper');
    const allCards = heroSection.querySelectorAll('.character-card');

    // Сохраняем изначальные transform стили, чтобы совмещать их с hover-эффектами
    allCards.forEach(card => {
        card.style.setProperty('--transform-original', getComputedStyle(card).transform);
    });

    // Отключаем эффект на тач-устройствах для лучшего UX
    if ('ontouchstart' in window) {
        return;
    }

    const maxTilt = 10; // Максимальный угол наклона в градусах

    function handleMouseMove(e) {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        // Находим позицию курсора от -0.5 до 0.5 относительно центра экрана
        const x = (clientX / innerWidth) - 0.5;
        const y = (clientY / innerHeight) - 0.5;
        
        // Рассчитываем углы поворота
        // Умножаем на -1, чтобы поворот был интуитивным (мышь вправо -> правая часть ближе)
        const rotateY = x * -maxTilt * 2;
        const rotateX = y * maxTilt * 2;

        wrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    function handleMouseLeave() {
        // Плавно возвращаем карточки в исходное положение
        wrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }

    heroSection.addEventListener('mousemove', handleMouseMove);
    heroSection.addEventListener('mouseleave', handleMouseLeave);
});
