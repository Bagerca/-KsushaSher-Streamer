/* js/library-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { CardFactory } from './archive/CardFactory.js';
import { LazyLoader } from './archive/LazyLoader.js';
import { SearchEngine } from './services/SearchEngine.js';
import { optimizeImageUrl } from './utils.js';
import { STATUS_MAP } from './media-store.js';

export class LibraryController {
    constructor() {
        this.container = document.getElementById('route-library');
        if (!this.container) return;

        this.els = {
            backBtn: document.getElementById('btn-library-back'),
            gridMain: document.getElementById('library-grid-main'),
            
            sortBtns: document.querySelectorAll('#library-sort-switcher .sort-btn'),
            typeBtns: document.querySelectorAll('#library-type-switcher .switcher-btn'),
            typeSwitcher: document.getElementById('library-type-switcher'),
            statusFilters: document.getElementById('library-filters-status'),
            btnDetailed: document.getElementById('lib-grid-detailed'),
            btnCompact: document.getElementById('lib-grid-compact'),
            counter: document.querySelector('.lib-counter-val'),
            
            searchModule: document.getElementById('lib-search-module'),
            searchInput: document.getElementById('lib-search-input'),
            searchIcon: document.getElementById('lib-search-icon'),
            searchLoading: document.getElementById('lib-search-loading'),
            searchHotkey: document.getElementById('lib-search-hotkey'),
            suggestionsBox: document.getElementById('lib-search-suggestions')
        };

        this.gridMode = 'detailed'; 
        this.localSearchQuery = '';
        
        this.searchDebounce = null;
        this.currentSearchMatches = [];
        this.selectedIndex = -1;

        this.factory = new CardFactory(() => this.gridMode);
        this.lazyLoader = new LazyLoader(() => this.gridMode);

        this.bindEvents();
    }

    mount() {
        console.log('📚 [Library] Компонент смонтирован');
        this.localSearchQuery = AppStore.getState().media.searchQuery || '';
        this.els.searchInput.value = this.localSearchQuery;
        this.toggleSuggestions(false);
        this.syncUIWithState();
        this.renderGrid();
    }

    unmount() {
        console.log('📚 [Library] Компонент размонтирован');
    }

    bindEvents() {
        this.els.backBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            const type = AppStore.getState().media.type || 'games';
            AppRouter.navigate('/archive', { type: type });
        });

        this.els.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                const state = AppStore.getState().media;
                const newSortDir = state.sort === btn.dataset.sort 
                    ? (state.sortDirection === 'asc' ? 'desc' : 'asc') 
                    : (btn.dataset.sort === 'rating' ? 'desc' : 'asc');
                
                AppRouter.updateQuery({ sort: btn.dataset.sort, sortDir: newSortDir });
            });
        });

        this.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (AppStore.getState().media.type !== type) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    const currentQuery = { ...AppStore.getState().route.query };
                    delete currentQuery.filters; 
                    AppRouter.navigate('/library', { type }, currentQuery);
                }
            });
        });

        const updateGridMode = (mode) => {
            if (this.gridMode === mode) return;
            EventBus.emit('PLAY_SOUND', 'click');
            this.gridMode = mode;
            this.els.btnDetailed.classList.toggle('active', mode === 'detailed');
            this.els.btnCompact.classList.toggle('active', mode === 'compact');
            
            if (mode === 'compact') this.els.gridMain.classList.add('compact-mode');
            else this.els.gridMain.classList.remove('compact-mode');
            
            this.els.gridMain.style.opacity = '0';
            setTimeout(() => { this.renderGrid(); this.els.gridMain.style.opacity = '1'; }, 200);
        };

        this.els.btnDetailed.addEventListener('click', () => updateGridMode('detailed'));
        this.els.btnCompact.addEventListener('click', () => updateGridMode('compact'));

        this.els.gridMain.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || card.classList.contains('archive-divider-row')) return;
            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) return;
            const item = state.data.media.find(i => i.id === card.dataset.id);
            if (item) {
                EventBus.emit('PLAY_SOUND', 'expand');
                // ИСПРАВЛЕНИЕ: Добавляем метку откуда пришли
                AppRouter.navigate('/item', { id: item.id }, { from: 'library' });
            }
        });

        this.els.searchInput.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
        this.els.searchInput.addEventListener('keydown', (e) => this.handleSearchKeyDown(e));

        this.els.searchIcon.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            this.executeSearch(this.els.searchInput.value);
        });

        document.addEventListener('click', (e) => {
            if (!this.els.searchModule.contains(e.target)) this.toggleSuggestions(false);
        });

        this.els.suggestionsBox.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.suggestion-item');
            if (itemEl) {
                const index = parseInt(itemEl.dataset.index);
                if (!isNaN(index) && this.currentSearchMatches[index]) {
                    this.applySearchSelection(this.currentSearchMatches[index]);
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                if (AppStore.getState().route.path.startsWith('/library')) {
                    e.preventDefault();
                    this.els.searchInput.focus();
                }
            }
        });

        AppStore.subscribe((state, prevState) => {
            const curr = state.media;
            const prev = prevState?.media;
            
            if (state.route.path.startsWith('/library')) {
                if (
                    curr.type !== prev?.type || 
                    JSON.stringify(curr.filters) !== JSON.stringify(prev?.filters) ||
                    curr.sort !== prev?.sort ||
                    curr.sortDirection !== prev?.sortDirection
                ) {
                    this.syncUIWithState();
                }
                
                if (
                    JSON.stringify(curr.filters) !== JSON.stringify(prev?.filters) ||
                    curr.sort !== prev?.sort ||
                    curr.sortDirection !== prev?.sortDirection ||
                    curr.searchQuery !== prev?.searchQuery
                ) {
                    if (curr.searchQuery !== undefined) {
                        this.localSearchQuery = curr.searchQuery;
                        this.els.searchInput.value = this.localSearchQuery;
                    }
                    this.renderGrid();
                }
            }
        });

        EventBus.on('MEDIA_STORE_LOADING', () => {
            if (AppStore.getState().route.path.startsWith('/library')) {
                this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:var(--color-neon-pink); font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
                this.els.counter.textContent = '0';
            }
        });

        EventBus.on('MEDIA_STORE_LOADED', () => {
            if (AppStore.getState().route.path.startsWith('/library')) {
                this.renderGrid();
            }
        });

        this.els.gridMain.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.gridMode === 'compact') return;
            card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]').forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl && !layer.style.backgroundImage) {
                    this.lazyLoader._safeImageLoad(bgUrl, card.classList.contains('is-youtube'), layer, null, null, layer);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }, true);
    }

    executeSearch(query) {
        this.toggleSuggestions(false);
        AppRouter.updateQuery({ search: query.trim() ? query : null });
    }

    handleSearchInput(text) {
        const query = text.toLowerCase().trim();
        if (this.els.searchHotkey) this.els.searchHotkey.style.display = query.length > 0 ? 'none' : 'flex';

        clearTimeout(this.searchDebounce);
        
        if (query.length < 1) {
            this.toggleSuggestions(false);
            this.toggleLoading(false);
            if (this.localSearchQuery !== '') {
                this.executeSearch('');
            }
            return;
        }

        this.toggleLoading(true);
        
        this.searchDebounce = setTimeout(() => {
            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) {
                this.toggleLoading(false);
                return;
            }

            let flattenedList = [];
            state.data.media.forEach(item => {
                if (item.type !== state.media.type) return; 
                if (item.format === 'youtube') return; 
                
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => flattenedList.push({ ...sub, status: sub.status || item.status }));
                } else {
                    flattenedList.push(item);
                }
            });

            const uniqueMap = new Map();
            flattenedList.forEach(item => uniqueMap.set(item.id, item));
            flattenedList = Array.from(uniqueMap.values());

            let matches = flattenedList.map(item => ({
                ...item,
                score: SearchEngine.scoreItemForSuggestions(item.title, query)
            })).filter(item => item.score > 15);

            matches = matches.sort((a, b) => b.score - a.score).slice(0, 5);
            this.currentSearchMatches = matches;
            
            this.renderSuggestions(matches);
            this.toggleLoading(false);
        }, 300);
    }

    handleSearchKeyDown(e) {
        const isDropdownOpen = this.els.searchModule.classList.contains('suggestions-open');
        
        if (!isDropdownOpen || this.currentSearchMatches.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                EventBus.emit('PLAY_SOUND', 'click');
                this.executeSearch(this.els.searchInput.value);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.currentSearchMatches.length;
            this.updateSelectionUI();
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.currentSearchMatches.length) % this.currentSearchMatches.length;
            this.updateSelectionUI();
        } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && this.currentSearchMatches[this.selectedIndex]) {
                this.applySearchSelection(this.currentSearchMatches[this.selectedIndex]);
            } else {
                EventBus.emit('PLAY_SOUND', 'click');
                this.executeSearch(this.els.searchInput.value);
            }
        } 
        else if (e.key === 'Escape') {
            this.toggleSuggestions(false);
        }
    }

    updateSelectionUI() {
        const items = this.els.suggestionsBox.querySelectorAll('.suggestion-item');
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add('keyboard-focus');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('keyboard-focus');
            }
        });
    }

    applySearchSelection(item) {
        EventBus.emit('PLAY_SOUND', 'click');
        this.els.searchInput.value = item.title;
        if (this.els.searchHotkey) this.els.searchHotkey.style.display = 'none';
        
        this.executeSearch(item.title);
    }

    toggleSuggestions(isOpen) {
        this.els.suggestionsBox.classList.toggle('active', isOpen);
        this.els.searchModule.classList.toggle('suggestions-open', isOpen);
        if (!isOpen) this.selectedIndex = -1; 
    }

    toggleLoading(isLoading) {
        if (!this.els.searchIcon || !this.els.searchLoading) return;
        this.els.searchIcon.style.display = isLoading ? 'none' : 'flex';
        this.els.searchLoading.style.display = isLoading ? 'flex' : 'none';
    }

    renderSuggestions(matches) {
        if (matches.length === 0) {
            this.els.suggestionsBox.innerHTML = '<div class="suggestion-empty"><i class="fas fa-search"></i>Совпадений не найдено</div>';
        } else {
            this.els.suggestionsBox.innerHTML = matches.map((item, idx) => {
                const img = item.image || (item.images ? item.images[0] : '') || 'https://via.placeholder.com/45x65?text=NO+IMG';
                return `
                    <div class="suggestion-item" data-index="${idx}">
                        <div class="sugg-left">
                            <div class="sugg-thumb-wrapper">
                                <img src="${optimizeImageUrl(img, 100, 70)}" class="sugg-thumb">
                            </div>
                            <span class="sugg-title">${item.title}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        this.toggleSuggestions(true);
    }

    syncUIWithState() {
        const state = AppStore.getState().media;
        
        if (this.els.typeSwitcher) {
            this.els.typeSwitcher.classList.toggle('movies-active', state.type === 'movies');
        }
        this.els.typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === state.type));
        
        this.els.sortBtns.forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            if (btn.dataset.sort === state.sort) {
                if (!btn.classList.contains('active')) btn.classList.add('active');
                
                let newIconClass = btn.dataset.sort === 'name' 
                    ? (state.sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up')
                    : (state.sortDirection === 'desc' ? 'fas fa-sort-numeric-down-alt' : 'fas fa-sort-numeric-up-alt');
                
                if (icon && !icon.className.includes(newIconClass)) {
                    icon.className = `${newIconClass} sort-icon`;
                }
            } else {
                btn.classList.remove('active');
                if (icon) icon.className = btn.dataset.sort === 'name' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-star sort-icon';
            }
        });

        let statusesOrder = state.type === 'games' 
            ? ['completed', 'playing', 'on-hold', 'dropped']
            : ['watched', 'watching', 'on-hold', 'dropped'];
        
        const isActive = (val) => state.filters.includes(val) ? 'active' : '';

        this.els.statusFilters.innerHTML = statusesOrder.map(s => `
            <div class="filter-chip is-status status-${s} ${isActive(s)}" data-filter="${s}">
                ${STATUS_MAP[s] || s}
            </div>
        `).join('');

        this.els.statusFilters.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                const val = chip.dataset.filter;
                const currentFilters = AppStore.getState().media.filters;
                const newFilters = currentFilters.includes(val) ? [] : [val];
                AppRouter.updateQuery({ filters: newFilters.length ? newFilters.join(',') : null });
            });
        });
    }

    renderGrid() {
        const storeData = AppStore.getState().data;
        if (!storeData.isMediaLoaded) {
            this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:var(--color-neon-pink); font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
            this.els.counter.textContent = '0';
            return;
        }

        const state = AppStore.getState().media;
        const isAllSelected = state.filters.length === 0;
        
        let allFilteredData = storeData.media.filter(item => {
            if (item.type !== state.type) return false;
            if (item.format === 'youtube') return false; 
            if (!isAllSelected && !state.filters.includes(item.status)) return false;

            if (this.localSearchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => { textToSearch += ` ${sub.title || ''} ${sub.description || ''}`; });
                }
                const score = SearchEngine.scoreItemForGrid(textToSearch, item.title, this.localSearchQuery);
                if (score === 0) return false;
                item._matchScore = score;
            }

            return true;
        });

        let mainData = allFilteredData.filter(i => i.status !== 'suggested');
        let suggData = allFilteredData.filter(i => i.status === 'suggested');

        const dir = state.sortDirection === 'asc' ? 1 : -1;
        const sortFn = (a, b) => {
            if (this.localSearchQuery.length > 0 && Math.abs((a._matchScore||0) - (b._matchScore||0)) > 0.1) {
                return (b._matchScore||0) - (a._matchScore||0);
            }
            if (state.sort === 'rating') {
                return ((a.rating || 0) - (b.rating || 0)) * dir;
            }
            return (a.title || "").localeCompare(b.title || "") * dir;
        };

        mainData.sort(sortFn);
        suggData.sort(sortFn);

        this.els.counter.textContent = mainData.length + suggData.length;

        if (mainData.length === 0 && suggData.length === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:#666; font-family:\'Exo 2\'; font-size:1.2rem;">ПО ВАШИМ ПАРАМЕТРАМ НИЧЕГО НЕ НАЙДЕНО</div>';
            return;
        }

        let htmlBuf = '';
        let globalIndex = 0;

        mainData.forEach((item) => {
            htmlBuf += this.factory.createCardHTML(item, (globalIndex % 15) * 20);
            globalIndex++;
        });

        if (suggData.length > 0) {
            htmlBuf += this.factory.createCardHTML({ isDivider: true, title: 'ПРЕДЛОЖЕНИЯ АГЕНТОВ' }, 0);
            suggData.forEach((item) => {
                htmlBuf += this.factory.createCardHTML(item, (globalIndex % 15) * 20);
                globalIndex++;
            });
        }
        
        this.els.gridMain.innerHTML = htmlBuf;

        this.els.gridMain.querySelectorAll('.archive-card-container:not(.archive-divider-row):not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });
    }
}