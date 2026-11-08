/* js/library-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { CardFactory } from './archive/CardFactory.js';
import { LazyLoader } from './archive/LazyLoader.js';
import { SearchEngine } from './services/SearchEngine.js';
import { optimizeImageUrl } from './utils.js';

const TAB_COLORS = {
    'completed': '#39ff14',
    'playing': '#00ccff',
    'on-hold': '#ffd700',
    'dropped': '#ff4444',
    'suggested': '#ff2d95'
};

export class LibraryController {
    constructor() {
        this.container = document.getElementById('route-library');
        if (!this.container) return;

        this.els = {
            pageWrapper: document.getElementById('library-page'),
            backBtn: document.getElementById('btn-library-back'),
            gridMain: document.getElementById('library-grid-main'),
            
            sortBtns: document.querySelectorAll('#library-sort-switcher .sort-btn'),
            typeBtns: document.querySelectorAll('#library-type-switcher .switcher-btn'),
            typeSwitcher: document.getElementById('library-type-switcher'),
            
            btnDetailed: document.getElementById('lib-grid-detailed'),
            btnCompact: document.getElementById('lib-grid-compact'),
            
            tabs: document.querySelectorAll('.lib-tab-btn'),
            
            // Labels for dynamic text (Games vs Movies)
            labelCompleted: document.getElementById('label-completed'),
            labelPlaying: document.getElementById('label-playing'),
            
            searchModule: document.getElementById('lib-search-module'),
            searchInput: document.getElementById('lib-search-input'),
            searchIcon: document.getElementById('lib-search-icon'),
            searchLoading: document.getElementById('lib-search-loading'),
            searchHotkey: document.getElementById('lib-search-hotkey'),
            suggestionsBox: document.getElementById('lib-search-suggestions')
        };

        this.gridMode = 'detailed'; 
        this.localSearchQuery = '';
        // ВАЖНО: По умолчанию всегда открываем "Пройдено"
        this.activeTab = 'completed'; 
        
        this.searchDebounce = null;
        this.currentSearchMatches = [];
        this.selectedIndex = -1;

        this.factory = new CardFactory(() => this.gridMode);
        this.lazyLoader = new LazyLoader(() => this.gridMode);

        this.bindEvents();
    }

    mount() {
        console.log('📚 [Library] Компонент смонтирован');
        
        const query = AppStore.getState().route.query;
        this.localSearchQuery = query.search || '';
        this.els.searchInput.value = this.localSearchQuery;
        
        // Считываем вкладку из URL, иначе 'completed'
        this.activeTab = query.tab || 'completed';

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
            AppRouter.navigate('/', {});
        });

        // ПЕРЕКЛЮЧЕНИЕ 5 ВКЛАДОК СТАТУСА
        this.els.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                if (this.activeTab !== targetTab) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    AppRouter.updateQuery({ tab: targetTab });
                }
            });
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
                    // При смене типа (игры/кино) сбрасываем поиск
                    delete currentQuery.search; 
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
                AppRouter.navigate('/item', { id: item.id }, { from: 'library', tab: this.activeTab });
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
                const currentTab = state.route.query.tab || 'completed';
                
                if (
                    curr.type !== prev?.type || 
                    curr.sort !== prev?.sort ||
                    curr.sortDirection !== prev?.sortDirection ||
                    this.activeTab !== currentTab
                ) {
                    this.activeTab = currentTab;
                    this.syncUIWithState();
                    this.renderGrid();
                }
                
                const currentSearch = state.route.query.search || '';
                if (currentSearch !== this.localSearchQuery) {
                    this.localSearchQuery = currentSearch;
                    this.els.searchInput.value = this.localSearchQuery;
                    this.renderGrid();
                }
            }
        });

        EventBus.on('MEDIA_STORE_LOADING', () => {
            if (AppStore.getState().route.path.startsWith('/library')) {
                this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:var(--color-neon-pink); font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
            }
        });

        EventBus.on('MEDIA_STORE_LOADED', () => {
            if (AppStore.getState().route.path.startsWith('/library')) {
                this.syncUIWithState(); // Чтобы обновились каунтеры
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
                
                // ВАЖНО: Ищем только среди тех, что соответствуют текущей активной вкладке
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => {
                        if (sub.status === this.activeTab || (this.activeTab === 'suggested' && sub.status === 'suggested')) {
                            flattenedList.push({ ...sub, status: sub.status || item.status });
                        }
                    });
                } else if (item.status === this.activeTab || (this.activeTab === 'suggested' && item.status === 'suggested')) {
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
        const mediaData = AppStore.getState().data.media || [];
        
        // 1. Обновляем типы и лейблы
        if (this.els.typeSwitcher) {
            this.els.typeSwitcher.classList.toggle('movies-active', state.type === 'movies');
        }
        this.els.typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === state.type));
        
        if (this.els.labelCompleted && this.els.labelPlaying) {
            this.els.labelCompleted.textContent = state.type === 'movies' ? 'ПОСМОТРЕНО' : 'ПРОЙДЕНО';
            this.els.labelPlaying.textContent = state.type === 'movies' ? 'СМОТРИМ' : 'В ПРОЦЕССЕ';
        }

        // 2. Обновляем иконки сортировки
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

        // 3. Подсчитываем каунтеры для вкладок
        const counts = { completed: 0, playing: 0, 'on-hold': 0, dropped: 0, suggested: 0 };
        
        mediaData.forEach(item => {
            if (item.type !== state.type || item.format === 'youtube') return;

            if (item.format === 'collection' && item.items) {
                item.items.forEach(sub => {
                    const subStatus = sub.status || item.status;
                    if (counts[subStatus] !== undefined) counts[subStatus]++;
                    // Считаем предложку внутри паков
                    if (subStatus === 'suggested') counts.suggested++; 
                });
            } else {
                if (counts[item.status] !== undefined) counts[item.status]++;
            }
        });

        // 4. Обновляем табы (цвета и активный класс)
        this.els.tabs.forEach(tab => {
            const tabName = tab.dataset.tab;
            tab.classList.toggle('active', tabName === this.activeTab);
            
            const countEl = document.getElementById(`count-${tabName}`);
            if (countEl) countEl.textContent = counts[tabName] || 0;
        });

        // Красим всю страницу под цвет вкладки
        const currentColor = TAB_COLORS[this.activeTab] || TAB_COLORS['completed'];
        this.els.pageWrapper.style.setProperty('--active-tab-color', currentColor);
    }

    renderGrid() {
        const storeData = AppStore.getState().data;
        if (!storeData.isMediaLoaded) {
            this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:var(--color-neon-pink); font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
            return;
        }

        const state = AppStore.getState().media;
        
        // МАГИЯ РАСЩЕПЛЕНИЯ ПАКОВ
        let gridData = [];

        storeData.media.forEach(item => {
            if (item.type !== state.type || item.format === 'youtube') return;

            let matchScore = 1;
            if (this.localSearchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => { textToSearch += ` ${sub.title || ''} ${sub.description || ''}`; });
                }
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, this.localSearchQuery);
            }

            if (this.localSearchQuery.length > 0 && matchScore === 0) return; // Не прошел поиск

            if (item.format === 'collection' && item.items) {
                // Фильтруем элементы внутри пака по ТЕКУЩЕЙ вкладке
                const matchingItems = item.items.filter(sub => (sub.status || item.status) === this.activeTab);
                
                if (matchingItems.length > 0) {
                    // Создаем ВИРТУАЛЬНЫЙ ПАК для этой вкладки
                    const virtualCollection = {
                        ...item,
                        items: matchingItems,
                        // Обложкой пака становится обложка ПЕРВОЙ подходящей игры
                        image: matchingItems[0].image || item.image,
                        images: matchingItems.slice(0, 3).map(i => i.image).filter(Boolean),
                        customColor: matchingItems[0].customColor || item.customColor,
                        _matchScore: matchScore
                    };
                    
                    // Пересчитываем stackColors для корректного отображения 3D-слоев
                    virtualCollection.stackColors = [
                        virtualCollection.customColor || '#444455',
                        (matchingItems[1] && matchingItems[1].customColor) ? matchingItems[1].customColor : (virtualCollection.customColor || '#444455'),
                        (matchingItems[2] && matchingItems[2].customColor) ? matchingItems[2].customColor : (virtualCollection.customColor || '#444455')
                    ];

                    gridData.push(virtualCollection);
                }
            } else if (item.status === this.activeTab) {
                gridData.push({ ...item, _matchScore: matchScore });
            }
        });

        // Сортировка
        const dir = state.sortDirection === 'asc' ? 1 : -1;
        gridData.sort((a, b) => {
            if (this.localSearchQuery.length > 0 && Math.abs((a._matchScore||0) - (b._matchScore||0)) > 0.1) {
                return (b._matchScore||0) - (a._matchScore||0);
            }
            if (state.sort === 'rating') {
                return ((a.rating || 0) - (b.rating || 0)) * dir;
            }
            return (a.title || "").localeCompare(b.title || "") * dir;
        });

        if (gridData.length === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:#666; font-family:\'Exo 2\'; font-size:1.2rem;">КАТЕГОРИЯ ПУСТА</div>';
            return;
        }

        let htmlBuf = '';
        gridData.forEach((item, index) => {
            htmlBuf += this.factory.createCardHTML(item, (index % 15) * 20);
        });
        
        this.els.gridMain.innerHTML = htmlBuf;

        this.els.gridMain.querySelectorAll('.archive-card-container:not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });
    }
}