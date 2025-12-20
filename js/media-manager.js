/* js/media-manager.js */

import { loadData } from './api.js';
import { openMediaModal } from './media-modal.js';

const ArchiveState = {
    currentType: 'games', // 'games' или 'movies'
    data: [],             // Полные данные из JSON
    filteredData: [],     // Данные после фильтрации
    
    // Множественный выбор фильтров
    activeFilters: new Set(['all']), 
    
    searchQuery: '',
    sort: 'name',
    sortDirection: 'asc',
    
    // --- ПАРАМЕТРЫ SCROLL & UI ---
    renderedCount: 0,
    batchSize: 12,        // Размер пачки подгрузки
    observer: null,       // Ссылка на IntersectionObserver
    isExpanded: false     // Флаг: развернут список или нет
};

const genreMap = {
    'puzzle': 'Головоломка', 'adventure': 'Приключения', 'simulator': 'Симулятор',
    'horror': 'Хоррор', 'coop': 'Кооператив', 'shooter': 'Шутер', 'platformer': 'Платформер',
    'rpg': 'RPG', 'animation': 'Анимация', 'fantasy': 'Фэнтези', 'action': 'Экшен',
    'strategy': 'Стратегия', 'survival': 'Выживание', 'scifi': 'Sci-Fi', 
    'mystery': 'Мистика', 'comedy': 'Комедия', 'family': 'Семейный'
};

const statusMap = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'ПОД ВОПРОСОМ'
};

// Список статусов для логики пересечения групп
const VALID_STATUSES = ['completed', 'playing', 'watched', 'watching', 'dropped', 'on-hold'];

/**
 * Инициализация модуля архива
 */
export async function initMediaArchive() {
    setupTabs();
    setupSearch(); 
    setupSort();
    setupGridClick(); // Подключаем клик для модального окна
    await switchArchiveType('games');
}

/**
 * Переключение типа контента
 */
async function switchArchiveType(type) {
    const gridContainer = document.getElementById('archive-grid');
    if (gridContainer) gridContainer.classList.add('switching');
    updateTabUI(type);

    setTimeout(async () => {
        ArchiveState.currentType = type;
        
        // Сброс состояния
        ArchiveState.activeFilters = new Set(['all']);
        ArchiveState.searchQuery = '';
        ArchiveState.renderedCount = 0;
        ArchiveState.isExpanded = false;
        
        // Очистка поиска
        const searchInput = document.getElementById('archive-search');
        if (searchInput) searchInput.value = '';
        
        // Закрытие подсказок
        const suggestionsBox = document.querySelector('.search-suggestions');
        const searchModule = document.querySelector('.search-module');
        if (suggestionsBox) {
            suggestionsBox.classList.remove('active');
            suggestionsBox.innerHTML = '';
        }
        if (searchModule) searchModule.classList.remove('suggestions-open');
        
        // ЗАГРУЗКА ДАННЫХ ЧЕРЕЗ API
        const rawData = type === 'games' 
            ? await loadData('games.json', []) 
            : await loadData('movies.json', []);

        ArchiveState.data = Array.isArray(rawData) ? rawData : [];
        
        renderFilters();
        processData();
        renderGrid();
        
        if (gridContainer) gridContainer.classList.remove('switching');
    }, 400);
}

function updateTabUI(type) {
    const switcher = document.querySelector('.type-switcher');
    const btns = document.querySelectorAll('.switcher-btn');
    if(switcher) {
        if(type === 'movies') switcher.classList.add('movies-active');
        else switcher.classList.remove('movies-active');
    }
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
}

/**
 * Рендер фильтров и мульти-выбор
 */
function renderFilters() {
    const statusContainer = document.getElementById('archive-filters-status');
    const genreContainer = document.getElementById('archive-filters-genre');
    if (!statusContainer || !genreContainer) return;

    const allGenres = new Set();
    ArchiveState.data.forEach(item => { if (item.genres) item.genres.forEach(g => allGenres.add(g)); });

    const statuses = ArchiveState.currentType === 'games' 
        ? ['completed', 'playing', 'on-hold', 'dropped'] 
        : ['watched', 'watching', 'on-hold', 'dropped'];
    
    const middleIndex = Math.floor(statuses.length / 2);
    let statusHtml = '';
    
    const isActive = (val) => ArchiveState.activeFilters.has(val) ? 'active' : '';

    statuses.slice(0, middleIndex).forEach(s => { 
        statusHtml += `<div class="filter-chip is-status status-${s} ${isActive(s)}" data-filter="${s}">${statusMap[s] || s}</div>`; 
    });
    
    statusHtml += `<div class="filter-chip is-status ${isActive('all')}" data-filter="all">ВСЕ</div>`;
    
    statuses.slice(middleIndex).forEach(s => { 
        statusHtml += `<div class="filter-chip is-status status-${s} ${isActive(s)}" data-filter="${s}">${statusMap[s] || s}</div>`; 
    });

    statusContainer.innerHTML = statusHtml;

    let genreHtml = '';
    Array.from(allGenres).sort((a, b) => (genreMap[a] || a).localeCompare(genreMap[b] || b))
        .forEach(g => { 
            genreHtml += `<div class="filter-chip ${isActive(g)}" data-filter="${g}">${(genreMap[g] || g)}</div>`; 
        });
    genreContainer.innerHTML = genreHtml;

    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const val = chip.dataset.filter;

            if (val === 'all') {
                ArchiveState.activeFilters.clear();
                ArchiveState.activeFilters.add('all');
            } else {
                if (ArchiveState.activeFilters.has('all')) ArchiveState.activeFilters.delete('all');
                
                if (ArchiveState.activeFilters.has(val)) ArchiveState.activeFilters.delete(val);
                else ArchiveState.activeFilters.add(val);
                
                if (ArchiveState.activeFilters.size === 0) ArchiveState.activeFilters.add('all');
            }
            
            ArchiveState.isExpanded = false; 
            
            renderFilters();
            processData();
            renderGrid();
        });
    });
}

/**
 * Логика фильтрации: (Статусы) И (Жанры)
 */
function processData() {
    const activeStatuses = new Set();
    const activeGenres = new Set();
    let isAllSelected = false;

    if (ArchiveState.activeFilters.has('all')) {
        isAllSelected = true;
    } else {
        ArchiveState.activeFilters.forEach(filter => {
            if (VALID_STATUSES.includes(filter)) activeStatuses.add(filter);
            else activeGenres.add(filter);
        });
    }

    let result = ArchiveState.data.filter(item => {
        // 1. Поиск по тексту
        const matchesSearch = item.title.toLowerCase().includes(ArchiveState.searchQuery);
        if (!matchesSearch) return false;
        
        if (isAllSelected) return true;

        // 2. Проверка статуса (ИЛИ)
        let statusMatch = true;
        if (activeStatuses.size > 0) {
            statusMatch = activeStatuses.has(item.status);
        }

        // 3. Проверка жанра (ИЛИ)
        let genreMatch = true;
        if (activeGenres.size > 0) {
            if (!item.genres || item.genres.length === 0) genreMatch = false;
            else genreMatch = item.genres.some(g => activeGenres.has(g));
        }

        return statusMatch && genreMatch;
    });

    // Сортировка
    const dir = ArchiveState.sortDirection === 'asc' ? 1 : -1;
    result.sort((a, b) => {
        if (ArchiveState.sort === 'rating') {
            return ((parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0)) * dir;
        } else {
            return a.title.localeCompare(b.title) * dir;
        }
    });

    ArchiveState.filteredData = result;
}

/**
 * Отрисовка сетки
 */
function renderGrid() {
    const container = document.getElementById('archive-grid');
    const wrapper = document.querySelector('.archive-full-grid-wrapper');
    
    if (ArchiveState.observer) ArchiveState.observer.disconnect();
    const oldSentinel = document.getElementById('scroll-sentinel');
    if (oldSentinel) oldSentinel.remove();
    const oldBtn = document.querySelector('.archive-footer-controls');
    if (oldBtn) oldBtn.remove();
    
    container.innerHTML = '';
    ArchiveState.renderedCount = 0;

    if (ArchiveState.filteredData.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#666;">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
        const overlay = wrapper.querySelector('.archive-fade-overlay');
        if (overlay) overlay.remove();
        wrapper.classList.remove('has-more');
        return;
    }

    renderNextBatch();

    // Логика кнопки
    if (ArchiveState.filteredData.length > ArchiveState.batchSize) {
        if (!ArchiveState.isExpanded) {
            renderButton('expand');
            let overlay = wrapper.querySelector('.archive-fade-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'archive-fade-overlay';
                wrapper.appendChild(overlay);
            }
            wrapper.classList.add('has-more');
        } else {
            const overlay = wrapper.querySelector('.archive-fade-overlay');
            if (overlay) overlay.remove();
            wrapper.classList.remove('has-more');

            const sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.style.width = '100%';
            sentinel.style.height = '50px';
            wrapper.appendChild(sentinel);
            
            setupInfiniteScroll();
            renderButton('collapse');
        }
    } else {
        const overlay = wrapper.querySelector('.archive-fade-overlay');
        if (overlay) overlay.remove();
        wrapper.classList.remove('has-more');
    }
}

/**
 * Кнопка и скролл-навигация
 */
function renderButton(mode) {
    const wrapper = document.querySelector('.archive-full-grid-wrapper');
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'archive-footer-controls';
    
    const btnText = mode === 'expand' ? `РАЗВЕРНУТЬ БАЗУ (${ArchiveState.filteredData.length})` : 'СВЕРНУТЬ';
    const btnIcon = mode === 'expand' ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
    const collapseClass = mode === 'collapse' ? 'collapse-mode' : '';

    controlsDiv.innerHTML = `
        <button class="cyber-load-btn ${collapseClass}" id="archive-toggle-btn">
            <span>${btnText} ${btnIcon}</span>
        </button>
    `;

    wrapper.after(controlsDiv);

    document.getElementById('archive-toggle-btn').addEventListener('click', () => {
        if (mode === 'expand') {
            // Развернуть -> Скролл вверх (начало списка)
            const sectionTop = document.getElementById('media-archive').offsetTop;
            window.scrollTo({ top: sectionTop - 50, behavior: 'smooth' });
            
            ArchiveState.isExpanded = true;
            renderGrid();
        } else {
            // Свернуть -> Скролл вниз (конец списка)
            ArchiveState.isExpanded = false;
            renderGrid();
            
            const section = document.getElementById('media-archive');
            section.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    });
}

function setupInfiniteScroll() {
    if (ArchiveState.observer) ArchiveState.observer.disconnect();

    const options = { root: null, rootMargin: '200px', threshold: 0.1 };

    ArchiveState.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && ArchiveState.renderedCount < ArchiveState.filteredData.length) {
                renderNextBatch();
            }
        });
    }, options);

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) ArchiveState.observer.observe(sentinel);
}

function renderNextBatch() {
    const container = document.getElementById('archive-grid');
    const start = ArchiveState.renderedCount;
    const limit = ArchiveState.isExpanded ? (start + ArchiveState.batchSize) : ArchiveState.batchSize;
    const end = Math.min(limit, ArchiveState.filteredData.length);
    
    if (start >= end) return;

    const itemsToRender = ArchiveState.filteredData.slice(start, end);

    const newCardsHtml = itemsToRender.map((item, index) => {
        const genresHtml = item.genres ? item.genres.slice(0, 3).map(g => `<span class="genre-tag">${genreMap[g] || g}</span>`).join('') : '';
        const fullStars = Math.floor(item.rating);
        let starsHtml = '';
        for(let i=0; i < 5; i++) starsHtml += i < fullStars ? '<i class="fas fa-star"></i>' : '<i class="far fa-star" style="opacity: 0.3;"></i>';

        const delay = (index % ArchiveState.batchSize) * 50; 

        // ОПРЕДЕЛЯЕМ, ЭТО КОЛЛЕКЦИЯ ИЛИ НЕТ
        const isCollection = item.images && item.images.length > 1;

        if (isCollection) {
            // КОЛЛЕКЦИЯ (Стопка карточек)
            // Картинка на ПЕРЕДНЕМ плане (Front) = Индекс 1 (1 сезон)
            const frontImg = item.images[1];
            // Картинка на ЗАДНЕМ плане (Back) = Индекс 0 (2 сезон / актуальный)
            const backImg = item.images[0];

            return `
            <div class="archive-card collection-wrapper animate-entry" data-status="${item.status}" data-id="${item.id}" style="animation-delay: ${delay}ms">
                
                <!-- ЗАДНЯЯ КАРТОЧКА -->
                <div class="collection-back" style="background-image: url('${backImg}')"></div>
                
                <!-- ПЕРЕДНЯЯ КАРТОЧКА -->
                <div class="collection-front">
                    <div class="card-thumb-container">
                        <img src="${frontImg}" class="card-thumb" loading="lazy" onerror="this.src='https://via.placeholder.com/600x900?text=NO+IMAGE'">
                        <div class="card-rating-badge"><span class="stars-visual">${starsHtml}</span><span class="rating-number">${item.rating}</span></div>
                    </div>
                    <div class="card-info">
                        <div class="card-title" title="${item.title}">${item.title}</div>
                        <div class="card-genres">${genresHtml}</div>
                        <p class="card-desc">${item.description || ''}</p>
                    </div>
                </div>
            </div>`;
        } else {
            // ОБЫЧНАЯ ОДИНОЧНАЯ КАРТОЧКА
            const imgSrc = item.image || (item.images ? item.images[0] : '');
            return `
            <div class="archive-card animate-entry" data-status="${item.status}" data-id="${item.id}" style="animation-delay: ${delay}ms">
                <div class="card-thumb-container">
                    <img src="${imgSrc}" class="card-thumb" loading="lazy" onerror="this.src='https://via.placeholder.com/600x900?text=NO+IMAGE'">
                    <div class="card-rating-badge"><span class="stars-visual">${starsHtml}</span><span class="rating-number">${item.rating}</span></div>
                </div>
                <div class="card-info">
                    <div class="card-title" title="${item.title}">${item.title}</div>
                    <div class="card-genres">${genresHtml}</div>
                    <p class="card-desc">${item.description || ''}</p>
                </div>
            </div>`;
        }
    }).join('');

    container.insertAdjacentHTML('beforeend', newCardsHtml);
    ArchiveState.renderedCount = end;
}

/**
 * Обработчик клика по карточке (для открытия модалки)
 */
function setupGridClick() {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        // Ищем ближайшего родителя - карточку
        // Это может быть .archive-card (обычная) или .archive-card.collection-wrapper (коллекция)
        const card = e.target.closest('.archive-card');
        if (card) {
            const id = card.dataset.id;
            const item = ArchiveState.data.find(i => i.id === id);
            
            if (item) {
                openMediaModal(item, ArchiveState.currentType);
            }
        }
    });
}

function setupTabs() {
    document.querySelectorAll('.switcher-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (ArchiveState.currentType !== btn.dataset.type) switchArchiveType(btn.dataset.type);
        });
    });
}

/**
 * УМНЫЙ ПОИСК (Сортировка по приоритету и подсказки)
 */
function setupSearch() {
    const input = document.getElementById('archive-search');
    const searchModule = document.querySelector('.search-module');
    
    if (!input || !searchModule) return;

    let suggestionsBox = document.querySelector('.search-suggestions');
    if (!suggestionsBox) {
        suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'search-suggestions';
        searchModule.appendChild(suggestionsBox);
    }

    const toggleSuggestions = (isOpen) => {
        if (isOpen) {
            suggestionsBox.classList.add('active');
            searchModule.classList.add('suggestions-open');
        } else {
            suggestionsBox.classList.remove('active');
            searchModule.classList.remove('suggestions-open');
        }
    };

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (query.length < 1) {
            toggleSuggestions(false);
            suggestionsBox.innerHTML = '';
            
            // Если очистили поле - сбрасываем сетку к дефолту
            if (ArchiveState.searchQuery !== '') {
                 ArchiveState.searchQuery = '';
                 processData();
                 renderGrid();
            }
            return;
        }

        // 1. Находим все совпадения
        let allMatches = ArchiveState.data.filter(item => 
            item.title.toLowerCase().includes(query)
        );

        // 2. СОРТИРУЕМ: Сначала те, что начинаются с запроса, потом остальные
        allMatches.sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            
            const startsA = titleA.startsWith(query);
            const startsB = titleB.startsWith(query);

            if (startsA && !startsB) return -1;
            if (!startsA && startsB) return 1;

            return titleA.localeCompare(titleB);
        });

        // 3. Берем топ-5
        const matches = allMatches.slice(0, 5);

        if (matches.length > 0) {
            suggestionsBox.innerHTML = matches.map(item => `
                <div class="suggestion-item" data-title="${item.title}">
                    <img src="${item.image || (item.images ? item.images[0] : '')}" class="sugg-thumb" onerror="this.src='https://via.placeholder.com/40x50'">
                    <div class="sugg-info">
                        <span class="sugg-title">${item.title}</span>
                        <div class="sugg-meta">
                            <span class="sugg-status">${statusMap[item.status] || item.status}</span>
                            <span class="sugg-rating"><i class="fas fa-star"></i> ${item.rating}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            suggestionsBox.innerHTML = `
                <div class="suggestion-empty">
                    <i class="far fa-sad-tear"></i>
                    <span>По запросу "${e.target.value}" ничего не найдено</span>
                </div>
            `;
        }
        
        toggleSuggestions(true);
    });

    suggestionsBox.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (item) {
            const title = item.dataset.title;
            input.value = title;
            ArchiveState.searchQuery = title.toLowerCase();
            
            toggleSuggestions(false);
            
            processData(); 
            renderGrid();  
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            toggleSuggestions(false);
            ArchiveState.searchQuery = input.value.toLowerCase();
            processData();
            renderGrid();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchModule.contains(e.target)) {
            toggleSuggestions(false);
        }
    });
}

function setupSort() {
    const sortBtns = document.querySelectorAll('.sort-side-btn');
    const updateIcons = (clickedBtn, shouldAnimate) => {
        sortBtns.forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            const isTarget = btn === clickedBtn;
            if (!isTarget) {
                btn.classList.remove('active');
                if (icon) icon.className = btn.dataset.sort === 'name' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-sort-amount-down sort-icon';
            } else {
                btn.classList.add('active');
                let newIconClass = '';
                if (btn.dataset.sort === 'name') newIconClass = ArchiveState.sortDirection === 'asc' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-sort-alpha-up sort-icon';
                else if (btn.dataset.sort === 'rating') newIconClass = ArchiveState.sortDirection === 'desc' ? 'fas fa-sort-amount-down sort-icon' : 'fas fa-sort-amount-up sort-icon';

                if (icon) {
                    if (shouldAnimate) {
                        icon.classList.add('flipping');
                        setTimeout(() => {
                            icon.className = newIconClass + ' flipping'; 
                            requestAnimationFrame(() => icon.classList.remove('flipping'));
                        }, 150);
                    } else icon.className = newIconClass;
                }
            }
        });
    };

    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortType = btn.dataset.sort;
            let shouldAnimate = false;
            if (ArchiveState.sort === sortType) {
                ArchiveState.sortDirection = ArchiveState.sortDirection === 'asc' ? 'desc' : 'asc';
                shouldAnimate = true;
            } else {
                ArchiveState.sort = sortType;
                ArchiveState.sortDirection = sortType === 'rating' ? 'desc' : 'asc';
                shouldAnimate = false;
            }
            updateIcons(btn, shouldAnimate);
            processData();
            renderGrid();
        });
        if (btn.dataset.sort === ArchiveState.sort) btn.classList.add('active');
    });
}