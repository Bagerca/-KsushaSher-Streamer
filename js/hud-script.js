document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section-hud');
    if (!heroSection) return;

    // --- ПРЕЛОАДЕР ---
    const preloader = document.getElementById('preloader');
    const matrixCanvas = document.getElementById('matrix-canvas');
    if (preloader && matrixCanvas) {
        const ctx = matrixCanvas.getContext('2d');
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%';
        const fontSize = 16;
        const columns = matrixCanvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        function drawMatrix() {
            ctx.fillStyle = 'rgba(7, 7, 17, 0.05)';
            ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            ctx.fillStyle = 'rgba(57, 255, 20, 0.7)';
            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < drops.length; i++) {
                const text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        const matrixInterval = setInterval(drawMatrix, 40);

        // Прячем прелоадер после завершения анимации текста
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                clearInterval(matrixInterval);
                preloader.style.display = 'none';
            }, 1000); // Даем время на анимацию исчезновения
        }, 5000); // Общее время прелоадера
    }

    // --- КАСТОМНЫЙ КУРСОР И ПАРАЛЛАКС ФОНА ---
    const cursorFollower = document.querySelector('.cursor-follower');
    const gridBackground = document.querySelector('.hud-grid-background');
    if (cursorFollower && window.matchMedia("(hover: hover)").matches) {
        window.addEventListener('mousemove', e => {
            cursorFollower.style.top = `${e.clientY}px`;
            cursorFollower.style.left = `${e.clientX}px`;

            const x = (e.clientX - window.innerWidth / 2) / window.innerWidth * -1;
            const y = (e.clientY - window.innerHeight / 2) / window.innerHeight * -1;
            gridBackground.style.transform = `translate(${x * 15}px, ${y * 15}px)`;
        });
    }

    // --- ОБЩИЕ АНИМАЦИИ HUD ---
    const scanline = heroSection.querySelector('.hud-scanline');
    const dataTicker = heroSection.querySelector('#data-ticker');
    
    // 1. Анимация сканирующей линии
    let lastScanTime = 0; const scanSpeed = 0.05;
    function animateScanline(t) { if (!lastScanTime) lastScanTime = t; const d = t - lastScanTime; lastScanTime = t; let c = parseFloat(getComputedStyle(scanline).top) || 0; c += scanSpeed * d; if (c > heroSection.offsetHeight) c = -scanline.offsetHeight; scanline.style.top = `${c}px`; requestAnimationFrame(animateScanline); }
    requestAnimationFrame(animateScanline);

    // 2. Анимация "бегущей строки"
    const dataMessages = ["АНАЛИЗ СТАТИСТИКИ КАНАЛА...", "ПОДПИСЧИКОВ: 5.2K+", "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%", "АКТИВНОСТЬ ЧАТА: ВЫСОКАЯ", "СИСТЕМЫ В НОРМЕ."];
    let msgIdx = 0, charIdx = 0, isDel = false; let typeTimeout;
    function typeData() { if (!dataTicker) return; clearTimeout(typeTimeout); const f = dataMessages[msgIdx]; let c = isDel ? f.substring(0, charIdx--) : f.substring(0, charIdx++); dataTicker.textContent = c + '|'; let s = isDel ? 30 : 80; if (!isDel && charIdx === f.length + 1) { isDel = true; s = 2000; } else if (isDel && charIdx === -1) { isDel = false; msgIdx = (msgIdx + 1) % dataMessages.length; } typeTimeout = setTimeout(typeData, s); }
    setTimeout(typeData, 5500); // Запускаем после прелоадера

    // --- ИНТЕРАКТИВНАЯ ЛЕВАЯ ПАНЕЛЬ ---
    const allyPanel = document.getElementById('ally-panel');
    if (allyPanel) {
        allyPanel.addEventListener('click', () => {
            allyPanel.classList.toggle('flipped');
        });
    }
    
    // --- АНИМАЦИЯ ПОДКЛЮЧЕНИЯ ---
    const mainDisplay = document.getElementById('main-display');
    const twitchLinks = document.querySelectorAll('.main-avatar-link, .cta-button.twitch');
    twitchLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            if (mainDisplay.classList.contains('connecting')) return; // Предотвращаем двойное нажатие
            mainDisplay.classList.add('connecting');
            const href = link.href;
            setTimeout(() => {
                window.open(href, '_blank');
                mainDisplay.classList.remove('connecting');
            }, 1500);
        });
    });

    // --- ЛОГИКА ПАНЕЛИ ОТРЯДА ---
    const squadPanel = document.getElementById('squad-panel');
    if (squadPanel) {
        const squadMembers = squadPanel.querySelectorAll('.squad-member'); const closeDetailBtn = squadPanel.querySelector('.close-detail-btn'); const detailView = squadPanel.querySelector('.squad-detail-view'); const detailAvatar = detailView.querySelector('.detail-avatar'); const detailName = detailView.querySelector('.detail-name'); const detailDescription = detailView.querySelector('.detail-description'); let typewriterTimeout;
        const squadData = { bagerka: { name: "BAGERca", avatar: "assets/images/bagerca.jpg", color: "var(--bagerka-color)", description: "Технический гений и создатель этого сайта. Решает нерешаемые задачи и превращает код в магию. Всегда на страже стабильности." }, angel: { name: "Angel", avatar: "assets/images/angel.jpg", color: "var(--angel-color)", description: "Ангел-хранитель сообщества. Создает позитивную и уютную атмосферу. Помогает новичкам и поддерживает порядок в чате." }, kiriki: { name: "Kiriki", avatar: "assets/images/kiriki.jpg", color: "var(--kiriki-color)", description: "Мастер мемов и генератор хорошего настроения. Его шутки и остроумие заряжают энергией даже самые скучные моменты." } };
        function typewriter(el, txt, spd = 40) { clearTimeout(typewriterTimeout); let i = 0; el.innerHTML = ""; function type() { if (i < txt.length) { el.innerHTML += txt.charAt(i); i++; typewriterTimeout = setTimeout(type, spd); } else { el.innerHTML = el.innerHTML.replace('|', ''); } } type(); }
        squadMembers.forEach(m => { m.addEventListener('click', (e) => { e.stopPropagation(); const id = m.dataset.member; const d = squadData[id]; if (d) { detailAvatar.src = d.avatar; detailAvatar.style.borderColor = d.color; detailAvatar.style.boxShadow = `0 0 15px ${d.color}`; detailName.textContent = d.name; detailName.style.color = d.color; typewriter(detailDescription, d.description); squadPanel.classList.add('expanded'); } }); });
        closeDetailBtn.addEventListener('click', (e) => { e.stopPropagation(); squadPanel.classList.remove('expanded'); clearTimeout(typewriterTimeout); });
    }
});
