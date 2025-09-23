// ==================== МОДУЛЬ УПРАВЛЕНИЯ ИГРАМИ И ФИЛЬМАМИ ====================
// Отвечает за фильтрацию, сортировку и отображение игр/фильмов

const GamesManager = {
    // Состояние
    state: {
        games: [],
        movies: [],
        filteredGames: [],
        filteredMovies: [],
        currentView: 'games', // 'games' или 'movies'
        filters: {
            games: {
                genres: ['all'],
                status: ['status-all']
            },
            movies: {
                genres: ['all'],
                status: ['status-all']
            }
        },
        sortBy: 'name', // 'name' или 'rating'
        isExpanded: false,
        isLoading: false
    },

    // Конфигурация
    config: {
        itemsPerPage: 20,
        animationDuration: 300,
        searchDebounce: 200,
        shuffleAnimation: true
    },

    // DOM элементы
    elements: {},

    // Кэш
    cache: {
        genreCounts: { games: {}, movies: {} },
        statusCounts: { games: {}, movies: {} }
    }
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

/**
 * Инициализация менеджера игр и фильмов
 */
GamesManager.init = function() {
    this.initializeElements();
    this.setupEventListeners();
    this.loadInitialData();
    
    console.log('✅ GamesManager инициализирован');
};

/**
 * Инициализация DOM элементов
 */
GamesManager.initializeElements = function() {
    this.elements = {
        // Контейнеры
        gamesGrid: document.querySelector('#games-content .games-grid'),
        moviesGrid: document.querySelector('#movies-content .games-grid'),
        gamesContent: document.getElementById('games-content'),
        moviesContent: document.getElementById('movies-content'),
        
        // Элементы управления
        toggleButton: document.getElementById('toggle-games'),
        searchInput: document.querySelector('.search-input'),
        
        // Статистика
        counters: {
            games: document.querySelector('.games-counter'),
            movies: document.querySelector('.movies-counter'),
            showing: document.querySelector('.showing-counter')
        }
    };
};

// ==================== ЗАГРУЗКА ДАННЫХ ====================

/**
 * Загрузка начальных данных
 */
GamesManager.loadInitialData = async function() {
    this.state.isLoading = true;
    this.showLoadingState();
    
    try {
        // Загрузка через DataLoader если доступен
        if (window.DataLoader) {
            await this.loadDataWithLoader();
        } else {
            await this.loadDataDirectly();
        }
        
        this.state.isLoading = false;
        this.processLoadedData();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        this.state.isLoading = false;
        this.showErrorState();
    }
};

/**
 * Загрузка данных через DataLoader
 */
GamesManager.loadDataWithLoader = async function() {
    const [games, movies] = await Promise.all([
        DataLoader.loadGames(),
        DataLoader.loadMovies()
    ]);
    
    this.state.games = games || [];
    this.state.movies = movies || [];
};

/**
 * Прямая загрузка данных
 */
GamesManager.loadDataDirectly = async function() {
    const [gamesResponse, moviesResponse] = await Promise.all([
        fetch('data/games.json?' + new Date().getTime()),
        fetch('data/movies.json?' + new Date().getTime())
    ]);
    
    if (!gamesResponse.ok || !moviesResponse.ok) {
        throw new Error('Ошибка загрузки файлов');
    }
    
    this.state.games = await gamesResponse.json();
    this.state.movies = await moviesResponse.json();
};

/**
 * Обработка загруженных данных
 */
GamesManager.processLoadedData = function() {
    // Предварительная обработка данных
    this.preprocessData();
    
    // Применение фильтров и сортировки
    this.applyFiltersAndSort();
    
    // Обновление интерфейса
    this.updateUI();
    
    // Обновление статистики
    this.updateCounters();
    this.updateCache();
    
    console.log(`🎮 Обработано: ${this.state.games.length} игр, ${this.state.movies.length} фильмов`);
};

// ==================== ПРЕДВАРИТЕЛЬНАЯ ОБРАБОТКА ДАННЫХ ====================

/**
 * Предварительная обработка данных
 */
GamesManager.preprocessData = function() {
    // Обеспечиваем наличие обязательных полей
    this.state.games = this.state.games.map(game => this.normalizeItem(game, 'game'));
    this.state.movies = this.state.movies.map(movie => this.normalizeItem(movie, 'movie'));
    
    // Сортируем по умолчанию
    this.sortItems(this.state.games, 'name');
    this.sortItems(this.state.movies, 'name');
};

/**
 * Нормализация элемента
 */
GamesManager.normalizeItem = function(item, type) {
    return {
        id: item.id || this.generateId(item.title),
        title: item.title || 'Без названия',
        rating: Math.max(0, Math.min(5, parseFloat(item.rating) || 0)),
        description: item.description || 'Описание отсутствует',
        image: item.image || this.getDefaultImage(type),
        genres: Array.isArray(item.genres) ? item.genres : [],
        status: item.status || (type === 'game' ? 'playing' : 'watching'),
        videoId: item.videoId || 'dQw4w9WgXcQ',
        customColor: item.customColor || this.getColorByStatus(item.status),
        type: type,
        // Дополнительные поля для поиска
        searchText: this.generateSearchText(item),
        dateAdded: item.dateAdded || new Date().toISOString()
    };
};

/**
 * Генерация ID
 */
GamesManager.generateId = function(title) {
    return title.toLowerCase()
        .replace(/[^\wа-яё]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
};

/**
 * Генерация текста для поиска
 */
GamesManager.generateSearchText = function(item) {
    return [
        item.title,
        item.description,
        ...(item.genres || [])
    ].join(' ').toLowerCase();
};

/**
 * Получение цвета по статусу
 */
GamesManager.getColorByStatus = function(status) {
    const colors = {
        'completed': '#39ff14',
        'playing': '#ff2d95', 
        'dropped': '#ff6464',
        'on-hold': '#ffd700',
        'watched': '#39ff14',
        'watching': '#ff2d95'
    };
    
    return colors[status] || '#39ff14';
};

/**
 * Получение изображения по умолчанию
 */
GamesManager.getDefaultImage = function(type) {
    const defaultImages = {
        game: 'https://cdn2.steamgriddb.com/grid/24be7c4485d63a3d70e038692172adce.png',
        movie: 'https://images.kinorium.com/movie/poster/2754301/w1500_50222111.jpg'
    };
    
    return defaultImages[type] || defaultImages.game;
};

// ==================== ФИЛЬТРАЦИЯ И СОРТИРОВКА ====================

/**
 * Применение фильтров и сортировки
 */
GamesManager.applyFiltersAndSort = function() {
    const currentData = this.state.currentView === 'games' ? this.state.games : this.state.movies;
    const currentFilters = this.state.filters[this.state.currentView];
    
    // Фильтрация
    let filteredData = this.filterItems(currentData, currentFilters);
    
    // Сортировка
    filteredData = this.sortItems(filteredData, this.state.sortBy);
    
    // Сохранение отфильтрованных данных
    if (this.state.currentView === 'games') {
        this.state.filteredGames = filteredData;
    } else {
        this.state.filteredMovies = filteredData;
    }
};

/**
 * Фильтрация элементов
 */
GamesManager.filterItems = function(items, filters) {
    return items.filter(item => {
        // Фильтрация по статусу
        if (!filters.status.includes('status-all') && !filters.status.includes(item.status)) {
            return false;
        }
        
        // Фильтрация по жанрам
        if (!filters.genres.includes('all')) {
            const hasMatchingGenre = item.genres.some(genre => 
                filters.genres.includes(genre)
            );
            if (!hasMatchingGenre) return false;
        }
        
        return true;
    });
};

/**
 * Сортировка элементов
 */
GamesManager.sortItems = function(items, sortBy) {
    return [...items].sort((a, b) => {
        switch (sortBy) {
            case 'rating':
                return b.rating - a.rating;
                
            case 'name':
            default:
                return a.title.localeCompare(b.title, 'ru');
        }
    });
};

/**
 * Поиск элементов
 */
GamesManager.searchItems = function(query) {
    if (!query.trim()) {
        return this.applyFiltersAndSort();
    }
    
    const searchTerm = query.toLowerCase();
    const currentData = this.state.currentView === 'games' ? this.state.games : this.state.movies;
    
    const filteredData = currentData.filter(item => 
        item.searchText.includes(searchTerm)
    );
    
    if (this.state.currentView === 'games') {
        this.state.filteredGames = this.sortItems(filteredData, this.state.sortBy);
    } else {
        this.state.filteredMovies = this.sortItems(filteredData, this.state.sortBy);
    }
    
    this.renderCurrentView();
    this.updateCounters();
};

// ==================== ОТОБРАЖЕНИЕ ДАННЫХ ====================

/**
 * Отрисовка текущего представления
 */
GamesManager.renderCurrentView = function() {
    const data = this.state.currentView === 'games' ? this.state.filteredGames : this.state.filteredMovies;
    const grid = this.state.currentView === 'games' ? this.elements.gamesGrid : this.elements.moviesGrid;
    
    if (!grid) return;
    
    if (data.length === 0) {
        this.showEmptyState();
        return;
    }
    
    const itemsToShow = this.state.isExpanded ? data : data.slice(0, this.config.itemsPerPage);
    
    grid.innerHTML = itemsToShow.map(item => 
        this.createItemCard(item)
    ).join('');
    
    this.attachItemEventHandlers();
};

/**
 * Создание карточки элемента
 */
GamesManager.createItemCard = function(item) {
    const statusClass = item.type === 'game' ? item.status : 
                       (item.status === 'watched' ? 'watched' : 'watching');
    
    return `
        <div class="game-card ${statusClass}" 
             data-${item.type}="${item.id}"
             style="--custom-hover-color: ${item.customColor}">
            
            <div class="game-image-container">
                <img src="${item.image}" 
                     alt="${item.title}" 
                     class="game-image" 
                     loading="lazy"
                     onerror="this.src='${this.getDefaultImage(item.type)}'">
                <div class="item-overlay">
                    <div class="item-rating-badge">
                        <i class="fas fa-star"></i>
                        <span>${item.rating}</span>
                    </div>
                    <div class="item-status-badge ${item.status}">
                        ${this.getStatusText(item.status, item.type)}
                    </div>
                </div>
            </div>
            
            <div class="game-info">
                <h3 class="game-title">${item.title}</h3>
                
                <div class="game-genres">
                    ${item.genres.map(genre => `
                        <span class="game-genre">${genre}</span>
                    `).join('')}
                </div>
                
                <div class="game-rating">
                    ${this.generateStars(item.rating)}
                    <span>${item.rating}/5</span>
                </div>
                
                <p class="game-description">${item.description}</p>
                
                <div class="item-meta">
                    <span class="item-type">${item.type === 'game' ? '🎮 Игра' : '🎬 Фильм'}</span>
                    <span class="item-date">${this.formatDate(item.dateAdded)}</span>
                </div>
            </div>
        </div>
    `;
};

/**
 * Генерация звезд рейтинга
 */
GamesManager.generateStars = function(rating) {
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
};

/**
 * Получение текста статуса
 */
GamesManager.getStatusText = function(status, type) {
    const texts = {
        'completed': 'Пройдено',
        'playing': 'Проходим',
        'dropped': 'Брошено', 
        'on-hold': 'На паузе',
        'watched': 'Просмотрено',
        'watching': 'Смотрим'
    };
    
    return texts[status] || status;
};

/**
 * Форматирование даты
 */
GamesManager.formatDate = function(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

/**
 * Настройка обработчиков событий
 */
GamesManager.setupEventListeners = function() {
    this.setupGlobalListeners();
    this.setupItemListeners();
    this.setupControlListeners();
};

/**
 * Настройка глобальных обработчиков
 */
GamesManager.setupGlobalListeners = function() {
    // События от UI Manager
    document.addEventListener('filtersChanged', (e) => {
        this.handleFiltersChange(e.detail);
    });
    
    document.addEventListener('sortChanged', (e) => {
        this.handleSortChange(e.detail);
    });
    
    // Поиск (если будет реализован)
    if (this.elements.searchInput) {
        this.setupSearchHandler();
    }
};

/**
 * Обработчик изменения фильтров
 */
GamesManager.handleFiltersChange = function(detail) {
    this.state.currentView = detail.activeTab;
    this.state.filters[detail.activeTab] = detail.filters;
    this.state.sortBy = detail.sort;
    
    this.applyFiltersAndSort();
    this.renderCurrentView();
    this.updateCounters();
};

/**
 * Обработчик изменения сортировки
 */
GamesManager.handleSortChange = function(detail) {
    this.state.sortBy = detail.sort;
    this.applyFiltersAndSort();
    this.renderCurrentView();
};

/**
 * Настройка обработчиков для элементов
 */
GamesManager.setupItemListeners = function() {
    // Обработчики будут добавлены после рендера
};

/**
 * Добавление обработчиков для карточек
 */
GamesManager.attachItemEventHandlers = function() {
    const items = document.querySelectorAll('.game-card');
    
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            this.handleItemClick(item, e);
        });
        
        item.addEventListener('mouseenter', () => {
            this.handleItemHover(item, true);
        });
        
        item.addEventListener('mouseleave', () => {
            this.handleItemHover(item, false);
        });
    });
};

/**
 * Обработчик клика по карточке
 */
GamesManager.handleItemClick = function(item, event) {
    // Предотвращаем открытие если кликнули на ссылку или кнопку
    if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
        return;
    }
    
    const itemId = item.dataset.game || item.dataset.movie;
    const itemType = item.dataset.game ? 'game' : 'movie';
    const itemData = this.findItemById(itemId, itemType);
    
    if (!itemData) return;
    
    // Анимация клика
    item.classList.add('click-feedback');
    setTimeout(() => {
        item.classList.remove('click-feedback');
    }, 300);
    
    // Открытие модального окна
    this.openItemModal(itemData);
};

/**
 * Обработчик наведения на карточку
 */
GamesManager.handleItemHover = function(item, isHovering) {
    if (isHovering) {
        item.classList.add('card-hover');
    } else {
        item.classList.remove('card-hover');
    }
};

/**
 * Настройка обработчиков управления
 */
GamesManager.setupControlListeners = function() {
    // Кнопка развертывания
    if (this.elements.toggleButton) {
        this.elements.toggleButton.addEventListener('click', () => {
            this.toggleExpansion();
        });
    }
};

/**
 * Настройка обработчика поиска
 */
GamesManager.setupSearchHandler = function() {
    let searchTimeout;
    
    this.elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            this.searchItems(e.target.value);
        }, this.config.searchDebounce);
    });
};

// ==================== УПРАВЛЕНИЕ ОТОБРАЖЕНИЕМ ====================

/**
 * Переключение развертывания/свертывания
 */
GamesManager.toggleExpansion = function() {
    this.state.isExpanded = !this.state.isExpanded;
    
    this.renderCurrentView();
    this.updateToggleButton();
    
    if (!this.state.isExpanded) {
        this.scrollToSection();
    }
};

/**
 * Обновление текста кнопки
 */
GamesManager.updateToggleButton = function() {
    if (!this.elements.toggleButton) return;
    
    this.elements.toggleButton.textContent = this.state.isExpanded ? 
        'Свернуть' : `Показать все (${this.getTotalItemsCount()})`;
};

/**
 * Прокрутка к секции
 */
GamesManager.scrollToSection = function() {
    const section = document.getElementById('games');
    if (!section) return;
    
    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
    const targetPosition = section.offsetTop - headerHeight - 20;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
};

// ==================== РАБОТА С МОДАЛЬНЫМИ ОКНАМИ ====================

/**
 * Открытие модального окна элемента
 */
GamesManager.openItemModal = function(itemData) {
    if (window.ModalManager) {
        ModalManager.openGameModal(itemData);
    } else {
        // Резервное открытие модального окна
        this.openModalFallback(itemData);
    }
};

/**
 * Резервное открытие модального окна
 */
GamesManager.openModalFallback = function(itemData) {
    console.log('📂 Открытие деталей:', itemData.title);
    // Можно реализовать простую версию модального окна
};

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================

/**
 * Обновление всего интерфейса
 */
GamesManager.updateUI = function() {
    this.renderCurrentView();
    this.updateCounters();
    this.updateToggleButton();
};

/**
 * Обновление счетчиков
 */
GamesManager.updateCounters = function() {
    if (!this.elements.counters) return;
    
    const currentData = this.state.currentView === 'games' ? this.state.filteredGames : this.state.filteredMovies;
    const totalData = this.state.currentView === 'games' ? this.state.games : this.state.movies;
    
    const showing = this.state.isExpanded ? currentData.length : 
                   Math.min(currentData.length, this.config.itemsPerPage);
    
    if (this.elements.counters.showing) {
        this.elements.counters.showing.textContent = 
            `Показано: ${showing} из ${currentData.length}`;
    }
    
    if (this.elements.counters.games) {
        this.elements.counters.games.textContent = `Игры: ${this.state.games.length}`;
    }
    
    if (this.elements.counters.movies) {
        this.elements.counters.movies.textContent = `Фильмы: ${this.state.movies.length}`;
    }
};

/**
 * Обновление кэша статистики
 */
GamesManager.updateCache = function() {
    this.cache.genreCounts.games = this.countGenres(this.state.games);
    this.cache.genreCounts.movies = this.countGenres(this.state.movies);
    this.cache.statusCounts.games = this.countStatuses(this.state.games);
    this.cache.statusCounts.movies = this.countStatuses(this.state.movies);
};

/**
 * Подсчет жанров
 */
GamesManager.countGenres = function(items) {
    const counts = {};
    
    items.forEach(item => {
        item.genres.forEach(genre => {
            counts[genre] = (counts[genre] || 0) + 1;
        });
    });
    
    return counts;
};

/**
 * Подсчет статусов
 */
GamesManager.countStatuses = function(items) {
    const counts = {};
    
    items.forEach(item => {
        counts[item.status] = (counts[item.status] || 0) + 1;
    });
    
    return counts;
};

// ==================== СОСТОЯНИЯ ИНТЕРФЕЙСА ====================

/**
 * Показ состояния загрузки
 */
GamesManager.showLoadingState = function() {
    const grid = this.state.currentView === 'games' ? this.elements.gamesGrid : this.elements.moviesGrid;
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Загрузка ${this.state.currentView === 'games' ? 'игр' : 'фильмов'}...</p>
        </div>
    `;
};

/**
 * Показ состояния ошибки
 */
GamesManager.showErrorState = function() {
    const grid = this.state.currentView === 'games' ? this.elements.gamesGrid : this.elements.moviesGrid;
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки данных</p>
            <button class="retry-button">Повторить попытку</button>
        </div>
    `;
    
    const retryButton = grid.querySelector('.retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', () => this.loadInitialData());
    }
};

/**
 * Показ пустого состояния
 */
GamesManager.showEmptyState = function() {
    const grid = this.state.currentView === 'games' ? this.elements.gamesGrid : this.elements.moviesGrid;
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-${this.state.currentView === 'games' ? 'gamepad' : 'film'}"></i>
            <p>${this.state.currentView === 'games' ? 'Игры' : 'Фильмы'} не найдены</p>
            <small>Попробуйте изменить фильтры</small>
        </div>
    `;
};

// ==================== УТИЛИТЫ ====================

/**
 * Поиск элемента по ID
 */
GamesManager.findItemById = function(id, type) {
    const items = type === 'game' ? this.state.games : this.state.movies;
    return items.find(item => item.id === id);
};

/**
 * Получение общего количества элементов
 */
GamesManager.getTotalItemsCount = function() {
    return this.state.currentView === 'games' ? 
        this.state.filteredGames.length : 
        this.state.filteredMovies.length;
};

/**
 * Получение статистики
 */
GamesManager.getStats = function() {
    return {
        totalGames: this.state.games.length,
        totalMovies: this.state.movies.length,
        genreCounts: this.cache.genreCounts,
        statusCounts: this.cache.statusCounts,
        currentView: this.state.currentView,
        activeFilters: this.state.filters[this.state.currentView]
    };
};

// ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

/**
 * Переключение представления
 */
GamesManager.switchView = function(view) {
    if (this.state.currentView === view) return;
    
    this.state.currentView = view;
    this.applyFiltersAndSort();
    this.renderCurrentView();
    this.updateCounters();
};

/**
 * Сброс фильтров
 */
GamesManager.resetFilters = function() {
    this.state.filters[this.state.currentView] = {
        genres: ['all'],
        status: ['status-all']
    };
    
    this.applyFiltersAndSort();
    this.renderCurrentView();
    this.updateCounters();
};

/**
 * Обновление данных
 */
GamesManager.refresh = function() {
    this.loadInitialData();
};

// ==================== ЭКСПОРТ ====================

// Для использования в качестве модуля
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamesManager;
} else {
    // Для использования в браузере
    window.GamesManager = GamesManager;
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GamesManager.init());
} else {
    GamesManager.init();
}

console.log('🎮 GamesManager загружен');
