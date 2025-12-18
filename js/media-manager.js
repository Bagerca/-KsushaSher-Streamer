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
 * Рендер фильтров (Статусы с "ВСЕ" посередине + Жанры)
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

    // 1. СТРОКА СТАТУСОВ (Разделение массива для вставки "ВСЕ" в центр)
    const statuses = ArchiveState.currentType === 'games' 
        ? ['completed', 'playing', 'on-hold', 'dropped'] 
        : ['watched', 'watching', 'on-hold', 'dropped'];
    
    // Вычисляем середину
    const middleIndex = Math.floor(statuses.length / 2);
    const leftPart = statuses.slice(0, middleIndex);
    const rightPart = statuses.slice(middleIndex);

    let statusHtml = '';
    
    // Левая часть
    leftPart.forEach(s => {
        statusHtml += `<div class="filter-chip is-status status-${s}" data-filter="${s}">${statusMap[s] || s}</div>`;
    });

    // Центральная кнопка "ВСЕ"
    // Проверяем, активна ли она сейчас
    const allActiveClass = ArchiveState.filter === 'all' ? 'active' : '';
    statusHtml += `<div class="filter-chip is-status ${allActiveClass}" data-filter="all">ВСЕ</div>`;

    // Правая часть
    rightPart.forEach(s => {
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

    // Генерируем HTML
    container.innerHTML = filtered.map(item => {
        const genresHtml = item.genres 
            ? item.genres.slice(0, 3).map(g => `<span class="genre-tag">${genreMap[g] || g}</span>`).join('') 
            : '';
            
        const fullStars = Math.floor(item.rating);
        let starsHtml = '';
        for(let i=0; i < 5; i++) {
            starsHtml += i < fullStars ? '<i class="fas fa-star"></i>' : '<i class="far fa-star" style="opacity: 0.3;"></i>';
        }

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
                    <p class="card-desc">${item.description || ''}</p>
                </div>
            </div>
        `;
    }).join('');

    // Применяем каскадную анимацию (Staggered Animation)
    const cards = container.querySelectorAll('.archive-card');
    cards.forEach((card, index) => {
        // Добавляем класс анимации
        card.classList.add('animate-entry');
        
        // Рассчитываем задержку: 30мс на каждую следующую карточку
        // Ограничиваем индекс 30-ю, чтобы на огромных списках не ждать слишком долго
        const delay = Math.min(index, 30) * 30;
        card.style.animationDelay = `${delay}ms`;
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
 * Настройка кнопок сортировки с Flip-анимацией
 */
function setupSort() {
    const sortBtns = document.querySelectorAll('.sort-side-btn');
    
    // Функция обновления иконок
    function updateSortIcons(clickedBtn = null) {
        sortBtns.forEach(btn => {
            const isActive = btn.dataset.sort === ArchiveState.sort;
            const icon = btn.querySelector('.sort-icon');
            
            // Если это не нажатая кнопка, просто переключаем класс активности
            if (btn !== clickedBtn) {
                btn.classList.toggle('active', isActive);
                if (!isActive && icon) {
                    // Возврат к дефолтной иконке
                    if (btn.dataset.sort === 'name') icon.className = 'fas fa-sort-alpha-down sort-icon';
                    else if (btn.dataset.sort === 'rating') icon.className = 'fas fa-sort-amount-down sort-icon';
                }
                return;
            }

            // Если это нажатая кнопка - запускаем анимацию
            btn.classList.add('active');
            
            if (icon) {
                // 1. Старт анимации (поворот на 90 градусов)
                icon.classList.add('flipping');

                // 2. Ждем половину времени анимации (150ms), меняем иконку и возвращаем
                setTimeout(() => {
                    if (btn.dataset.sort === 'name') {
                        icon.className = ArchiveState.sortDirection === 'asc' 
                            ? 'fas fa-sort-alpha-down sort-icon flipping' 
                            : 'fas fa-sort-alpha-up sort-icon flipping';
                    } else if (btn.dataset.sort === 'rating') {
                        icon.className = ArchiveState.sortDirection === 'desc' 
                            ? 'fas fa-sort-amount-down sort-icon flipping' 
                            : 'fas fa-sort-amount-up sort-icon flipping';
                    }
                    
                    requestAnimationFrame(() => {
                        icon.classList.remove('flipping');
                    });
                }, 150); 
            }
        });
    }

    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortType = btn.dataset.sort;
            
            // Смена направления
            if (ArchiveState.sort === sortType) {
                ArchiveState.sortDirection = ArchiveState.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                ArchiveState.sort = sortType;
                // Для имени A-Z, для рейтинга 5-1 (High to Low)
                ArchiveState.sortDirection = sortType === 'rating' ? 'desc' : 'asc';
            }
            
            updateSortIcons(btn);
            renderGrid();
        });
    });
    
    // Инициализация иконок при загрузке
    sortBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === ArchiveState.sort);
    });
}