document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section-hud');
    if (!heroSection) return;

    const scanline = heroSection.querySelector('.hud-scanline');
    const dataTicker = heroSection.querySelector('#data-ticker');
    
    // 1. Анимация сканирующей линии
    let lastTime = 0;
    const speed = 0.05; // скорость в % от высоты экрана в мс

    function animateScanline(timestamp) {
        if (!lastTime) {
            lastTime = timestamp;
        }
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        let currentTop = parseFloat(getComputedStyle(scanline).top) || 0;
        currentTop += speed * deltaTime;

        if (currentTop > heroSection.offsetHeight) {
            currentTop = -scanline.offsetHeight;
        }

        scanline.style.top = `${currentTop}px`;
        requestAnimationFrame(animateScanline);
    }
    requestAnimationFrame(animateScanline);


    // 2. Анимация "бегущей строки" с данными
    const dataMessages = [
        "АНАЛИЗ СТАТИСТИКИ КАНАЛА...",
        "ПОДПИСЧИКОВ: 5.2K+",
        "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%",
        "АКТИВНОСТЬ ЧАТА: ВЫСОКАЯ",
        "ЗАГРУЗКА СПИСКА ИГР...",
        "СИНХРОНИЗАЦИЯ С TWITCH API...",
        "СИСТЕМЫ В НОРМЕ."
    ];
    let messageIndex = 0;
    let charIndex = 0;
    let currentMessage = '';
    let isDeleting = false;

    function typeData() {
        if (!dataTicker) return;
        const fullMessage = dataMessages[messageIndex];
        
        if (isDeleting) {
            currentMessage = fullMessage.substring(0, charIndex - 1);
            charIndex--;
        } else {
            currentMessage = fullMessage.substring(0, charIndex + 1);
            charIndex++;
        }

        dataTicker.textContent = currentMessage + '|';

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === fullMessage.length) {
            isDeleting = true;
            typeSpeed = 2000; // Пауза перед удалением
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            messageIndex = (messageIndex + 1) % dataMessages.length;
        }
        
        setTimeout(typeData, typeSpeed);
    }
    
    setTimeout(typeData, 1000);
});
