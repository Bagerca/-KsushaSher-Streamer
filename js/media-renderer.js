/* js/media-renderer.js */
import EventBus from './event-bus.js';
import { GENRE_MAP, STATUS_MAP, VALID_STATUSES } from './media-store.js';

export class MediaRenderer {
    constructor(store) {
        this.store = store;
        
        this.els = {
            grid: document.getElementById('archive-grid'),
            wrapper: document.querySelector('.archive-full-grid-wrapper'),
            statusFilters: document.getElementById('archive-filters-status'),
            genreFilters: document.getElementById('archive-filters-genre'),
            searchInput: document.getElementById('archive-search'),
            searchModule: document.querySelector('.search-module'),
            typeSwitcher: document.querySelector('.type-switcher'),
            typeBtns: document.querySelectorAll('.switcher-btn'),
            sortBtns: document.querySelectorAll('.sort-side-btn')
        };

        this.isExpanded = false;
        this.renderedCount = 0;
        this.batchSize = 12;
        this.observer = null;

        this.initListeners();
    }

    initListeners() {
        // Подписки на Store через EventBus
        EventBus.on('MEDIA_STORE_LOADED', () => {
            this.isExpanded = false;
            this.updateTabUI();
            this.renderFilters();
            this.renderGrid(true);
        });

        EventBus.on('MEDIA_STORE_UPDATED', () => {
            this.isExpanded = false;
            this.renderFilters();
            this.renderGrid(true);
        });

        // Слушатели DOM: Табы
        this.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (this.store.currentType !== type) {
                    if (this.els.grid) this.els.grid.classList.add('switching');
                    setTimeout(() => this.store.loadType(type), 400);
                }
            });
        });

        // Слушатели DOM: Сортировка
        this.els.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.store.setSort(btn.dataset.sort);
                this.updateSortUI(btn);
            });
        });

        // Слушатели DOM: Поиск
        this.setupSearch();

        // Слушатель клика по карточкам (Делегирование)
        if (this.els.grid) {
            this.els.grid.addEventListener('click', (e) => {
                const card = e.target.closest('.archive-card-container');
                if (card) {
                    const id = card.dataset.id;
                    const item = this.store.getItemById(id);
                    if (item) {
                        // ИСПОЛЬЗУЕМ EVENT BUS ВМЕСТО ПРЯМОГО ИМПОРТА
                        EventBus.emit('MODAL_OPEN_MEDIA', { item, type: this.store.currentType });
                    }
                }
            });
        }
    }

    updateTabUI() {
        if (this.els.grid) this.els.grid.classList.remove('switching');
        if (this.els.typeSwitcher) {
            this.els.typeSwitcher.classList.toggle('movies-active', this.store.currentType === 'movies');
        }
        this.els.typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === this.store.currentType));
        if (this.els.searchInput) this.els.searchInput.value = '';
    }

    updateSortUI(clickedBtn) {
        this.els.sortBtns.forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            if (btn !== clickedBtn) {
                btn.classList.remove('active');
                if (icon) icon.className = btn.dataset.sort === 'name' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-sort-amount-down sort-icon';
            } else {
                btn.classList.add('active');
                let newIconClass = btn.dataset.sort === 'name' 
                    ? (this.store.sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up')
                    : (this.store.sortDirection === 'desc' ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up');
                
                if (icon) {
                    icon.classList.add('flipping');
                    setTimeout(() => {
                        icon.className = `${newIconClass} sort-icon flipping`;
                        requestAnimationFrame(() => icon.classList.remove('flipping'));
                    }, 150);
                }
            }
        });
    }

    renderFilters() {
        if (!this.els.statusFilters || !this.els.genreFilters) return;

        let statusesOrder = this.store.currentType === 'games' 
            ? ['completed', 'playing', 'suggested', 'on-hold', 'dropped']
            : ['watched', 'watching', 'suggested', 'on-hold', 'dropped'];
        
        const isActive = (val) => this.store.activeFilters.has(val) ? 'active' : '';

        // Статусы
        this.els.statusFilters.innerHTML = statusesOrder.map(s => `
            <div class="filter-chip is-status ${s === 'suggested' ? 'status-suggested' : `status-${s}`} ${isActive(s)}" data-filter="${s}">
                ${STATUS_MAP[s] || s}
            </div>
        `).join('');

        // Жанры
        this.els.genreFilters.innerHTML = this.store.getAllGenres().map(g => `
            <div class="filter-chip ${isActive(g)}" data-filter="${g}">${GENRE_MAP[g] || g}</div>
        `).join('');

        // Биндинг кликов
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => this.store.toggleFilter(chip.dataset.filter));
        });
    }

    setupSearch() {
        if (!this.els.searchInput || !this.els.searchModule) return;

        let suggestionsBox = document.querySelector('.search-suggestions');
        if (!suggestionsBox) {
            suggestionsBox = document.createElement('div');
            suggestionsBox.className = 'search-suggestions';
            this.els.searchModule.appendChild(suggestionsBox);
        }

        const toggleSugg = (isOpen) => {
            suggestionsBox.classList.toggle('active', isOpen);
            this.els.searchModule.classList.toggle('suggestions-open', isOpen);
        };

        this.els.searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length < 1) {
                toggleSugg(false);
                if (this.store.searchQuery !== '') this.store.setSearchQuery('');
                return;
            }

            const matches = this.store.getSearchSuggestions(query);
            
            if (matches.length > 0) {
                suggestionsBox.innerHTML = matches.map(item => `
                    <div class="suggestion-item" data-title="${item.title}">
                        <img src="${item.image || (item.images ? item.images[0] : '')}" class="sugg-thumb" onerror="this.src='https://via.placeholder.com/6x85'">
                        <div class="sugg-info">
                            <span class="sugg-title">${item.title}</span>
                            <div class="sugg-meta">
                                <span class="sugg-status" data-status="${item.status}">${STATUS_MAP[item.status] || item.status}</span>
                                <span class="sugg-rating"><i class="fas fa-star"></i> ${item.rating || 0}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                suggestionsBox.innerHTML = `
                    <div class="suggestion-empty">
                        <i class="far fa-sad-tear"></i>
                        <span>По запросу "${query}" ничего не найдено</span>
                    </div>`;
            }
            toggleSugg(true);
        });

        suggestionsBox.addEventListener('click', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (item) {
                const title = item.dataset.title;
                this.els.searchInput.value = title;
                toggleSugg(false);
                this.store.setSearchQuery(title);
            }
        });

        this.els.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                toggleSugg(false);
                this.store.setSearchQuery(this.els.searchInput.value);
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.els.searchModule.contains(e.target)) toggleSugg(false);
        });
    }

    // --- RENDERING GRID ---

    renderGrid(reset = false) {
        if (reset) {
            this.els.grid.innerHTML = '';
            this.renderedCount = 0;
            if (this.observer) this.observer.disconnect();
            const oldSentinel = document.getElementById('scroll-sentinel');
            if (oldSentinel) oldSentinel.remove();
            const oldBtn = document.querySelector('.archive-footer-controls');
            if (oldBtn) oldBtn.remove();
        }

        const data = this.store.combinedData;

        if (data.length === 0) {
            this.els.grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#666;">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
            this.els.wrapper.classList.remove('has-more');
            return;
        }

        this.renderNextBatch();

        if (this.renderedCount < data.length) {
            if (!this.isExpanded) {
                this.renderExpandButton('expand');
                this.ensureOverlay(true);
            } else {
                this.ensureOverlay(false);
                this.setupInfiniteScroll();
                this.renderExpandButton('collapse');
            }
        } else {
            this.ensureOverlay(false);
            if (this.isExpanded) this.renderExpandButton('collapse');
        }
    }

    ensureOverlay(show) {
        let overlay = this.els.wrapper.querySelector('.archive-fade-overlay');
        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'archive-fade-overlay';
                this.els.wrapper.appendChild(overlay);
            }
            this.els.wrapper.classList.add('has-more');
        } else {
            if (overlay) overlay.remove();
            this.els.wrapper.classList.remove('has-more');
        }
    }

    renderExpandButton(mode) {
        let controlsDiv = document.querySelector('.archive-footer-controls');
        if (!controlsDiv) {
            controlsDiv = document.createElement('div');
            controlsDiv.className = 'archive-footer-controls';
            this.els.wrapper.after(controlsDiv);
        }

        const realCount = this.store.combinedData.filter(i => !i.isDivider && !i.isSpacer).length;
        const btnText = mode === 'expand' ? `РАЗВЕРНУТЬ БАЗУ (${realCount})` : 'СВЕРНУТЬ';
        const btnIcon = mode === 'expand' ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
        
        controlsDiv.innerHTML = `
            <button class="cyber-load-btn ${mode === 'collapse' ? 'collapse-mode' : ''}" id="archive-toggle-btn">
                <span>${btnText} ${btnIcon}</span>
            </button>
        `;

        document.getElementById('archive-toggle-btn').addEventListener('click', () => {
            if (mode === 'expand') {
                const sectionTop = document.getElementById('media-archive').offsetTop;
                window.scrollTo({ top: sectionTop - 50, behavior: 'smooth' });
                this.isExpanded = true;
                this.renderGrid();
            } else {
                this.isExpanded = false;
                this.renderGrid(true);
                document.getElementById('media-archive').scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        });
    }

    setupInfiniteScroll() {
        if (this.observer) this.observer.disconnect();
        
        let sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel) {
            sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.style.width = '100%';
            sentinel.style.height = '50px';
            this.els.wrapper.appendChild(sentinel);
        }

        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && this.renderedCount < this.store.combinedData.length) {
                this.renderNextBatch();
            }
        }, { rootMargin: '200px' });
        
        this.observer.observe(sentinel);
    }

    renderNextBatch() {
        const data = this.store.combinedData;
        const start = this.renderedCount;
        const dividerIndex = data.findIndex(i => i.isDivider);
        
        let limit = this.isExpanded ? start + this.batchSize : Math.min(this.batchSize, dividerIndex !== -1 ? dividerIndex : this.batchSize);
        const end = Math.min(limit, data.length);
        
        if (start >= end) return;

        const html = data.slice(start, end).map((item, index) => this.createCardHTML(item, index)).join('');
        this.els.grid.insertAdjacentHTML('beforeend', html);
        this.renderedCount = end;
    }

    createCardHTML(item, index) {
        if (item.isDivider) {
            return `
            <div class="archive-divider-row animate-entry" style="grid-column: 1 / -1; animation-delay: ${index * 50}ms">
                <div class="divider-line"></div><div class="divider-text">${item.title}</div><div class="divider-line"></div>
            </div>`;
        }
        if (item.isSpacer) return `<div style="grid-column: 1 / -1; height: 0; margin: 0; pointer-events: none;"></div>`;

        const isYouTube = item.format === 'youtube';
        const delay = (index % this.batchSize) * 50;
        
        let images = [];
        if (isYouTube && item.videos) {
            images = item.videos.slice(0, 3).map(v => `https://img.youtube.com/vi/${this._getYouTubeId(typeof v === 'string' ? v : v.url)}/maxresdefault.jpg`);
        } else if (item.images) {
            images = item.images;
        } else if (item.image) {
            images = [item.image];
        }
        if (images.length === 0) images = ['https://via.placeholder.com/600x900?text=NO+IMAGE'];

        const stackCount = Math.min(images.length, 3);
        const stackClass = `stack-${stackCount}`; 

        let layersHtml = '';
        if (stackCount >= 3) layersHtml += `<div class="card-layer layer-back-deep" style="background-image: url('${images[2]}')"></div>`;
        if (stackCount >= 2) layersHtml += `<div class="card-layer layer-back" style="background-image: url('${images[1]}')"></div>`;

        const playOverlay = isYouTube ? `<div class="youtube-play-overlay"><i class="fab fa-youtube"></i></div>` : '';
        const playlistBadge = (isYouTube && item.videos && item.videos.length > 1) ? `<div class="yt-playlist-badge"><i class="fas fa-layer-group"></i> ${item.videos.length}</div>` : '';
        
        const ratingBadgeHtml = (item.status !== 'suggested' && !isYouTube) 
            ? `<div class="card-rating-badge"><span class="stars-visual">${Array(5).fill(0).map((_,i) => i < Math.floor(item.rating || 0) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star" style="opacity: 0.3;"></i>').join('')}</span><span class="rating-number">${item.rating}</span></div>` 
            : '';

        const suggestedBadge = (item.status === 'suggested' && item.suggestedBy) 
            ? `<div class="suggested-by-badge"><i class="fas fa-user" style="color: ${this._getUserColor(item.suggestedBy)}"></i> ${item.suggestedBy}</div>` 
            : '';

        const genresHtml = (item.genres && item.status !== 'suggested') 
            ? `<div class="card-genres">${item.genres.slice(0, 3).map(g => `<span class="genre-tag">${GENRE_MAP[g] || g}</span>`).join('')}</div>` 
            : '';

        layersHtml += `
            <div class="card-layer layer-front">
                <div class="layer-img-bg" style="background-image: url('${images[0]}')"></div>
                <div class="layer-content">
                    ${playOverlay}${playlistBadge}${ratingBadgeHtml}${suggestedBadge}
                    <div class="card-info">
                        <div class="card-title" title="${item.title}">${item.title}</div>
                        ${genresHtml}
                        <p class="card-desc">${item.description || ''}</p>
                    </div>
                </div>
                <div class="card-status-bar"></div>
            </div>`;

        return `
        <div class="archive-card-container ${stackClass} ${isYouTube ? 'is-youtube' : ''} animate-entry" 
             data-status="${item.status}" data-id="${item.id}" style="animation-delay: ${delay}ms">
             ${layersHtml}
        </div>`;
    }

    // Helpers
    _getYouTubeId(url) {
        if (!url) return null;
        const match = url.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/);
        return (match && match[1].length === 11) ? match[1] : null;
    }

    _getUserColor(name) {
        if (!name) return '#00ffff'; 
        const colors = ['#39ff14', '#ff2d95', '#00ffff', '#ff4444', '#ffd700', '#bd00ff', '#ff8c00', '#007bff'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }
}