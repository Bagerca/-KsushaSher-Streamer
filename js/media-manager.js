/* js/media-manager.js */

import { loadData } from './api.js';
import { openMediaModal } from './media-modal.js';

// Хелпер для получения ID видео
function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

// Генерация цвета по имени
function getUserColor(name) {
    if (!name) return '#00ffff'; 
    const colors = ['#39ff14', '#ff2d95', '#00ffff', '#ff4444', '#ffd700', '#bd00ff', '#ff8c00', '#007bff', '#e0e0e0'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

const ArchiveState = {
    currentType: 'games',
    dataMain: [],
    dataSuggestions: [],
    combinedData: [],
    activeFilters: new Set(), 
    searchQuery: '',
    sort: 'name',
    sortDirection: 'asc',
    renderedCount: 0,
    batchSize: 12,
    observer: null,
    isExpanded: false
};

const genreMap = {
    'action': 'Экшен', 'adventure': 'Приключения', 'comedy': 'Комедия', 'drama': 'Драма', 'horror': 'Хоррор', 'thriller': 'Триллер', 'scifi': 'Sci-Fi', 'fantasy': 'Фэнтези', 'mystery': 'Мистика', 'detective': 'Детектив', 'crime': 'Криминал', 'historical': 'Исторический', 'romance': 'Романтика', 'biography': 'Биография', 'movie': 'Фильм', 'series': 'Сериал', 'mini-series': 'Мини-сериал', 'cartoon': 'Мультфильм', 'anime': 'Аниме', 'anime-series': 'Аниме-сериал', 'short': 'Короткометражка', 'documentary': 'Документалка', 'show': 'ТВ-Шоу', 'animation': 'Анимация', 'superhero': 'Супергероика', 'sitcom': 'Ситком', 'slasher': 'Слэшер', 'musical': 'Мюзикл', 'western': 'Вестерн', 'noir': 'Нуар', 'sport': 'Спорт', 'war': 'Военный', 'family': 'Семейный', 'kids': 'Детский', 'adaptation': 'Экранизация', 'remake': 'Ремейк', 'blockbuster': 'Блокбастер', 'arthouse': 'Артхаус', 'trash': 'Трэш / B-Movie', 'psychological': 'Психологический', 'atmospheric': 'Атмосферный', 'feel-good': 'Добрый / Уютный', 'sad': 'Грустный', 'mind-bending': 'Вынос мозга', 'epic': 'Эпик', 'weird': 'Странное', 'classic': 'Классика', 'cult': 'Культовое', 'rpg': 'РПГ', 'shooter': 'Шутер', 'strategy': 'Стратегия', 'simulation': 'Симулятор', 'puzzle': 'Головоломка', 'platformer': 'Платформер', 'fighting': 'Файтинг', 'racing': 'Гонки', 'visual-novel': 'Виз. новелла', 'interactive-movie': 'Интерактивное кино', 'survival': 'Выживание', 'stealth': 'Стелс', 'roguelike': 'Рогалик', 'metroidvania': 'Метроидвания', 'souls-like': 'Соулс-лайк', 'open-world': 'Открытый мир', 'sandbox': 'Песочница', 'battle-royale': 'Батл-рояль', 'point-click': 'Point & Click', 'rhythm': 'Ритм', 'walking-sim': 'Сим. ходьбы', 'hack-and-slash': 'Слэшер', 'mmo': 'ММО', 'cyberpunk': 'Киберпанк', 'post-apocalyptic': 'Постапокалипсис', 'space': 'Космос', 'zombies': 'Зомби', 'retro': 'Ретро/80-е', 'dystopia': 'Антиутопия', 'magic': 'Магия', 'aliens': 'Пришельцы', 'indie': 'Инди', 'aaa': 'AAA', 'singleplayer': 'Одиночная', 'coop': 'Кооператив', 'multiplayer': 'Мультиплеер', 'free': 'Бесплатно', 'early-access': 'Ранний доступ', 'story-rich': 'Сюжетная', 'funny': 'Комедия/Юмор'
};

const statusMap = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'ПОД ВОПРОСОМ',
    'suggested': 'ПРЕДЛОЖКА'
};

const VALID_STATUSES = ['completed', 'playing', 'watched', 'watching', 'dropped', 'on-hold', 'suggested'];

function getTrigrams(text) {
    if (!text) return [];
    const cleanText = text.toLowerCase().replace(/[^\wа-яё0-9]/gi, '');
    const trigrams = [];
    if (cleanText.length < 3) return [cleanText];
    for (let i = 0; i < cleanText.length - 2; i++) {
        trigrams.push(cleanText.substring(i, i + 3));
    }
    return trigrams;
}

function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1.toLowerCase().includes(str2.toLowerCase())) return 1.0;
    const set1 = getTrigrams(str1);
    const set2 = getTrigrams(str2);
    let matches = 0;
    for (const trigram of set2) { if (set1.includes(trigram)) matches++; }
    return (2.0 * matches) / (set1.length + set2.length);
}

export async function initMediaArchive() {
    try {
        setupTabs();
        setupSearch(); 
        setupSort();
        setupGridClick();
        await switchArchiveType('games');
    } catch (e) {
        console.error("CRITICAL ERROR IN MEDIA ARCHIVE:", e);
    }
}

async function switchArchiveType(type) {
    const gridContainer = document.getElementById('archive-grid');
    if (gridContainer) gridContainer.classList.add('switching');
    updateTabUI(type);

    setTimeout(async () => {
        ArchiveState.currentType = type;
        ArchiveState.activeFilters = new Set(); 
        ArchiveState.searchQuery = '';
        ArchiveState.renderedCount = 0;
        ArchiveState.isExpanded = false;
        
        const searchInput = document.getElementById('archive-search');
        if (searchInput) searchInput.value = '';
        
        const suggestionsBox = document.querySelector('.search-suggestions');
        const searchModule = document.querySelector('.search-module');
        if (suggestionsBox) {
            suggestionsBox.classList.remove('active');
            suggestionsBox.innerHTML = '';
        }
        if (searchModule) searchModule.classList.remove('suggestions-open');
        
        const rawData = type === 'games' 
            ? await loadData('games.json', []) 
            : await loadData('movies.json', []);
        ArchiveState.dataMain = Array.isArray(rawData) ? rawData : [];

        let rawSuggestions = [];
        try {
            rawSuggestions = await loadData('suggestions.json', []);
        } catch (e) {
            console.warn("Failed to load suggestions.json", e);
        }
        
        ArchiveState.dataSuggestions = Array.isArray(rawSuggestions) 
            ? rawSuggestions.filter(item => item.type === type) 
            : [];
        
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

function renderFilters() {
    const statusContainer = document.getElementById('archive-filters-status');
    const genreContainer = document.getElementById('archive-filters-genre');
    if (!statusContainer || !genreContainer) return;

    const allGenres = new Set();
    [...ArchiveState.dataMain, ...ArchiveState.dataSuggestions].forEach(item => { 
        if (item.genres && Array.isArray(item.genres)) {
            item.genres.forEach(g => allGenres.add(g)); 
        }
    });

    let statusesOrder = [];
    if (ArchiveState.currentType === 'games') {
        statusesOrder = ['completed', 'playing', 'suggested', 'on-hold', 'dropped'];
    } else {
        statusesOrder = ['watched', 'watching', 'suggested', 'on-hold', 'dropped'];
    }
    
    let statusHtml = '';
    const isActive = (val) => ArchiveState.activeFilters.has(val) ? 'active' : '';

    statusesOrder.forEach(s => {
        const isSuggested = s === 'suggested';
        const extraClass = isSuggested ? 'status-suggested' : `status-${s}`;
        
        statusHtml += `<div class="filter-chip is-status ${extraClass} ${isActive(s)}" data-filter="${s}">
            ${statusMap[s] || s}
        </div>`;
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
            
            if (ArchiveState.activeFilters.has(val)) {
                ArchiveState.activeFilters.delete(val);
            } else {
                if (VALID_STATUSES.includes(val)) {
                    const currentGenres = [];
                    ArchiveState.activeFilters.forEach(f => {
                        if (!VALID_STATUSES.includes(f)) currentGenres.push(f);
                    });
                    
                    ArchiveState.activeFilters.clear();
                    currentGenres.forEach(g => ArchiveState.activeFilters.add(g));
                }
                
                ArchiveState.activeFilters.add(val);
            }
            
            ArchiveState.isExpanded = false; 
            renderFilters();
            processData();
            renderGrid();
        });
    });
}

function processData() {
    const activeStatuses = new Set();
    const activeGenres = new Set();
    let isAllSelected = false;

    if (ArchiveState.activeFilters.size === 0) {
        isAllSelected = true;
    } else {
        ArchiveState.activeFilters.forEach(filter => {
            if (VALID_STATUSES.includes(filter)) activeStatuses.add(filter);
            else activeGenres.add(filter);
        });
    }

    const filterList = (sourceList) => {
        if (!Array.isArray(sourceList)) return [];
        return sourceList.map(item => {
            let matchScore = 0;
            if (ArchiveState.searchQuery.length > 0 && item.title) {
                if (ArchiveState.searchQuery.length < 3) {
                    matchScore = item.title.toLowerCase().includes(ArchiveState.searchQuery) ? 1 : 0;
                } else {
                    matchScore = calculateSimilarity(item.title, ArchiveState.searchQuery);
                }
            } else {
                matchScore = 1; 
            }
            return { ...item, _matchScore: matchScore };
        }).filter(item => {
            if (item._matchScore < 0.25) return false;
            
            if (isAllSelected) return true;

            let statusMatch = true;
            if (activeStatuses.size > 0) {
                statusMatch = activeStatuses.has(item.status);
            }

            let genreMatch = true;
            if (activeGenres.size > 0) {
                if (!item.genres || item.genres.length === 0) genreMatch = false;
                else genreMatch = item.genres.some(g => activeGenres.has(g));
            }
            
            return statusMatch && genreMatch;
        });
    };

    let filteredMain = filterList(ArchiveState.dataMain);
    let filteredSuggestions = filterList(ArchiveState.dataSuggestions);

    const dir = ArchiveState.sortDirection === 'asc' ? 1 : -1;
    const sortFn = (a, b) => {
        if (ArchiveState.searchQuery.length > 0 && Math.abs(a._matchScore - b._matchScore) > 0.1) {
            return b._matchScore - a._matchScore;
        }
        if (ArchiveState.sort === 'rating') {
            return ((parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0)) * dir;
        } else {
            return (a.title || "").localeCompare(b.title || "") * dir;
        }
    };

    filteredMain.sort(sortFn);
    filteredSuggestions.sort(sortFn);

    ArchiveState.combinedData = [...filteredMain];
    
    const showDividers = isAllSelected;

    if (filteredSuggestions.length > 0) {
        
        const sugPosters = filteredSuggestions.filter(item => item.format !== 'youtube');
        const sugYoutube = filteredSuggestions.filter(item => item.format === 'youtube');

        if (showDividers) {
            if (filteredMain.length > 0) {
                ArchiveState.combinedData.push({ isDivider: true, title: "COMMUNITY_SUGGESTIONS // ПРЕДЛОЖКА" });
            } else {
                ArchiveState.combinedData.push({ isDivider: true, title: "SUGGESTED" });
            }
        }

        ArchiveState.combinedData = [...ArchiveState.combinedData, ...sugPosters];

        if (sugYoutube.length > 0) {
            if (sugPosters.length > 0) {
                ArchiveState.combinedData.push({ isSpacer: true });
            }
            ArchiveState.combinedData = [...ArchiveState.combinedData, ...sugYoutube];
        }
    }

    ArchiveState.filteredData = ArchiveState.combinedData; 
}

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

    if (ArchiveState.combinedData.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#666;">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
        const overlay = wrapper.querySelector('.archive-fade-overlay');
        if (overlay) overlay.remove();
        wrapper.classList.remove('has-more');
        return;
    }

    renderNextBatch();

    if (ArchiveState.renderedCount < ArchiveState.combinedData.length) {
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
        
        if (ArchiveState.isExpanded) {
             renderButton('collapse');
        }
    }
}

function renderButton(mode) {
    const wrapper = document.querySelector('.archive-full-grid-wrapper');
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'archive-footer-controls';
    
    const realCount = ArchiveState.combinedData.filter(i => !i.isDivider && !i.isSpacer).length;

    const btnText = mode === 'expand' ? `РАЗВЕРНУТЬ БАЗУ (${realCount})` : 'СВЕРНУТЬ';
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
            const sectionTop = document.getElementById('media-archive').offsetTop;
            window.scrollTo({ top: sectionTop - 50, behavior: 'smooth' });
            ArchiveState.isExpanded = true;
            renderGrid();
        } else {
            ArchiveState.isExpanded = false;
            renderGrid();
            const section = document.getElementById('media-archive');
            section.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        setTimeout(() => { if (window.updateNavRail) window.updateNavRail(); }, 500);
    });
}

function setupInfiniteScroll() {
    if (ArchiveState.observer) ArchiveState.observer.disconnect();
    const options = { root: null, rootMargin: '200px', threshold: 0.1 };
    ArchiveState.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && ArchiveState.renderedCount < ArchiveState.combinedData.length) {
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
    
    const dividerIndex = ArchiveState.combinedData.findIndex(i => i.isDivider);
    let limit;
    
    if (ArchiveState.isExpanded) {
        limit = start + ArchiveState.batchSize;
    } else {
        limit = ArchiveState.batchSize;
        if (dividerIndex !== -1 && dividerIndex < limit) {
            limit = dividerIndex;
        }
    }
    
    const end = Math.min(limit, ArchiveState.combinedData.length);
    
    if (start >= end) return;

    const itemsToRender = ArchiveState.combinedData.slice(start, end);

    const newCardsHtml = itemsToRender.map((item, index) => {
        if (item.isDivider) {
            return `
            <div class="archive-divider-row animate-entry" style="grid-column: 1 / -1; animation-delay: ${index * 50}ms">
                <div class="divider-line"></div>
                <div class="divider-text">${item.title}</div>
                <div class="divider-line"></div>
            </div>`;
        }
        if (item.isSpacer) return `<div style="grid-column: 1 / -1; height: 0; margin: 0; pointer-events: none;"></div>`;

        const isYouTube = item.format === 'youtube';
        const delay = (index % ArchiveState.batchSize) * 50;
        
        let images = [];
        
        if (isYouTube && item.videos && item.videos.length > 0) {
            images = item.videos.slice(0, 3).map(v => {
                // ИЗМЕНЕНИЯ ЗДЕСЬ: Поддержка строк
                const url = (typeof v === 'string') ? v : v.url;
                const vidId = getYouTubeId(url);
                return `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`; 
            });
        } 
        else if (item.images && item.images.length > 0) {
            images = item.images;
        } else if (item.image) {
            images = [item.image];
        }
        
        if (images.length === 0) images = ['https://via.placeholder.com/600x900?text=NO+IMAGE'];

        const stackCount = Math.min(images.length, 3);
        const stackClass = `stack-${stackCount}`; 

        let layersHtml = '';
        if (stackCount >= 3) {
            layersHtml += `<div class="card-layer layer-back-deep" style="background-image: url('${images[2]}')"></div>`;
        }
        if (stackCount >= 2) {
            layersHtml += `<div class="card-layer layer-back" style="background-image: url('${images[1]}')"></div>`;
        }

        let playOverlay = isYouTube ? `<div class="youtube-play-overlay"><i class="fab fa-youtube"></i></div>` : '';
        
        let playlistBadge = '';
        if (isYouTube && item.videos && item.videos.length > 1) {
            playlistBadge = `<div class="yt-playlist-badge"><i class="fas fa-layer-group"></i> ${item.videos.length}</div>`;
        }
        
        let ratingBadgeHtml = '';
        if (item.status !== 'suggested' && !isYouTube) {
            const fullStars = Math.floor(item.rating || 0);
            let starsHtml = '';
            for(let i=0; i < 5; i++) starsHtml += i < fullStars ? '<i class="fas fa-star"></i>' : '<i class="far fa-star" style="opacity: 0.3;"></i>';
            ratingBadgeHtml = `<div class="card-rating-badge"><span class="stars-visual">${starsHtml}</span><span class="rating-number">${item.rating}</span></div>`;
        }

        let suggestedBadge = '';
        if (item.status === 'suggested' && item.suggestedBy) {
            const userColor = getUserColor(item.suggestedBy);
            suggestedBadge = `<div class="suggested-by-badge"><i class="fas fa-user" style="color: ${userColor}"></i> ${item.suggestedBy}</div>`;
        }

        let genresHtml = '';
        if (item.genres && item.status !== 'suggested') {
            const tags = item.genres.slice(0, 3).map(g => `<span class="genre-tag">${genreMap[g] || g}</span>`).join('');
            genresHtml = `<div class="card-genres">${tags}</div>`;
        }

        layersHtml += `
            <div class="card-layer layer-front">
                <div class="layer-img-bg" style="background-image: url('${images[0]}')"></div>
                <div class="layer-content">
                    ${playOverlay}
                    ${playlistBadge}
                    ${ratingBadgeHtml}
                    ${suggestedBadge}
                    
                    <div class="card-info">
                        <div class="card-title" title="${item.title}">${item.title}</div>
                        ${genresHtml}
                        <p class="card-desc">${item.description || ''}</p>
                    </div>
                </div>
                <!-- Статус бар -->
                <div class="card-status-bar"></div>
            </div>
        `;

        const youtubeClass = isYouTube ? 'is-youtube' : '';
        
        return `
        <div class="archive-card-container ${stackClass} ${youtubeClass} animate-entry" 
             data-status="${item.status}" 
             data-id="${item.id}" 
             style="animation-delay: ${delay}ms">
             ${layersHtml}
        </div>`;
        
    }).join('');

    container.insertAdjacentHTML('beforeend', newCardsHtml);
    ArchiveState.renderedCount = end;
}

function setupGridClick() {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.archive-card-container');
        if (card) {
            const id = card.dataset.id;
            const item = [...ArchiveState.dataMain, ...ArchiveState.dataSuggestions].find(i => i.id === id);
            if (item) openMediaModal(item, ArchiveState.currentType);
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
            
            if (ArchiveState.searchQuery !== '') {
                 ArchiveState.searchQuery = '';
                 processData();
                 renderGrid();
            }
            return;
        }

        const fullList = [...ArchiveState.dataMain, ...ArchiveState.dataSuggestions];

        let allMatches = fullList.map(item => {
            let score = 0;
            if (query.length < 3 && item.title) {
                 score = item.title.toLowerCase().includes(query) ? 1 : 0;
            } else if (item.title) {
                 score = calculateSimilarity(item.title, query);
            }
            return { ...item, score };
        }).filter(item => item.score > 0.25); 

        allMatches.sort((a, b) => b.score - a.score);
        const matches = allMatches.slice(0, 4);

        if (matches.length > 0) {
            suggestionsBox.innerHTML = matches.map(item => `
                <div class="suggestion-item" data-title="${item.title}" data-status="${item.status}">
                    <img src="${item.image || (item.images ? item.images[0] : '')}" class="sugg-thumb" onerror="this.src='https://via.placeholder.com/6x85'">
                    <div class="sugg-info">
                        <span class="sugg-title">${item.title}</span>
                        <div class="sugg-meta">
                            <span class="sugg-status">${statusMap[item.status] || item.status}</span>
                            <span class="sugg-rating"><i class="fas fa-star"></i> ${item.rating || 0}</span>
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