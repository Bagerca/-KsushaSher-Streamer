document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section-hud');
    if (!heroSection) return;

    // --- ОБЩИЕ АНИМАЦИИ HUD ---
    const scanline = heroSection.querySelector('.hud-scanline');
    const dataTicker = heroSection.querySelector('#data-ticker');
    
    // 1. Анимация сканирующей линии (Запускаем только если элемент есть)
    if (scanline) {
        let lastScanTime = 0;
        const scanSpeed = 0.05;
        function animateScanline(timestamp) {
            if (!lastScanTime) lastScanTime = timestamp;
            const deltaTime = timestamp - lastScanTime;
            lastScanTime = timestamp;
            
            // Проверка на случай удаления элемента во время работы
            if (!scanline) return;

            let currentTop = parseFloat(getComputedStyle(scanline).top) || 0;
            currentTop += scanSpeed * deltaTime;
            if (currentTop > heroSection.offsetHeight) currentTop = -scanline.offsetHeight;
            scanline.style.top = `${currentTop}px`;
            requestAnimationFrame(animateScanline);
        }
        requestAnimationFrame(animateScanline);
    }

    // 2. Анимация "бегущей строки" с данными
    if (dataTicker) {
        const dataMessages = ["АНАЛИЗ СТАТИСТИКИ КАНАЛА...", "ПОДПИСЧИКОВ: 5.2K+", "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%", "АКТИВНОСТЬ ЧАТА: ВЫСОКАЯ", "СИСТЕМЫ В НОРМЕ."];
        let messageIndex = 0, charIndex = 0, isDeleting = false;
        let typingTimeout;
        
        function typeData() {
            clearTimeout(typingTimeout);
            const fullMessage = dataMessages[messageIndex];
            let currentMessage = isDeleting ? fullMessage.substring(0, charIndex--) : fullMessage.substring(0, charIndex++);
            
            dataTicker.textContent = currentMessage + '|';
            
            let typeSpeed = isDeleting ? 30 : 80;
            
            if (!isDeleting && charIndex === fullMessage.length + 1) { 
                isDeleting = true; 
                typeSpeed = 2000; 
            } else if (isDeleting && charIndex === -1) { 
                isDeleting = false; 
                messageIndex = (messageIndex + 1) % dataMessages.length; 
            }
            
            typingTimeout = setTimeout(typeData, typeSpeed);
        }
        
        // Задержка перед стартом
        setTimeout(typeData, 1000);
    }

    // --- ЛОГИКА ПАНЕЛИ ОТРЯДА ---
    const squadPanel = document.getElementById('squad-panel');
    if (squadPanel) {
        const squadMembers = squadPanel.querySelectorAll('.squad-member');
        const closeDetailBtn = squadPanel.querySelector('.close-detail-btn');
        const detailView = squadPanel.querySelector('.squad-detail-view');
        
        // Элементы внутри детального вида (проверяем их наличие)
        const detailAvatar = detailView ? detailView.querySelector('.detail-avatar') : null;
        const detailName = detailView ? detailView.querySelector('.detail-name') : null;
        const detailDescription = detailView ? detailView.querySelector('.detail-description') : null;
        
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
            if (!element) return;
            clearTimeout(typewriterTimeout);
            let i = 0;
            element.innerHTML = "";
            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    typewriterTimeout = setTimeout(type, speed);
                } else {
                    element.innerHTML = element.innerHTML.replace('|', ''); 
                }
            }
            type();
        }
        
        // Открытие детального вида
        if (squadMembers.length > 0 && detailView) {
            squadMembers.forEach(member => {
                member.addEventListener('click', () => {
                    const memberId = member.dataset.member;
                    const data = squadData[memberId];
                    
                    if (data) {
                        // Заполняем данными
                        if (detailAvatar) {
                            detailAvatar.src = data.avatar;
                            detailAvatar.style.borderColor = data.color;
                            detailAvatar.style.boxShadow = `0 0 15px ${data.color}`;
                        }
                        if (detailName) {
                            detailName.textContent = data.name;
                            detailName.style.color = data.color;
                        }
                        
                        // Запускаем анимацию текста
                        typewriter(detailDescription, data.description);
                        
                        // Показываем панель
                        squadPanel.classList.add('expanded');
                    }
                });
            });
        }

        // Закрытие детального вида
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => {
                squadPanel.classList.remove('expanded');
                clearTimeout(typewriterTimeout);
            });
        }
    }
});