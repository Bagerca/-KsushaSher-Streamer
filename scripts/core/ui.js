// ==================== МОДУЛЬ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЬСКИМ ИНТЕРФЕЙСОМ ====================
// Отвечает за взаимодействие с UI: меню, табы, фильтры, сортировка

const UIManager = {
    // Состояние UI
    state: {
        activeTab: 'games',
        activeFilters: {
            games: { genres: ['all'], status: ['status-all'] },
            movies: { genres: ['all'], status: ['status-all'] }
        },
        activeSort: 'name',
        isGamesExpanded: false,
        isFilterDropdownOpen: false
    },

    // DOM элементы
    elements: {},

    // Конфигурация
    config: {
        animationDuration: 300,
        tabSwitchDelay: 150,
        filterDebounceDelay: 200
    }
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

/**
 * Инициализация UI менеджера
 */
UIManager.init = function() {
    this.initializeElements();
    this.setupEventListeners();
    this.setupTabSystem();
    this.setupFilterSystem();
    this.setupSortSystem();
    
    console.log('✅ UIManager инициализирован');
};

/**
 * Инициализация DOM элементов
 */
UIManager.initializeElements = function() {
    this.elements = {
        // Навигация
        mobileMenu: document.getElementById('mobile-menu'),
        navMenu: document.getElementById('nav-menu'),
        
        // Система вкладок
        gamesTabs: document.querySelectorAll('.games-tab'),
        sortTabs: document.querySelectorAll('.sort-tab'),
        tabSlider: document.querySelector('.tab-slider'),
        sortSlider: document.querySelector('.sort-slider'),
        
        // Контент вкладок
        gamesContent: document.getElementById('games-content'),
        moviesContent: document.getElementById('movies-content'),
        gamesGrid: document.querySelector('#games-content .games-grid'),
        moviesGrid: document.querySelector('#movies-content .games-grid'),
        
        // Система фильтров
        filterToggle: document.getElementById('filter-toggle'),
        filterDropdown: document.getElementById('filter-dropdown'),
        filterOptions: document.querySelectorAll('.filter-option input'),
        
        // Кнопка развертывания
        toggleGamesBtn: document.getElementById('toggle-games'),
        
        // Прочие элементы
        header: document.querySelector('header')
    };
};

// ==================== СИСТЕМА ВКЛАДОК ====================

/**
 * Настройка системы вкладок
 */
UIManager.setupTabSystem = function() {
    if (!this.elements.gamesTabs.length) return;
    
    // Устанавливаем начальное положение слайдеров
    this.updateTabSliderPosition();
    this.updateSortSliderPosition();
    
    // Активируем начальную вкладку
    this.activateTab('games');
};

/**
 * Переключение между вкладками игр и фильмов
 */
UIManager.switchTab = function(tabName) {
    if (this.state.activeTab === tabName) return;
    
    const oldTab = this.state.activeTab;
    this.state.activeTab = tabName;
    
    this.animateTabSwitch(oldTab, tabName);
    this.updateTabSliderPosition();
    this.updateFilterVisibility();
};

/**
 * Анимация переключения вкладок
 */
UIManager.animateTabSwitch = function(fromTab, toTab) {
    const fromContent = this.getContentElement(fromTab);
    const toContent = this.getContentElement(toTab);
    
    if (!fromContent || !toContent) return;
    
    // Добавляем классы для анимации
    fromContent.classList.add('fade-out');
    toContent.classList.add('fade-in');
    
    setTimeout(() => {
        fromContent.classList.remove('active', 'fade-out');
        toContent.classList.add('active');
        
        setTimeout(() => {
            toContent.classList.remove('fade-in');
        }, this.config.animationDuration);
    }, this.config.tabSwitchDelay);
};

/**
 * Обновление позиции слайдера вкладок
 */
UIManager.updateTabSliderPosition = function() {
    if (!this.elements.tabSlider) return;
    
    const activeTab = document.querySelector('.games-tab.active');
    if (!activeTab) return;
    
    this.elements.tabSlider.style.width = `${activeTab.offsetWidth}px`;
    this.elements.tabSlider.style.left = `${activeTab.offsetLeft}px`;
};

/**
 * Обновление позиции слайдера сортировки
 */
UIManager.updateSortSliderPosition = function() {
    if (!this.elements.sortSlider) return;
    
    const activeSort = document.querySelector('.sort-tab.active');
    if (!activeSort) return;
    
    this.elements.sortSlider.style.width = `${activeSort.offsetWidth}px`;
    this.elements.sortSlider.style.left = `${activeSort.offsetLeft}px`;
};

/**
 * Получение элемента контента для вкладки
 */
UIManager.getContentElement = function(tabName) {
    return tabName === 'games' ? this.elements.gamesContent : this.elements.moviesContent;
};

// ==================== СИСТЕМА ФИЛЬТРОВ ====================

/**
 * Настройка системы фильтров
 */
UIManager.setupFilterSystem = function() {
    if (!this.elements.filterToggle) return;
    
    this.setupFilterDropdown();
    this.setupFilterHandlers();
};

/**
 * Настройка выпадающего меню фильтров
 */
UIManager.setupFilterDropdown = function() {
    // Закрытие при клике вне меню
    document.addEventListener('click', (e) => {
        if (this.state.isFilterDropdownOpen && 
            !this.elements.filterDropdown.contains(e.target) && 
            !this.elements.filterToggle.contains(e.target)) {
            this.closeFilterDropdown();
        }
    });
    
    // Закрытие при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.state.isFilterDropdownOpen) {
            this.closeFilterDropdown();
        }
    });
};

/**
 * Настройка обработчиков фильтров
 */
UIManager.setupFilterHandlers = function() {
    if (!this.elements.filterOptions.length) return;
    
    this.elements.filterOptions.forEach(option => {
        option.addEventListener('change', this.handleFilterChange.bind(this));
    });
};

/**
 * Обработчик изменения фильтра
 */
UIManager.handleFilterChange = function(e) {
    const checkbox = e.target;
    const filterType = checkbox.getAttribute('data-filter');
    const dataType = checkbox.getAttribute('data-type');
    
    if (!filterType || !dataType) return;
    
    this.updateFilterState(dataType, filterType, checkbox.checked);
    this.applyFilters();
};

/**
 * Обновление состояния фильтров
 */
UIManager.updateFilterState = function(dataType, filterType, isChecked) {
    const isStatusFilter = filterType.startsWith('status-');
    const filterCategory = isStatusFilter ? 'status' : 'genres';
    
    if (filterType === 'all' || filterType === 'status-all') {
        // Обработка "Все"
        if (isChecked) {
            this.state.activeFilters[dataType][filterCategory] = [filterType];
            this.uncheckOtherFilters(dataType, filterCategory, filterType);
        }
    } else {
        // Обработка конкретных фильтров
        if (isChecked) {
            // Убираем "Все" если выбираем конкретный фильтр
            this.state.activeFilters[dataType][filterCategory] = 
                this.state.activeFilters[dataType][filterCategory].filter(f => 
                    f !== 'all' && f !== 'status-all'
                );
            this.state.activeFilters[dataType][filterCategory].push(filterType);
        } else {
            this.state.activeFilters[dataType][filterCategory] = 
                this.state.activeFilters[dataType][filterCategory].filter(f => f !== filterType);
            
            // Если не осталось фильтров, выбираем "Все"
            if (this.state.activeFilters[dataType][filterCategory].length === 0) {
                const defaultFilter = filterCategory === 'status' ? 'status-all' : 'all';
                this.state.activeFilters[dataType][filterCategory] = [defaultFilter];
                this.checkFilterCheckbox(dataType, defaultFilter);
            }
        }
    }
    
    this.updateFilterCheckboxes(dataType);
};

/**
 * Снятие других фильтров при выборе "Все"
 */
UIManager.uncheckOtherFilters = function(dataType, filterCategory, currentFilter) {
    this.elements.filterOptions.forEach(checkbox => {
        const checkboxDataType = checkbox.getAttribute('data-type');
        const checkboxFilter = checkbox.getAttribute('data-filter');
        
        if (checkboxDataType === dataType && 
            checkboxFilter !== currentFilter &&
            (filterCategory === 'genres' ? !checkboxFilter.startsWith('status-') : checkboxFilter.startsWith('status-'))) {
            checkbox.checked = false;
        }
    });
};

/**
 * Обновление состояния чекбоксов фильтров
 */
UIManager.updateFilterCheckboxes = function(dataType) {
    this.elements.filterOptions.forEach(checkbox => {
        const checkboxDataType = checkbox.getAttribute('data-type');
        const checkboxFilter = checkbox.getAttribute('data-filter');
        
        if (checkboxDataType === dataType) {
            const isStatusFilter = checkboxFilter.startsWith('status-');
            const filterCategory = isStatusFilter ? 'status' : 'genres';
            
            checkbox.checked = this.state.activeFilters[dataType][filterCategory].includes(checkboxFilter);
        }
    });
};

/**
 * Отметка конкретного чекбокса
 */
UIManager.checkFilterCheckbox = function(dataType, filterType) {
    const checkbox = document.querySelector(`input[data-type="${dataType}"][data-filter="${filterType}"]`);
    if (checkbox) {
        checkbox.checked = true;
    }
};

/**
 * Применение фильтров к данным
 */
UIManager.applyFilters = function() {
    // Дебаунс для избежания частых перерисовок
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
        this.dispatchFilterEvent();
    }, this.config.filterDebounceDelay);
};

/**
 * Отправка события фильтрации
 */
UIManager.dispatchFilterEvent = function() {
    const event = new CustomEvent('filtersChanged', {
        detail: {
            activeTab: this.state.activeTab,
            filters: this.state.activeFilters[this.state.activeTab],
            sort: this.state.activeSort
        }
    });
    
    document.dispatchEvent(event);
};

// ==================== СИСТЕМА СОРТИРОВКИ ====================

/**
 * Настройка системы сортировки
 */
UIManager.setupSortSystem = function() {
    if (!this.elements.sortTabs.length) return;
    
    this.elements.sortTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sortType = tab.getAttribute('data-sort');
            this.setSort(sortType);
        });
    });
};

/**
 * Установка типа сортировки
 */
UIManager.setSort = function(sortType) {
    if (this.state.activeSort === sortType) return;
    
    this.state.activeSort = sortType;
    
    // Обновляем UI
    this.elements.sortTabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-sort') === sortType);
    });
    
    this.updateSortSliderPosition();
    this.dispatchSortEvent();
};

/**
 * Отправка события сортировки
 */
UIManager.dispatchSortEvent = function() {
    const event = new CustomEvent('sortChanged', {
        detail: {
            activeTab: this.state.activeTab,
            sort: this.state.activeSort,
            filters: this.state.activeFilters[this.state.activeTab]
        }
    });
    
    document.dispatchEvent(event);
};

// ==================== УПРАВЛЕНИЕ ОТОБРАЖЕНИЕМ ====================

/**
 * Развертывание/свертывание списка игр/фильмов
 */
UIManager.toggleGamesExpansion = function() {
    this.state.isGamesExpanded = !this.state.isGamesExpanded;
    
    const activeGrid = this.getActiveGrid();
    if (!activeGrid) return;
    
    if (this.state.isGamesExpanded) {
        this.expandGrid(activeGrid);
    } else {
        this.collapseGrid(activeGrid);
    }
    
    this.updateToggleButton();
};

/**
 * Развертывание сетки
 */
UIManager.expandGrid = function(grid) {
    grid.classList.add('expanded');
    grid.style.maxHeight = 'none';
    grid.style.webkitMaskImage = 'none';
    grid.style.maskImage = 'none';
};

/**
 * Свертывание сетки
 */
UIManager.collapseGrid = function(grid) {
    grid.classList.remove('expanded');
    grid.style.maxHeight = '800px';
    grid.style.webkitMaskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
    grid.style.maskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
    
    // Прокрутка к секции игр
    this.scrollToGamesSection();
};

/**
 * Обновление текста кнопки
 */
UIManager.updateToggleButton = function() {
    if (!this.elements.toggleGamesBtn) return;
    
    this.elements.toggleGamesBtn.textContent = this.state.isGamesExpanded ? 'Свернуть' : 'Развернуть';
};

/**
 * Прокрутка к секции игр
 */
UIManager.scrollToGamesSection = function() {
    if (!this.elements.gamesSection) return;
    
    const headerHeight = this.elements.header?.offsetHeight || 80;
    const targetPosition = this.elements.gamesSection.offsetTop - headerHeight - 20;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
};

/**
 * Получение активной сетки
 */
UIManager.getActiveGrid = function() {
    return this.state.activeTab === 'games' ? this.elements.gamesGrid : this.elements.moviesGrid;
};

// ==================== УПРАВЛЕНИЕ ВИДИМОСТЬЮ ФИЛЬТРОВ ====================

/**
 * Обновление видимости фильтров в зависимости от вкладки
 */
UIManager.updateFilterVisibility = function() {
    const gamesFilters = document.querySelector('.games-filters');
    const moviesFilters = document.querySelector('.movies-filters');
    
    if (gamesFilters && moviesFilters) {
        if (this.state.activeTab === 'games') {
            gamesFilters.style.display = 'block';
            moviesFilters.style.display = 'none';
        } else {
            gamesFilters.style.display = 'none';
            moviesFilters.style.display = 'block';
        }
    }
};

// ==================== УПРАВЛЕНИЕ ВЫПАДАЮЩИМ МЕНЮ ФИЛЬТРОВ ====================

/**
 * Открытие выпадающего меню фильтров
 */
UIManager.openFilterDropdown = function() {
    if (!this.elements.filterDropdown) return;
    
    this.elements.filterDropdown.classList.add('active');
    this.state.isFilterDropdownOpen = true;
};

/**
 * Закрытие выпадающего меню фильтров
 */
UIManager.closeFilterDropdown = function() {
    if (!this.elements.filterDropdown) return;
    
    this.elements.filterDropdown.classList.remove('active');
    this.state.isFilterDropdownOpen = false;
};

/**
 * Переключение выпадающего меню фильтров
 */
UIManager.toggleFilterDropdown = function() {
    if (this.state.isFilterDropdownOpen) {
        this.closeFilterDropdown();
    } else {
        this.openFilterDropdown();
    }
};

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

/**
 * Настройка всех обработчиков событий
 */
UIManager.setupEventListeners = function() {
    // Обработчики вкладок
    this.elements.gamesTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            this.switchTab(tabName);
        });
    });
    
    // Обработчики фильтров
    if (this.elements.filterToggle) {
        this.elements.filterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFilterDropdown();
        });
    }
    
    // Обработчик кнопки развертывания
    if (this.elements.toggleGamesBtn) {
        this.elements.toggleGamesBtn.addEventListener('click', () => {
            this.toggleGamesExpansion();
        });
    }
    
    // Глобальные обработчики
    this.setupGlobalListeners();
};

/**
 * Настройка глобальных обработчиков
 */
UIManager.setupGlobalListeners = function() {
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        this.handleWindowResize();
    });
    
    // Обработчик скролла для хедера
    this.setupHeaderScroll();
};

/**
 * Обработчик изменения размера окна
 */
UIManager.handleWindowResize = function() {
    // Обновляем позиции слайдеров
    this.updateTabSliderPosition();
    this.updateSortSliderPosition();
    
    // Закрываем выпадающее меню на мобильных
    if (window.innerWidth < 768 && this.state.isFilterDropdownOpen) {
        this.closeFilterDropdown();
    }
};

/**
 * Настройка поведения хедера при скролле
 */
UIManager.setupHeaderScroll = function() {
    let lastScrollTop = 0;
    const header = this.elements.header;
    
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const headerHeight = header.offsetHeight;
        
        if (scrollTop > lastScrollTop && scrollTop > headerHeight) {
            document.body.classList.add('scrolled-down');
            document.body.classList.remove('scrolled-up');
        } else {
            document.body.classList.remove('scrolled-down');
            document.body.classList.add('scrolled-up');
        }
        
        lastScrollTop = scrollTop;
    });
};

// ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

/**
 * Активация конкретной вкладки
 */
UIManager.activateTab = function(tabName) {
    this.elements.gamesTabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    this.switchTab(tabName);
};

/**
 * Получение текущего состояния UI
 */
UIManager.getState = function() {
    return {
        ...this.state,
        activeGrid: this.getActiveGrid()
    };
};

/**
 * Сброс фильтров для текущей вкладки
 */
UIManager.resetFilters = function() {
    const dataType = this.state.activeTab;
    this.state.activeFilters[dataType] = {
        genres: ['all'],
        status: ['status-all']
    };
    
    this.updateFilterCheckboxes(dataType);
    this.applyFilters();
};

// ==================== ЭКСПОРТ ====================

// Для использования в качестве модуля
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    // Для использования в браузере
    window.UIManager = UIManager;
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UIManager.init());
} else {
    UIManager.init();
}

console.log('🎨 UIManager загружен');
