/* js/hud-script.js */

document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section-hud');
    if (!heroSection) return;

    // =========================================
    // 1. ОБЩИЕ АНИМАЦИИ HUD (Scanline & Ticker)
    // =========================================
    
    const scanline = heroSection.querySelector('.hud-scanline');
    const dataTicker = heroSection.querySelector('#data-ticker');
    
    // Анимация сканирующей линии (если она есть в верстке)
    if (scanline) {
        let lastScanTime = 0;
        const scanSpeed = 0.05;
        function animateScanline(timestamp) {
            if (!lastScanTime) lastScanTime = timestamp;
            const deltaTime = timestamp - lastScanTime;
            lastScanTime = timestamp;
            
            if (!scanline) return;

            let currentTop = parseFloat(getComputedStyle(scanline).top) || 0;
            currentTop += scanSpeed * deltaTime;
            if (currentTop > heroSection.offsetHeight) currentTop = -scanline.offsetHeight;
            scanline.style.top = `${currentTop}px`;
            requestAnimationFrame(animateScanline);
        }
        requestAnimationFrame(animateScanline);
    }

    // Анимация бегущей строки с данными
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
        
        setTimeout(typeData, 1000);
    }

    // =========================================
    // 2. ЛОГИКА ПАНЕЛИ ОТРЯДА (SQUAD PANEL)
    // =========================================
    const squadPanel = document.getElementById('squad-panel');
    
    if (squadPanel) {
        const squadMembers = squadPanel.querySelectorAll('.squad-member');
        const closeDetailBtn = squadPanel.querySelector('.close-detail-btn');
        const detailView = squadPanel.querySelector('.squad-detail-view');
        
        // Пытаемся найти контейнер для детального аватара
        let detailAvatarContainer = detailView ? detailView.querySelector('.detail-avatar-container') : null;
        
        // ФИКС: Если в HTML остался старый <img>, заменяем его на <div> контейнер
        // Это нужно для того, чтобы стили рамок и теней (box-shadow) работали корректно
        if (detailView && !detailAvatarContainer) {
            const oldImg = detailView.querySelector('.detail-avatar');
            if (oldImg) {
                detailAvatarContainer = document.createElement('div');
                detailAvatarContainer.className = 'detail-avatar-container';
                // Вставляем контейнер вместо старой картинки
                oldImg.parentNode.insertBefore(detailAvatarContainer, oldImg);
                oldImg.remove();
            }
        }

        const detailName = detailView ? detailView.querySelector('.detail-name') : null;
        const detailDescription = detailView ? detailView.querySelector('.detail-description') : null;
        
        let typewriterTimeout;

        // ДАННЫЕ ОБ УЧАСТНИКАХ (ВСЕ С КАРТИНКАМИ)
        const squadData = {
            bagerka: {
                name: "BAGERca",
                type: "image",
                content: "assets/images/bagerca.jpg",
                color: "var(--bagerka-color)",
                description: "Архитектор этого хаоса и главный сектант Чернильного Демона. Уровень фанатизма по Bendy превышает системные нормы. Статус: Муж. Диагноз: Объелся государственных груш. Кодит на чистом энтузиазме и чернилах."
            },
            angel: {
                name: "Angel",
                type: "image",
                content: "assets/images/angel.jpg",
                color: "var(--angel-color)",
                description: "Элитный оперативник кооператива. Обладает запредельным скиллом и реакцией. Пока остальные пытаются понять тактику, она уже зачистила локацию. Тот самый тимейт, который в одиночку вытаскивает команду из любых передряг."
            },
            kiriki: {
                name: "Kiriki",
                type: "image",
                content: "assets/images/kiriki.jpg",
                color: "var(--kiriki-color)",
                description: "Нейро-композитор и повелитель алгоритмов. Создает уникальную музыку с помощью нейросетей, превращая искусственный интеллект в инструмент искусства. Отвечает за нейронные ритмы сообщества."
            }
        };

        // Функция эффекта "пишущей машинки" для описания
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
        
        // Обработчик клика по участнику
        if (squadMembers.length > 0 && detailView) {
            squadMembers.forEach(member => {
                member.addEventListener('click', () => {
                    const memberId = member.dataset.member;
                    const data = squadData[memberId];
                    
                    if (data && detailAvatarContainer) {
                        // 1. Настраиваем цвет рамки и тени
                        detailAvatarContainer.style.borderColor = data.color;
                        detailAvatarContainer.style.boxShadow = `0 0 15px ${data.color}`;
                        detailAvatarContainer.style.color = data.color;

                        // 2. Вставляем контент (в данном случае картинку)
                        if (data.type === 'image') {
                            detailAvatarContainer.innerHTML = `<img src="${data.content}" alt="${data.name}">`;
                        } else {
                            // Резервный вариант для иконок
                            detailAvatarContainer.innerHTML = `<i class="${data.content}" style="text-shadow: 0 0 10px ${data.color}"></i>`;
                        }

                        // 3. Заполняем имя и цвет
                        if (detailName) {
                            detailName.textContent = data.name;
                            detailName.style.color = data.color;
                        }
                        
                        // 4. Запускаем анимацию текста
                        typewriter(detailDescription, data.description);
                        
                        // 5. Показываем детальную панель
                        squadPanel.classList.add('expanded');
                    }
                });
            });
        }

        // Обработчик закрытия
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => {
                squadPanel.classList.remove('expanded');
                clearTimeout(typewriterTimeout);
            });
        }
    }
});
