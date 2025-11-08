document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section-hud');
    if (!heroSection) return;

    // --- ОБЩИЕ АНИМАЦИИ HUD ---
    const scanline = heroSection.querySelector('.hud-scanline');
    const dataTicker = heroSection.querySelector('#data-ticker');

    // 1. Анимация сканирующей линии
    let lastScanTime = 0;
    const scanSpeed = 0.05;
    function animateScanline(timestamp) {
        if (!lastScanTime) lastScanTime = timestamp;
        const deltaTime = timestamp - lastScanTime;
        lastScanTime = timestamp;
        let currentTop = parseFloat(getComputedStyle(scanline).top) || 0;
        currentTop += scanSpeed * deltaTime;
        if (currentTop > heroSection.offsetHeight) currentTop = -scanline.offsetHeight;
        scanline.style.top = `${currentTop}px`;
        requestAnimationFrame(animateScanline);
    }
    requestAnimationFrame(animateScanline);

    // 2. Анимация "бегущей строки" с данными
    const dataMessages = ["АНАЛИЗ СТАТИСТИКИ КАНАЛА...", "ПОДПИСЧИКОВ: 5.2K+", "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%", "АКТИВНОСТЬ ЧАТА: ВЫСОКАЯ", "СИСТЕМЫ В НОРМЕ."];
    let messageIndex = 0, charIndex = 0, isDeleting = false;
    let typingTimeout;
    function typeData() {
        if (!dataTicker) return;
        clearTimeout(typingTimeout);
        const fullMessage = dataMessages[messageIndex];
        let currentMessage = isDeleting ? fullMessage.substring(0, charIndex--) : fullMessage.substring(0, charIndex++);
        dataTicker.textContent = currentMessage + '|';
        let typeSpeed = isDeleting ? 30 : 80;
        if (!isDeleting && charIndex === fullMessage.length + 1) { isDeleting = true; typeSpeed = 2000; }
        else if (isDeleting && charIndex === -1) { isDeleting = false; messageIndex = (messageIndex + 1) % dataMessages.length; }
        typingTimeout = setTimeout(typeData, typeSpeed);
    }
    setTimeout(typeData, 1000);

    // --- НОВАЯ ЛОГИКА: АНИМАЦИЯ ПОДКЛЮЧЕНИЯ К СТРИМУ ---
    const mainDisplayLink = document.getElementById('main-display-link');
    const twitchButton = document.querySelector('.cta-button.twitch');
    let isConnecting = false; // Флаг, чтобы предотвратить двойное нажатие

    function initiateConnectionSequence(event) {
        // 1. Предотвращаем стандартный переход по ссылке
        event.preventDefault();
        
        if (isConnecting) return; // Если анимация уже запущена, ничего не делаем
        isConnecting = true;

        // 2. Находим все нужные элементы
        const rings = mainDisplayLink.querySelectorAll('.ring');
        const statusDisplay = mainDisplayLink.querySelector('.main-display-status');
        const statusText = statusDisplay.querySelector('.status-text');
        const redirectUrl = this.href;

        // 3. Запускаем анимацию
        statusDisplay.classList.add('connecting');
        rings.forEach(ring => ring.classList.add('fast-spin'));

        // 4. Запускаем эффект "пишущей машинки" для текста статуса
        let i = 0;
        const newText = "ПОДКЛЮЧЕНИЕ...";
        statusText.textContent = '';
        const typingInterval = setInterval(() => {
            if (i < newText.length) {
                statusText.textContent += newText.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 80);

        // 5. Через 1.5 секунды перенаправляем пользователя
        setTimeout(() => {
            window.open(redirectUrl, '_blank');
            
            // Возвращаем все в исходное состояние (на случай, если пользователь вернется на вкладку)
            statusDisplay.classList.remove('connecting');
            rings.forEach(ring => ring.classList.remove('fast-spin'));
            statusText.textContent = "ПРЯМАЯ ТРАНСЛЯЦИЯ";
            isConnecting = false;

        }, 1500);
    }

    // 6. Назначаем обработчики событий
    if (mainDisplayLink) {
        mainDisplayLink.addEventListener('click', initiateConnectionSequence);
    }
    if (twitchButton) {
        twitchButton.addEventListener('click', initiateConnectionSequence);
    }


    // --- ЛОГИКА ПАНЕЛИ ОТРЯДА ---
    const squadPanel = document.getElementById('squad-panel');
    if (squadPanel) {
        const squadMembers = squadPanel.querySelectorAll('.squad-member');
        const closeDetailBtn = squadPanel.querySelector('.close-detail-btn');
        const detailView = squadPanel.querySelector('.squad-detail-view');
        const detailAvatar = detailView.querySelector('.detail-avatar');
        const detailName = detailView.querySelector('.detail-name');
        const detailDescription = detailView.querySelector('.detail-description');
        let typewriterTimeout;

        // Данные об участниках
        const squadData = {
            bagerka: {
                name: "BAGERca",
                avatar: "assets/images/bagerca.jpg",
                color: "var(--bagerka-color)",
                description: "Технический гений и создатель этого сайта. Решает нерешаемые задачи и превращает код в магию. Всегда на страже стабильности."
            },
            angel: {
                name: "Angel",
                avatar: "assets/images/angel.jpg",
                color: "var(--angel-color)",
                description: "Ангел-хранитель сообщества. Создает позитивную и уютную атмосферу. Помогает новичкам и поддерживает порядок в чате."
            },
            kiriki: {
                name: "Kiriki",
                avatar: "assets/images/kiriki.jpg",
                color: "var(--kiriki-color)",
                description: "Мастер мемов и генератор хорошего настроения. Его шутки и остроумие заряжают энергией даже самые скучные моменты."
            }
        };

        // Функция эффекта "пишущей машинки"
        function typewriter(element, text, speed = 40) {
            clearTimeout(typewriterTimeout);
            let i = 0;
            element.innerHTML = "";
            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    typewriterTimeout = setTimeout(type, speed);
                } else {
                    element.innerHTML = element.innerHTML.replace('|', ''); // Убираем курсор в конце
                }
            }
            type();
        }
        
        // Открытие детального вида
        squadMembers.forEach(member => {
            member.addEventListener('click', () => {
                const memberId = member.dataset.member;
                const data = squadData[memberId];
                
                if (data) {
                    // Заполняем данными
                    detailAvatar.src = data.avatar;
                    detailAvatar.style.borderColor = data.color;
                    detailAvatar.style.boxShadow = `0 0 15px ${data.color}`;
                    detailName.textContent = data.name;
                    detailName.style.color = data.color;
                    
                    // Запускаем анимацию текста
                    typewriter(detailDescription, data.description);
                    
                    // Показываем панель
                    squadPanel.classList.add('expanded');
                }
            });
        });

        // Закрытие детального вида
        closeDetailBtn.addEventListener('click', () => {
            squadPanel.classList.remove('expanded');
            // Прерываем анимацию текста при закрытии
            clearTimeout(typewriterTimeout);
        });
    }
});
