/* js/media-manager.js */

import { loadGames, loadMovies } from './data-manager.js';

const ArchiveState = {
    currentType: 'games', // 'games' или 'movies'
    data: [],
    filter: 'all',
    searchQuery: '',
    sort: 'name',         // 'name' или 'rating'
    sortDirection: 'asc',  // 'asc' или 'desc'
    
    // --- ПАРАМЕТРЫ ОТОБРАЖЕНИЯ ---
    isExpanded: false,    // Развернут ли список полностью
    limit: 12             // Лимит отображения по умолчанию
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
        ArchiveState.isExpanded = false; // Сбрасываем раскрытие списка
        
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
            ArchiveState.isExpanded = false; // Сбрасываем раскрытие при смене фильтра
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
 * Рендер сетки (ПЛАВНАЯ ВЕРСИЯ С ЗАДЕРЖКОЙ СВОРАЧИВАНИЯ)
 */
function renderGrid() {
    const container = document.getElementById('archive-grid');
    const wrapper = document.querySelector('.archive-full-grid-wrapper');
    
    // Удаляем старую кнопку и оверлей, если есть
    const oldBtn = document.querySelector('.archive-footer-controls');
    if (oldBtn) oldBtn.remove();
    
    // Оверлей для затемнения
    let overlay = wrapper.querySelector('.archive-fade-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'archive-fade-overlay';
        wrapper.appendChild(overlay);
    }

    if (!container) return;

    // 1. Получаем полные данные
    const fullFilteredData = getFilteredAndSortedData();

    if (fullFilteredData.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#666; font-family:\'Exo 2\';">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
        wrapper.classList.remove('has-more');
        return;
    }

    // 2. Рендерим ВСЕ карточки, но лишним даем класс visually-hidden
    container.innerHTML = fullFilteredData.map((item, index) => {
        const genresHtml = item.genres 
            ? item.genres.slice(0, 3).map(g => `<span class="genre-tag">${genreMap[g] || g}</span>`).join('') 
            : '';
            
        const fullStars = Math.floor(item.rating);
        let starsHtml = '';
        for(let i=0; i < 5; i++) {
            starsHtml += i < fullStars ? '<i class="fas fa-star"></i>' : '<i class="far fa-star" style="opacity: 0.3;"></i>';
        }

        // Логика скрытия: если индекс больше лимита И мы не в режиме "Показать все"
        const isHidden = !ArchiveState.isExpanded && index >= ArchiveState.limit;
        const hiddenClass = isHidden ? 'visually-hidden' : '';

        // Анимация (delay) только для первых карточек, чтобы не тормозило
        const delay = index < 20 ? index * 50 : 0;
        const animationStyle = `style="animation-delay: ${delay}ms"`;

        return `
            <div class="archive-card animate-entry ${hiddenClass}" data-status="${item.status}" data-id="${item.id}" ${animationStyle}>
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

    // 3. Логика Кнопки и Оверлея
    if (fullFilteredData.length > ArchiveState.limit) {
        
        // Управление затемнением
        if (!ArchiveState.isExpanded) wrapper.classList.add('has-more');
        else wrapper.classList.remove('has-more');

        // Создаем кнопку
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'archive-footer-controls';
        
        const btnText = ArchiveState.isExpanded ? 'СВЕРНУТЬ БАЗУ' : `ПОКАЗАТЬ ВСЕ (${fullFilteredData.length})`;
        const btnIcon = ArchiveState.isExpanded ? '<i class="fas fa-chevron-up"></i>' : '<i class="fas fa-chevron-down"></i>';
        const collapseClass = ArchiveState.isExpanded ? 'collapse-mode' : '';

        controlsDiv.innerHTML = `
            <button class="cyber-load-btn ${collapseClass}" id="archive-toggle-btn">
                <span>${btnText} ${btnIcon}</span>
            </button>
        `;

        wrapper.after(controlsDiv);

        // --- ЛОГИКА КЛИКА С ЗАДЕРЖКОЙ ---
        const btnElement = document.getElementById('archive-toggle-btn');
        
        btnElement.addEventListener('click', () => {
            if (ArchiveState.isExpanded) {
                // == СВОРАЧИВАНИЕ ==
                
                // 1. Сначала плавно скроллим вверх к началу секции
                const sectionTop = document.getElementById('media-archive').offsetTop;
                // Небольшой отступ (80px), чтобы заголовок не прилипал к верху
                window.scrollTo({ top: sectionTop - 80, behavior: 'smooth' });

                // 2. Ждем, пока скролл завершится (600мс), и только потом скрываем карточки
                // Это предотвращает "прыжок" экрана, так как мы скрываем элементы, когда они уже не видны
                setTimeout(() => {
                    ArchiveState.isExpanded = false;
                    
                    // Скрываем лишние карточки
                    const cards = container.querySelectorAll('.archive-card');
                    cards.forEach((card, idx) => {
                        if (idx >= ArchiveState.limit) card.classList.add('visually-hidden');
                    });
                    
                    // Обновляем кнопку и оверлей
                    renderGrid(); 
                }, 600);

            } else {
                // == РАЗВОРАЧИВАНИЕ ==
                ArchiveState.isExpanded = true;
                
                // Сразу показываем все карточки
                const cards = container.querySelectorAll('.archive-card');
                cards.forEach(card => card.classList.remove('visually-hidden'));
                
                // Обновляем кнопку
                renderGrid();
            }
        });

    } else {
        wrapper.classList.remove('has-more');
    }
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
        ArchiveState.isExpanded = false; // Сбрасываем при поиске
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