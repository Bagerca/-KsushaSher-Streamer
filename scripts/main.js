// ==================== ОСНОВНОЙ ФАЙЛ ИНИЦИАЛИЗАЦИИ ====================
// Главный файл, который инициализирует все компоненты приложения

// Импорт необходимых модулей (в реальном проекте будут использоваться ES6 imports)
// import * as Constants from './utils/constants.js';
// import * as Helpers from './utils/helpers.js';
// import * as Loader from './core/loader.js';
// import * as UI from './core/ui.js';
// import * as Modal from './core/modal.js';
// import * as Schedule from './core/schedule.js';
// import * as GamesManager from './components/games-manager.js';
// import * as OrbitalSystem from './components/orbital-system.js';
// import * as Stats from './components/stats.js';

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
const App = {
    // Состояние приложения
    state: {
        currentTab: 'games',
        isMenuOpen: false,
        isGamesExpanded: false,
        loadedData: {
            games: false,
            movies: false,
            schedule: false,
            stats: false
        },
        currentFilters: {
            games: {
                genres: ['all'],
                status: ['status-all']
            },
            movies: {
                genres: ['all'],
                status: ['status-all']
            }
        },
        currentSort: 'name'
    },

    // DOM элементы
    elements: {},

    // Инициализированные модули
    modules: {}
};

// ==================== ОСНОВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация приложения Ksusha Sher...');
    
    try {
        // Инициализация всех компонентов
        initializeApp();
        
        // Загрузка данных
        loadInitialData();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Запуск периодических задач
        startPeriodicTasks();
        
        console.log('✅ Приложение успешно инициализировано');
    } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        showErrorNotification('Произошла ошибка при загрузке приложения');
    }
});

// ==================== ФУНКЦИИ ИНИЦИАЛИЗАЦИИ ====================

/**
 * Основная функция инициализации приложения
 */
function initializeApp() {
    // Инициализация DOM элементов
    initializeDOMElements();
    
    // Инициализация модулей
    initializeModules();
    
    // Настройка навигации
    setupNavigation();
    
    // Настройка адаптивности
    setupResponsiveBehavior();
}

/**
 * Инициализация всех DOM элементов
 */
function initializeDOMElements() {
    App.elements = {
        // Навигация
        mobileMenu: document.getElementById('mobile-menu'),
        navMenu: document.getElementById('nav-menu'),
        
        // Герой секция
        orbitalSystem: document.getElementById('orbital-system'),
        heroImage: document.getElementById('hero-image-click'),
        
        // Секция статистики
        statsSection: document.getElementById('stats'),
        statNumbers: document.querySelectorAll('.stat-number'),
        
        // Секция расписания
        scheduleList: document.getElementById('schedule-list'),
        
        // Секция игр/фильмов
        gamesSection: document.getElementById('games'),
        gamesTabs: document.querySelectorAll('.games-tab'),
        moviesTabs: document.querySelectorAll('.movies-tab'),
        sortTabs: document.querySelectorAll('.sort-tab'),
        filterToggle: document.getElementById('filter-toggle'),
        filterDropdown: document.getElementById('filter-dropdown'),
        gamesContent: document.getElementById('games-content'),
        moviesContent: document.getElementById('movies-content'),
        gamesGrid: document.querySelector('#games-content .games-grid'),
        moviesGrid: document.querySelector('#movies-content .games-grid'),
        toggleGamesBtn: document.getElementById('toggle-games'),
        
        // Модальные окна
        gameModal: document.getElementById('gameModal'),
        historyModal: document.getElementById('historyModal'),
        closeModalButtons: document.querySelectorAll('.close-modal, .close-history-modal'),
        
        // Прочие элементы
        cardNumber: document.getElementById('card-number'),
        copyTooltip: document.getElementById('copy-tooltip')
    };
    
    // Проверка наличия критически важных элементов
    validateCriticalElements();
}

/**
 * Проверка критически важных элементов
 */
function validateCriticalElements() {
    const criticalElements = [
        'mobileMenu', 'navMenu', 'gamesSection', 
        'gamesContent', 'moviesContent', 'gameModal'
    ];
    
    criticalElements.forEach(elementName => {
        if (!App.elements[elementName]) {
            console.warn(`⚠️  Отсутствует критический элемент: ${elementName}`);
        }
    });
}

/**
 * Инициализация модулей приложения
 */
function initializeModules() {
    // Здесь будут инициализированы модули после их создания
    App.modules = {
        // loader: Loader,
        // ui: UI,
        // modal: Modal,
        // schedule: Schedule,
        // gamesManager: GamesManager,
        // orbitalSystem: OrbitalSystem,
        // stats: Stats
    };
    
    // Временная инициализация базовых функций
    initializeFallbackModules();
}

/**
 * Временная инициализация базовых функций (заглушки)
 */
function initializeFallbackModules() {
    // Заглушки для модулей, которые будут реализованы позже
    App.modules.loader = {
        loadGames: () => console.log('📥 Загрузка игр...'),
        loadMovies: () => console.log('🎬 Загрузка фильмов...'),
        loadSchedule: () => console.log('📅 Загрузка расписания...'),
        loadStats: () => console.log('📊 Загрузка статистики...')
    };
    
    App.modules.ui = {
        setupMobileMenu: setupMobileMenu,
        setupSmoothScroll: setupSmoothScroll,
        setupHeaderScroll: setupHeaderScroll
    };
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================

/**
 * Загрузка начальных данных приложения
 */
function loadInitialData() {
    console.log('📥 Начальная загрузка данных...');
    
    // Последовательная загрузка данных с обработкой ошибок
    loadDataWithFallback()
        .then(() => {
            console.log('✅ Все данные успешно загружены');
            App.state.loadedData = {
                games: true,
                movies: true,
                schedule: true,
                stats: true
            };
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки данных:', error);
            showErrorNotification('Ошибка загрузки данных. Попробуйте обновить страницу.');
        });
}

/**
 * Загрузка данных с резервными вариантами
 */
async function loadDataWithFallback() {
    try {
        // Попытка загрузить данные из API
        await Promise.all([
            loadGamesData(),
            loadMoviesData(),
            loadScheduleData(),
            loadStatsData()
        ]);
    } catch (error) {
        console.warn('⚠️  Используем резервные данные...');
        
        // Используем резервные данные или демо-контент
        await loadFallbackData();
    }
}

/**
 * Загрузка данных игр
 */
async function loadGamesData() {
    try {
        const response = await fetch('data/games.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Ошибка загрузки игр');
        
        const games = await response.json();
        renderGamesGrid(games);
        App.state.loadedData.games = true;
        
        console.log(`🎮 Загружено игр: ${games.length}`);
    } catch (error) {
        throw new Error('Не удалось загрузить игры');
    }
}

/**
 * Загрузка данных фильмов
 */
async function loadMoviesData() {
    try {
        const response = await fetch('data/movies.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Ошибка загрузки фильмов');
        
        const movies = await response.json();
        renderMoviesGrid(movies);
        App.state.loadedData.movies = true;
        
        console.log(`🎬 Загружено фильмов: ${movies.length}`);
    } catch (error) {
        throw new Error('Не удалось загрузить фильмы');
    }
}

/**
 * Загрузка данных расписания
 */
async function loadScheduleData() {
    try {
        const response = await fetch('data/schedule.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Ошибка загрузки расписания');
        
        const scheduleData = await response.json();
        renderSchedule(scheduleData.schedule || []);
        App.state.loadedData.schedule = true;
        
        console.log(`📅 Загружено дней расписания: ${scheduleData.schedule?.length || 0}`);
    } catch (error) {
        throw new Error('Не удалось загрузить расписание');
    }
}

/**
 * Загрузка данных статистики
 */
async function loadStatsData() {
    try {
        const response = await fetch('data/stats.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Ошибка загрузки статистики');
        
        const stats = await response.json();
        updateStatsDisplay(stats);
        App.state.loadedData.stats = true;
        
        console.log('📊 Статистика загружена');
    } catch (error) {
        throw new Error('Не удалось загрузить статистику');
    }
}

/**
 * Загрузка резервных данных
 */
async function loadFallbackData() {
    console.log('🔄 Загрузка резервных данных...');
    
    // Резервные данные для демонстрации
    const fallbackGames = [
        {
            id: 'fallback-game',
            title: 'Демо игра',
            rating: 4.5,
            description: 'Это демонстрационная игра. Данные загружаются...',
            image: 'https://cdn2.steamgriddb.com/grid/24be7c4485d63a3d70e038692172adce.png',
            genres: ['adventure'],
            status: 'playing',
            customColor: '#39ff14'
        }
    ];
    
    const fallbackSchedule = [
        {
            day: 'Понедельник',
            time: '16:00 - 19:00+',
            game: 'Загрузка...',
            description: 'Расписание загружается',
            highlighted: false
        }
    ];
    
    const fallbackStats = {
        followers: 5200,
        streams: 150,
        hours: 250,
        years: 3
    };
    
    renderGamesGrid(fallbackGames);
    renderSchedule(fallbackSchedule);
    updateStatsDisplay(fallbackStats);
}

// ==================== РЕНДЕРИНГ ДАННЫХ ====================

/**
 * Отрисовка сетки игр
 */
function renderGamesGrid(games) {
    if (!App.elements.gamesGrid) return;
    
    if (!games || games.length === 0) {
        App.elements.gamesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gamepad"></i>
                <p>Игр пока нет</p>
            </div>
        `;
        return;
    }
    
    App.elements.gamesGrid.innerHTML = games.map(game => `
        <div class="game-card ${game.status}" data-game="${game.id}" style="--custom-hover-color: ${game.customColor || '#39ff14'}">
            <div class="game-image-container">
                <img src="${game.image}" alt="${game.title}" class="game-image" loading="lazy">
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <div class="game-genres">
                    ${(game.genres || []).map(genre => `
                        <span class="game-genre">${genre}</span>
                    `).join('')}
                </div>
                <div class="game-rating">
                    ${generateStars(game.rating)}
                    <span>${game.rating}/5</span>
                </div>
                <p class="game-description">${game.description}</p>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики событий для карточек игр
    attachGameCardListeners();
}

/**
 * Отрисовка сетки фильмов
 */
function renderMoviesGrid(movies) {
    if (!App.elements.moviesGrid) return;
    
    if (!movies || movies.length === 0) {
        App.elements.moviesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-film"></i>
                <p>Фильмов пока нет</p>
            </div>
        `;
        return;
    }
    
    App.elements.moviesGrid.innerHTML = movies.map(movie => `
        <div class="game-card ${movie.status === 'watched' ? 'watched' : 'watching'}" 
             data-movie="${movie.id}" 
             style="--custom-hover-color: ${movie.customColor || '#39ff14'}">
            <div class="game-image-container">
                <img src="${movie.image}" alt="${movie.title}" class="game-image" loading="lazy">
            </div>
            <div class="game-info">
                <h3 class="game-title">${movie.title}</h3>
                <div class="game-genres">
                    ${(movie.genres || []).map(genre => `
                        <span class="game-genre">${genre}</span>
                    `).join('')}
                </div>
                <div class="game-rating">
                    ${generateStars(movie.rating)}
                    <span>${movie.rating}/5</span>
                </div>
                <p class="game-description">${movie.description}</p>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики событий для карточек фильмов
    attachMovieCardListeners();
}

/**
 * Отрисовка расписания
 */
function renderSchedule(schedule) {
    if (!App.elements.scheduleList) return;
    
    if (!schedule || schedule.length === 0) {
        App.elements.scheduleList.innerHTML = `
            <div class="schedule-item">
                <div class="schedule-content">
                    <div class="schedule-game">📅 Расписание загружается...</div>
                    <div class="schedule-desc">Данные будут доступны скоро</div>
                </div>
            </div>
        `;
        return;
    }
    
    App.elements.scheduleList.innerHTML = schedule.map((item, index) => `
        <div class="schedule-item ${item.highlighted ? 'highlighted' : ''} ${isCurrentDay(index) ? 'current-day' : ''}">
            <div class="schedule-day-wrapper">
                <div class="schedule-day">${item.day}</div>
                <div class="schedule-time">${item.time}</div>
            </div>
            <div class="schedule-content">
                <div class="schedule-game">${item.game}</div>
                <div class="schedule-desc">${item.description || 'Нет описания'}</div>
            </div>
            <div class="schedule-status ${isCurrentDay(index) ? 'active' : ''}"></div>
        </div>
    `).join('');
}

/**
 * Обновление отображения статистики
 */
function updateStatsDisplay(stats) {
    if (!App.elements.statNumbers || App.elements.statNumbers.length === 0) return;
    
    const statElements = App.elements.statNumbers;
    if (statElements.length >= 4) {
        animateValue(statElements[0], 0, stats.followers || 5200, 2000);
        animateValue(statElements[1], 0, stats.streams || 150, 2000);
        animateValue(statElements[2], 0, stats.hours || 250, 2000);
        animateValue(statElements[3], 0, stats.years || 3, 2000);
    }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

/**
 * Настройка всех обработчиков событий
 */
function setupEventListeners() {
    setupMobileMenu();
    setupSmoothScroll();
    setupHeaderScroll();
    setupGamesSection();
    setupModalWindows();
    setupCopyFunctionality();
    setupOrbitalSystem();
    setupEasterEggs();
}

/**
 * Настройка мобильного меню
 */
function setupMobileMenu() {
    if (!App.elements.mobileMenu || !App.elements.navMenu) return;
    
    App.elements.mobileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        App.state.isMenuOpen = !App.state.isMenuOpen;
        
        this.classList.toggle('active');
        App.elements.navMenu.classList.toggle('active');
        
        // Блокировка прокрутки тела при открытом меню
        document.body.style.overflow = App.state.isMenuOpen ? 'hidden' : '';
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(e) {
        if (App.state.isMenuOpen && 
            !App.elements.navMenu.contains(e.target) && 
            !App.elements.mobileMenu.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Закрытие меню при клике на ссылку
    document.querySelectorAll('#nav-menu a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Закрытие меню при нажатии Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && App.state.isMenuOpen) {
            closeMobileMenu();
        }
    });
}

/**
 * Закрытие мобильного меню
 */
function closeMobileMenu() {
    App.state.isMenuOpen = false;
    App.elements.mobileMenu?.classList.remove('active');
    App.elements.navMenu?.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Настройка плавной прокрутки
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Настройка поведения хедера при скролле
 */
function setupHeaderScroll() {
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    const headerHeight = header?.offsetHeight || 0;
    
    if (!header) return;
    
    window.addEventListener('scroll', function() {
        if (App.state.isMenuOpen) return;
        
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

/**
 * Настройка секции игр и фильмов
 */
function setupGamesSection() {
    if (!App.elements.gamesTabs || !App.elements.toggleGamesBtn) return;
    
    // Переключение между играми и фильмами
    App.elements.gamesTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchGamesTab(this.dataset.tab);
        });
    });
    
    // Кнопка развернуть/свернуть
    App.elements.toggleGamesBtn.addEventListener('click', toggleGamesExpansion);
    
    // Фильтры и сортировка (будут реализованы в отдельном модуле)
    setupGamesFilters();
}

/**
 * Настройка модальных окон
 */
function setupModalWindows() {
    if (!App.elements.closeModalButtons) return;
    
    // Закрытие модальных окон
    App.elements.closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Закрытие при клике вне окна
    [App.elements.gameModal, App.elements.historyModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeAllModals();
                }
            });
        }
    });
    
    // Закрытие при нажатии Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Генерация звезд рейтинга
 */
function generateStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

/**
 * Анимация числовых значений
 */
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        element.textContent = Math.floor(progress * (end - start) + start);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

/**
 * Показать уведомление об ошибке
 */
function showErrorNotification(message) {
    // Простая реализация уведомления
    console.error('💥 Ошибка:', message);
    
    // В будущем можно добавить красивый toast
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6464;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Проверка является ли день текущим
 */
function isCurrentDay(index) {
    const today = new Date().getDay();
    // Преобразование воскресенья (0) в 6 для соответствия индексам
    const adjustedToday = today === 0 ? 6 : today - 1;
    return index === adjustedToday;
}

// ==================== ПЕРИОДИЧЕСКИЕ ЗАДАЧИ ====================

function startPeriodicTasks() {
    // Автообновление данных каждые 5 минут
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadInitialData().catch(console.error);
        }
    }, 300000);
    
    // Проверка видимости страницы для оптимизации
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('🔍 Страница стала видимой, проверяем обновления...');
        }
    });
}

// ==================== ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В ДРУГИХ ФАЙЛАХ ====================
// В реальном проекте будет использоваться ES6 modules

window.App = App;

console.log('📦 main.js загружен и готов к работе');
