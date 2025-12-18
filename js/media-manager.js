/* js/media-manager.js */

import { loadGames, loadMovies } from './data-manager.js';

const ArchiveState = {
    currentType: 'games', // 'games' или 'movies'
    data: [],
    filter: 'all',
    searchQuery: '',
    sort: 'name',         // 'name' или 'rating'
    sortDirection: 'asc'  // 'asc' или 'desc'
};

// Перевод жанров
const genreMap = {
    'puzzle': 'Головоломка', 'adventure': 'Приключения', 'simulator': 'Симулятор',
    'horror': 'Хоррор', 'coop': 'Кооператив', 'shooter': 'Шутер', 'platformer': 'Платформер',
    'rpg': 'RPG', 'animation': 'Анимация', 'fantasy': 'Фэнтези', 'action': 'Экшен',
    'strategy': 'Стратегия', 'survival': 'Выживание'
};

// Перевод статусов
const statusMap = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 
    'on-hold': 'ПОД ВОПРОСОМ'
};

/**
 * Инициализация модуля архива
 */
export async function initMediaArchive() {
    console.log('📼 Initializing Media Grid...');
    
    setupTabs();
    setupSearch();
    setupSort();
    
    // Загружаем игры по умолчанию
    await switchArchiveType('games');
}

/**
 * Переключение между Играми и Кино (С Анимацией)
 */
async function switchArchiveType(type) {
    const gridContainer = document.getElementById('archive-grid');
    
    // 1. Анимация исчезновения
    if (gridContainer) {
        gridContainer.classList.add('switching');
    }

    // Обновляем UI табов мгновенно
    updateTabUI(type);

    // 2. Ждем завершения анимации CSS (400ms)
    setTimeout(async () => {
        ArchiveState.currentType = type;
        ArchiveState.filter = 'all';
        ArchiveState.searchQuery = '';
        // Сортировку не сбрасываем, чтобы сохранить выбор пользователя
        
        // Сброс поиска
        const searchInput = document.getElementById('archive-search');
        if (searchInput) searchInput.value = '';
        
        // Загрузка данных
        const rawData = type === 'games' ? await loadGames() : await loadMovies();
        ArchiveState.data = Array.isArray(rawData) ? rawData : [];
        
        // Рендер нового контента
        renderFilters();
        renderGrid();
        
        // 3. Анимация появления
        if (gridContainer) {
            gridContainer.classList.remove('switching');
        }
    }, 400);
}

/**
 * Обновление UI переключателя (Капсула)
 */
function updateTabUI(type) {
    const switcher = document.querySelector('.type-switcher');
    const btns = document.querySelectorAll('.switcher-btn');
    
    // Двигаем фон (плашку)
    if(switcher) {
        if(type === 'movies') switcher.classList.add('movies-active');
        else switcher.classList.remove('movies-active');
    }

    // Активность текста кнопок
    btns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
}

/**
 * Слушатели для табов
 */
function setupTabs() {
    document.querySelectorAll('.switcher-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (ArchiveState.currentType !== btn.dataset.type) {
                switchArchiveType(btn.dataset.type);
            }
        });
    });
}

/**
 * Слушатель поиска
 */
function setupSearch() {
    const input = document.getElementById('archive-search');
    if(!input) return;

    input.addEventListener('input', (e) => {
        ArchiveState.searchQuery = e.target.value.toLowerCase();
        renderGrid();
    });
}

/**
 * Слушатели сортировки (Двунаправленная)
 */
function setupSort() {
    const sortBtns = document.querySelectorAll('.sort-side-btn');
    
    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortType = btn.dataset.sort;
            
            // Если кликнули на активную -> меняем направление
            if (ArchiveState.sort === sortType) {
                ArchiveState.sortDirection = ArchiveState.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // Если новая -> ставим дефолтное направление
                ArchiveState.sort = sortType;
                // Для рейтинга логичнее сначала высокий (desc), для имени А-Я (asc)
                ArchiveState.sortDirection = sortType === 'rating' ? 'desc' : 'asc';
            }
            
            updateSortUI();
            renderGrid();
        });
    });
    
    updateSortUI(); // Инит иконок
}

/**
 * Обновление иконок сортировки
 */
function updateSortUI() {
    document.querySelectorAll('.sort-side-btn').forEach(btn => {
        const isActive = btn.dataset.sort === ArchiveState.sort;
        btn.classList.toggle('active', isActive);
        
        const icon = btn.querySelector('.sort-icon');
        if (isActive && icon) {
            if (btn.dataset.sort === 'name') {
                icon.className = ArchiveState.sortDirection === 'asc' 
                    ? 'fas fa-sort-alpha-down sort-icon' 
                    : 'fas fa-sort-alpha-up sort-icon';
            } else {
                icon.className = ArchiveState.sortDirection === 'desc' 
                    ? 'fas fa-sort-amount-down sort-icon' 
                    : 'fas fa-sort-amount-up sort-icon';
            }
        }
    });
}

/**
 * Рендер фильтров (Статусы + Жанры в разные строки)
 */
function renderFilters() {
    const statusContainer = document.getElementById('archive-filters-status');
    const genreContainer = document.getElementById('archive-filters-genre');
    
    if (!statusContainer || !genreContainer) return;

    // Сбор жанров
    const allGenres = new Set();
    ArchiveState.data.forEach(item => {
        if (item.genres) item.genres.forEach(g => allGenres.add(g));
    });

    // 1. СТРОКА СТАТУСОВ
    let statusHtml = `<div class="filter-chip active" data-filter="all">ВСЕ</div>`;
    const statuses = ArchiveState.currentType === 'games' 
        ? ['completed', 'playing', 'on-hold', 'dropped'] 
        : ['watched', 'watching', 'on-hold', 'dropped'];
        
    statuses.forEach(s => {
        // Добавляем класс is-status и специфичный класс для цвета
        statusHtml += `<div class="filter-chip is-status status-${s}" data-filter="${s}">${statusMap[s] || s}</div>`;
    });
    statusContainer.innerHTML = statusHtml;

    // 2. СТРОКА ЖАНРОВ
    let genreHtml = '';
    const sortedGenres = Array.from(allGenres).sort((a, b) => {
        return (genreMap[a] || a).localeCompare(genreMap[b] || b);
    });

    sortedGenres.forEach(g => {
        genreHtml += `<div class="filter-chip" data-filter="${g}">${(genreMap[g] || g)}</div>`;
    });
    genreContainer.innerHTML = genreHtml;

    // События клика для всех чипсов
    const allChips = document.querySelectorAll('.filter-chip');
    allChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Снимаем активность со всех
            allChips.forEach(c => c.classList.remove('active'));
            // Ставим текущему
            chip.classList.add('active');
            
            ArchiveState.filter = chip.dataset.filter;
            renderGrid();
        });
    });
}

/**
 * Фильтрация и Сортировка
 */
function getFilteredAndSortedData() {
    // 1. Фильтрация
    let result = ArchiveState.data.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(ArchiveState.searchQuery);
        let matchesFilter = true;
        
        if (ArchiveState.filter !== 'all') {
            const isStatus = ['completed', 'playing', 'watched', 'watching', 'dropped', 'on-hold'].includes(ArchiveState.filter);
            
            if (isStatus) {
                matchesFilter = item.status === ArchiveState.filter;
            } else {
                matchesFilter = item.genres && item.genres.includes(ArchiveState.filter);
            }
        }
        
        return matchesSearch && matchesFilter;
    });

    // 2. Сортировка
    const dir = ArchiveState.sortDirection === 'asc' ? 1 : -1;
    
    result.sort((a, b) => {
        if (ArchiveState.sort === 'rating') {
            const rA = parseFloat(a.rating) || 0;
            const rB = parseFloat(b.rating) || 0;
            return (rA - rB) * dir;
        } else {
            return a.title.localeCompare(b.title) * dir;
        }
    });

    return result;
}

/**
 * Генерация звезд (HTML)
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '';
    for(let i=0; i < fullStars; i++) html += '<i class="fas fa-star"></i>';
    if(hasHalfStar) html += '<i class="fas fa-star-half-alt"></i>';
    for(let i=0; i < emptyStars; i++) html += '<i class="far fa-star" style="opacity: 0.3;"></i>';
    
    return html;
}

/**
 * Рендер сетки
 */
function renderGrid() {
    const container = document.getElementById('archive-grid');
    if (!container) return;

    const filtered = getFilteredAndSortedData();

    if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#666; font-family:\'Exo 2\';">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
        return;
    }

    container.innerHTML = filtered.map(item => {
        const genresHtml = item.genres 
            ? item.genres.slice(0, 3).map(g => `<span class="genre-tag">${genreMap[g] || g}</span>`).join('') 
            : '';
            
        const starsHtml = generateStars(item.rating);

        return `
            <div class="archive-card" data-status="${item.status}" data-id="${item.id}">
                <div class="card-thumb-container">
                    <img src="${item.image}" class="card-thumb" loading="lazy" onerror="this.src='https://via.placeholder.com/600x900?text=NO+IMAGE'">
                    
                    <div class="card-rating-badge">
                        <span class="stars-visual">${starsHtml}</span>
                        <span class="rating-number">${item.rating}</span>
                    </div>
                </div>
                <div class="card-info">
                    <div class="card-title" title="${item.title}">${item.title}</div>
                    <div class="card-genres">${genresHtml}</div>
                    <p class="card-desc">${item.description || 'Нет описания'}</p>
                </div>
            </div>
        `;
    }).join('');
}