// Глобальные переменные для данных
let gamesData = [];
let moviesData = [];
let scheduleData = { schedule: [] };

// Словарь для перевода жанров
const genreTranslations = {
    'puzzle': 'Головоломка',
    'adventure': 'Приключения',
    'simulator': 'Симулятор',
    'horror': 'Хоррор',
    'coop': 'Кооператив',
    'sandbox': 'Песочница',
    'metroidvania': 'Метроидвания',
    'fps': 'Шутер',
    'shooter': 'Шутер',
    'platformer': 'Платформер',
    'animation': 'Анимация',
    'fantasy': 'Фэнтези',
    'crossover': 'Кроссовер',
    'rpg': 'RPG',
    'cyberpunk': 'Киберпанк',
    'open-world': 'Открытый мир',
    'fantasy': 'Фэнтези',
    'sci-fi': 'Научная фантастика',
    'action': 'Экшен'
};

// Загрузка данных с сервера
async function loadData() {
    try {
        console.log('🔄 Загрузка данных...');
        
        const [gamesResponse, moviesResponse, scheduleResponse] = await Promise.all([
            fetch('games.json'),
            fetch('movies.json'), 
            fetch('schedule.json')
        ]);
        
        if (gamesResponse.ok) {
            gamesData = await gamesResponse.json();
            console.log(`✅ Загружено ${gamesData.length} игр`);
        } else {
            console.warn('❌ Файл games.json не найден, используем пустой массив');
            gamesData = [];
        }
        
        if (moviesResponse.ok) {
            moviesData = await moviesResponse.json();
            console.log(`✅ Загружено ${moviesData.length} фильмов`);
        } else {
            console.warn('❌ Файл movies.json не найден, используем пустой массив');
            moviesData = [];
        }
        
        if (scheduleResponse.ok) {
            scheduleData = await scheduleResponse.json();
            console.log(`✅ Загружено расписание: ${scheduleData.schedule?.length || 0} дней`);
        } else {
            console.warn('❌ Файл schedule.json не найден, используем пустое расписание');
            scheduleData = { schedule: [] };
        }
        
        initPage();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        // Fallback к старым данным если файлы не найдены
        await loadFallbackData();
    }
}

// Функция-запас на случай если файлы еще не созданы
async function loadFallbackData() {
    try {
        console.log('🔄 Загрузка fallback данных...');
        
        // Временные данные для инициализации
        gamesData = [
            {
                id: 'portal2',
                title: 'Portal 2',
                rating: 5,
                description: 'Культовая головоломка от Valve с уникальным геймплеем и юмором. Одна из лучших игр в своём жанре с захватывающим сюжетом и запоминающимися персонажами.',
                videoId: 'dQw4w9WgXcQ',
                image: 'https://cdn2.steamgriddb.com/grid/24be7c4485d63a3d70e038692172adce.png',
                genres: ['puzzle', 'adventure'],
                status: 'completed',
                customColor: '#39ff14'
            }
        ];
        
        moviesData = [
            {
                id: 'arcane',
                title: 'Arcane',
                rating: 5,
                description: 'Визуально потрясающий анимационный сериал по вселенной League of Legends. Глубокий сюжет о сестрах Вай и Пайлтовере.',
                videoId: 'dQw4w9WgXcQ',
                image: 'https://images-s.kinorium.com/movie/poster/2754301/w1500_50222111.jpg',
                genres: ['animation', 'fantasy'],
                status: 'watched',
                customColor: '#39ff14'
            }
        ];
        
        scheduleData = {
            schedule: [
                {
                    day: "Понедельник",
                    time: "16:00 - 19:00+",
                    game: "Dead Island 2", 
                    description: "Режем зомби в солнечном Калифорнийском аду"
                },
                {
                    day: "Вторник",
                    time: "16:00 - 19:00+",
                    game: "Genshin Impact",
                    description: "Исследуем Тейват и выполняем ежедневные задания"
                }
            ]
        };
        
        initPage();
        
    } catch (error) {
        console.error('❌ Ошибка fallback данных:', error);
    }
}

// Инициализация страницы
function initPage() {
    console.log('🚀 Инициализация страницы...');
    renderSchedule();
    renderCards(document.querySelector('#games-content .games-grid'), gamesData, 'game');
    renderCards(document.querySelector('#movies-content .games-grid'), moviesData, 'movie');
    highlightCurrentDay();
    setupEventListeners();
}

// Рендер расписания из JSON
function renderSchedule() {
    if (!scheduleData.schedule || scheduleData.schedule.length === 0) {
        console.warn('📅 Нет данных для расписания');
        return;
    }
    
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) {
        console.error('❌ Не найден элемент .schedule-list');
        return;
    }
    
    scheduleList.innerHTML = '';
    
    scheduleData.schedule.forEach(item => {
        const scheduleItem = document.createElement('div');
        scheduleItem.className = `schedule-item ${item.highlighted ? 'highlighted' : ''}`;
        
        scheduleItem.innerHTML = `
            <div class="schedule-day-wrapper">
                <div class="schedule-day">${item.day}</div>
                <div class="schedule-time">${item.time}</div>
            </div>
            <div class="schedule-content">
                <div class="schedule-game">${item.game}</div>
                <div class="schedule-desc">${item.description}</div>
            </div>
            <div class="schedule-status"></div>
        `;
        
        scheduleList.appendChild(scheduleItem);
    });
    
    console.log(`📅 Отрисовано ${scheduleData.schedule.length} дней расписания`);
}

// Генерация звезд рейтинга
function generateStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
    if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';
    
    return starsHtml;
}

// Рендер карточек игр/фильмов
function renderCards(container, data, type) {
    if (!container) {
        console.error(`❌ Контейнер для ${type} не найден`);
        return;
    }
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="no-content-message">
                <i class="fas fa-inbox"></i>
                <p>Пока нет ${type === 'game' ? 'игр' : 'фильмов'}</p>
                <small>Добавь контент через Telegram бота</small>
            </div>
        `;
        return;
    }
    
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute(`data-${type}`, item.id);
        
        // Добавляем класс статуса для цветной рамки
        if (type === 'game') {
            card.classList.add(item.status);
        } else {
            if (item.status === 'watched') card.classList.add('watched');
            else if (item.status === 'watching') card.classList.add('watching');
            else card.classList.add(item.status);
        }
        
        card.style.setProperty('--custom-hover-color', item.customColor || '#39ff14');
        
        const imageHtml = `<div class="game-image-container"><img src="${item.image}" alt="${item.title}" class="game-image" onerror="this.src='https://via.placeholder.com/300x400/333/fff?text=Изображение+не+загружено'"></div>`;
        
        const starsHtml = generateStars(item.rating);
        const genresHtml = item.genres.map(genre => 
            `<span class="game-genre">${genreTranslations[genre] || genre}</span>`
        ).join('');
        
        card.innerHTML = `
            ${imageHtml}
            <div class="game-info">
                <h3 class="game-title">${item.title}</h3>
                <div class="game-genres">${genresHtml}</div>
                <div class="game-rating">${starsHtml}<span>${item.rating}/5</span></div>
                <p class="game-description">${item.description}</p>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    attachCardListeners(type);
    console.log(`🎮 Отрисовано ${data.length} ${type === 'game' ? 'игр' : 'фильмов'}`);
}

// Прикрепление обработчиков к карточкам
function attachCardListeners(type) {
    const cards = document.querySelectorAll(`[data-${type}]`);
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.getAttribute(`data-${type}`);
            const item = (type === 'game' ? gamesData : moviesData).find(i => i.id === itemId);
            if (item) showModal(item);
        });
    });
}

// Показать модальное окно с деталями
function showModal(item) {
    const modalGameTitle = document.getElementById('modalGameTitle');
    const modalGameRating = document.getElementById('modalGameRating');
    const modalGameDescription = document.getElementById('modalGameDescription');
    const modalGameVideo = document.getElementById('modalGameVideo');
    const gameModal = document.getElementById('gameModal');
    
    modalGameTitle.textContent = item.title;
    modalGameRating.innerHTML = `${generateStars(item.rating)}<span>${item.rating}/5</span>`;
    modalGameDescription.textContent = item.description;
    modalGameVideo.src = `https://www.youtube.com/embed/${item.videoId}`;
    gameModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Закрыть модальное окно
function setupModalClose() {
    const closeModal = document.querySelector('.close-modal');
    const gameModal = document.getElementById('gameModal');
    
    if (closeModal && gameModal) {
        closeModal.addEventListener('click', () => {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.getElementById('modalGameVideo').src = '';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === gameModal) {
                gameModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                document.getElementById('modalGameVideo').src = '';
            }
        });
        
        window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && gameModal.style.display === 'block') {
                gameModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Автоматическое выделение текущего дня в расписании
function highlightCurrentDay() {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const today = new Date().getDay(); // 0-6 (воскресенье=0)
    
    // Находим все элементы расписания
    const scheduleItems = document.querySelectorAll('.schedule-item');
    
    // Убираем все активные статусы
    scheduleItems.forEach(item => {
        const status = item.querySelector('.schedule-status');
        if (status) {
            status.classList.remove('active');
        }
    });
    
    // Если сегодня выходной (0 или 6), ничего не выделяем
    if (today === 0 || today === 6) return;
    
    // Добавляем активный статус текущему дню (1-5 = пн-пт)
    const scheduleIndex = today - 1; // Преобразуем 1-5 в 0-4
    if (scheduleIndex < scheduleItems.length) {
        const currentStatus = scheduleItems[scheduleIndex].querySelector('.schedule-status');
        if (currentStatus) {
            currentStatus.classList.add('active');
        }
    }
}

// Настройка всех обработчиков событий
function setupEventListeners() {
    setupModalClose();
    setupMobileMenu();
    setupSmoothScrolling();
    setupGamesTabs();
    setupFilterToggle();
    setupSortTabs();
    setupToggleGames();
    setupCardNumberCopy();
    setupEasterEgg();
    setupExternalLinks();
}

// Mobile menu toggle
function setupMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
        
        document.querySelectorAll('#nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Smooth scrolling for anchor links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Header scroll behavior
function setupHeaderScroll() {
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    const headerHeight = header?.offsetHeight || 0;
    
    if (header) {
        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > headerHeight) {
                document.body.classList.add('scrolled-down');
                document.body.classList.remove('scrolled-up');
            } else {
                document.body.classList.remove('scrolled-down');
                document.body.classList.add('scrolled-up');
            }
            lastScrollTop = scrollTop;
        });
    }
}

// Games/Movies tabs functionality
function setupGamesTabs() {
    const gamesTabs = document.querySelectorAll('.games-tab');
    const gamesContent = document.getElementById('games-content');
    const moviesContent = document.getElementById('movies-content');
    const tabSlider = document.querySelector('.tab-slider');
    
    if (!gamesTabs.length || !tabSlider) return;
    
    gamesTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            gamesTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
            
            const previousContent = document.querySelector('.games-content.active');
            if (previousContent) {
                previousContent.classList.add('fade-out');
            }
            
            const currentTab = tab.dataset.tab;
            
            setTimeout(() => {
                if (currentTab === 'movies') {
                    document.querySelector('.games-filters')?.style.setProperty('display', 'none', 'important');
                    document.querySelector('.movies-filters')?.style.setProperty('display', 'block', 'important');
                    gamesContent?.classList.remove('active');
                    moviesContent?.classList.add('fade-in');
                    setTimeout(() => {
                        moviesContent?.classList.remove('fade-in');
                        moviesContent?.classList.add('active');
                    }, 300);
                } else {
                    document.querySelector('.movies-filters')?.style.setProperty('display', 'none', 'important');
                    document.querySelector('.games-filters')?.style.setProperty('display', 'block', 'important');
                    moviesContent?.classList.remove('active');
                    gamesContent?.classList.add('fade-in');
                    setTimeout(() => {
                        gamesContent?.classList.remove('fade-in');
                        gamesContent?.classList.add('active');
                    }, 300);
                }
                
                if (previousContent) {
                    previousContent.classList.remove('fade-out');
                    previousContent.classList.remove('active');
                }
            }, 300);
        });
    });
}

// Filter toggle
function setupFilterToggle() {
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');
    
    if (filterToggle && filterDropdown) {
        filterToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            filterDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
                filterDropdown.classList.remove('active');
            }
        });
    }
}

// Sort tabs
function setupSortTabs() {
    const sortTabs = document.querySelectorAll('.sort-tab');
    const sortSlider = document.querySelector('.sort-slider');
    
    if (sortTabs.length && sortSlider) {
        sortTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                sortTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
            });
        });
    }
}

// Toggle games grid
function setupToggleGames() {
    const toggleGamesBtn = document.getElementById('toggle-games');
    
    if (toggleGamesBtn) {
        let isExpanded = false;
        
        toggleGamesBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            const activeContent = document.querySelector('.games-content.active');
            const activeGrid = activeContent?.querySelector('.games-grid');
            
            if (activeGrid) {
                if (isExpanded) {
                    activeGrid.style.maxHeight = 'none';
                    activeGrid.style.webkitMaskImage = 'none';
                    activeGrid.style.maskImage = 'none';
                    toggleGamesBtn.textContent = 'Свернуть';
                } else {
                    activeGrid.style.maxHeight = '800px';
                    activeGrid.style.webkitMaskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
                    activeGrid.style.maskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
                    toggleGamesBtn.textContent = 'Развернуть';
                    
                    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
}

// Copy card number function
function setupCardNumberCopy() {
    const cardNumber = document.getElementById('card-number');
    
    if (cardNumber) {
        cardNumber.addEventListener('click', function() {
            const cardNumberText = '4276 1805 5058 1960';
            navigator.clipboard.writeText(cardNumberText.replace(/\s/g, ''))
                .then(() => {
                    const tooltip = document.getElementById('copy-tooltip');
                    if (tooltip) {
                        tooltip.textContent = 'Скопировано!';
                        setTimeout(() => {
                            tooltip.textContent = 'Нажмите чтобы скопировать';
                        }, 2000);
                    }
                })
                .catch(err => console.error('Ошибка при копировании: ', err));
        });
    }
}

// Easter egg - history section on image click
function setupEasterEgg() {
    const heroImage = document.getElementById('hero-image-click');
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModal = document.querySelector('.close-history-modal');
    
    if (heroImage && historyModal && closeHistoryModal) {
        let clickCount = 0;
        
        heroImage.addEventListener('click', () => {
            clickCount++;
            heroImage.classList.add('clicked');
            
            setTimeout(() => {
                heroImage.classList.remove('clicked');
            }, 300);
            
            if (clickCount >= 14) {
                historyModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                clickCount = 0;
            }
        });
        
        closeHistoryModal.addEventListener('click', () => {
            historyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === historyModal) {
                historyModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && historyModal.style.display === 'block') {
                historyModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Make sure all external links open in new tab
function setupExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// Установка позиции слайдера табов
function setTabSliderPosition(tabElement, sliderElement) {
    const activeTab = tabElement?.querySelector('.active');
    if (activeTab && sliderElement) {
        sliderElement.style.width = `${activeTab.offsetWidth}px`;
        sliderElement.style.left = `${activeTab.offsetLeft}px`;
    }
}

// Simple animation for stats counting
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Activate animation when stats section is in view
function setupStatsAnimation() {
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumbers = document.querySelectorAll('.stat-number');
                    statNumbers.forEach((el, index) => {
                        const endValue = parseInt(el.textContent);
                        animateValue(el, 0, endValue, 2000);
                    });
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(statsSection);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, начинаем инициализацию...');
    
    // Загружаем данные
    loadData();
    
    // Настраиваем обработчики
    setupEventListeners();
    setupHeaderScroll();
    setupStatsAnimation();
    
    // Обновляем слайдеры
    setTimeout(() => {
        setTabSliderPosition(document.querySelector('.games-tabs'), document.querySelector('.tab-slider'));
        setTabSliderPosition(document.querySelector('.sort-tabs'), document.querySelector('.sort-slider'));
    }, 100);
    
    // Обновляем статус каждый час
    setInterval(highlightCurrentDay, 3600000);
    
    console.log('✅ Скрипт инициализирован');
});

// Стили для сообщения об отсутствии контента
const noContentStyles = `
    .no-content-message {
        text-align: center;
        padding: 40px 20px;
        color: var(--light-text);
        grid-column: 1 / -1;
    }
    
    .no-content-message i {
        font-size: 3rem;
        margin-bottom: 15px;
        color: var(--neon-pink);
    }
    
    .no-content-message p {
        font-size: 1.2rem;
        margin-bottom: 10px;
    }
    
    .no-content-message small {
        font-size: 0.9rem;
        opacity: 0.8;
    }
`;

// Добавляем стили в документ
const styleSheet = document.createElement('style');
styleSheet.textContent = noContentStyles;
document.head.appendChild(styleSheet);
