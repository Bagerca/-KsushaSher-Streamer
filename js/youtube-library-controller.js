/* js/youtube-library-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { CardFactory } from './archive/CardFactory.js';
import { LazyLoader } from './archive/LazyLoader.js';
import { SearchEngine } from './services/SearchEngine.js';
import { optimizeImageUrl } from './utils.js';

export class YoutubeLibraryController {
    constructor() {
        this.container = document.getElementById('route-youtube');
        if (!this.container) return;

        this.els = {
            backBtn: document.getElementById('btn-yt-library-back'),
            gridMain: document.getElementById('yt-library-grid-main'),
            counter: document.querySelector('.yt-lib-counter-val'),
            searchModule: document.getElementById('yt-lib-search-module'),
            searchInput: document.getElementById('yt-lib-search-input'),
            searchIcon: document.getElementById('yt-lib-search-icon'),
            searchLoading: document.getElementById('yt-lib-search-loading'),
            searchHotkey: document.getElementById('yt-lib-search-hotkey'),
            suggestionsBox: document.getElementById('yt-lib-search-suggestions')
        };

        this.localSearchQuery = '';
        this.searchDebounce = null;
        this.currentSearchMatches = [];
        this.selectedIndex = -1;

        this.factory = new CardFactory(() => 'detailed');
        this.lazyLoader = new LazyLoader(() => 'detailed');

        this.bindEvents();
    }

    mount() {
        console.log('📺 [YoutubeLibrary] Компонент смонтирован');
        this.localSearchQuery = AppStore.getState().route.query.search || '';
        this.els.searchInput.value = this.localSearchQuery;
        this.toggleSuggestions(false);
        this.renderGrid();
    }

    unmount() {
        console.log('📺 [YoutubeLibrary] Компонент размонтирован');
    }

    bindEvents() {
        this.els.backBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            AppRouter.navigate('/');
        });

        this.els.gridMain.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card) return;
            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) return;
            const item = state.data.media.find(i => i.id === card.dataset.id);
            if (item) {
                EventBus.emit('PLAY_SOUND', 'expand');
                // ИСПРАВЛЕНИЕ: Добавляем метку откуда пришли
                AppRouter.navigate('/item', { id: item.id }, { from: 'youtube' });
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
                if (AppStore.getState().route.path.startsWith('/youtube')) {
                    e.preventDefault();
                    this.els.searchInput.focus();
                }
            }
        });

        AppStore.subscribe((state, prevState) => {
            if (state.route.path.startsWith('/youtube')) {
                const currentSearch = state.route.query.search || '';
                const prevSearch = prevState?.route?.query?.search || '';
                
                if (currentSearch !== prevSearch) {
                    this.localSearchQuery = currentSearch;
                    this.els.searchInput.value = this.localSearchQuery;
                    this.renderGrid();
                }
            }
        });

        EventBus.on('MEDIA_STORE_LOADED', () => {
            if (AppStore.getState().route.path.startsWith('/youtube')) {
                this.renderGrid();
            }
        });

        this.els.gridMain.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card) return;
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

            const youtubeList = state.data.media.filter(item => item.format === 'youtube');

            let matches = youtubeList.map(item => {
                const textToSearch = `${item.title || ''} ${item.description || ''}`;
                return {
                    ...item,
                    score: SearchEngine.scoreItemForSuggestions(textToSearch, query)
                };
            }).filter(item => item.score > 10);

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
                const img = item.image || (item.images ? item.images[0] : '') || 'https://via.placeholder.com/160x90?text=NO+IMG';
                return `
                    <div class="suggestion-item" data-index="${idx}">
                        <div class="sugg-left">
                            <div class="sugg-thumb-wrapper is-youtube">
                                <img src="${optimizeImageUrl(img, 160, 70)}" class="sugg-thumb">
                            </div>
                            <span class="sugg-title">${item.title}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        this.toggleSuggestions(true);
    }

    renderGrid() {
        const storeData = AppStore.getState().data;
        if (!storeData.isMediaLoaded) {
            this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:#ff0000; font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
            this.els.counter.textContent = '0';
            return;
        }

        let ytData = storeData.media.filter(item => item.format === 'youtube');

        if (this.localSearchQuery.length > 0) {
            ytData = ytData.filter(item => {
                const textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                const score = SearchEngine.scoreItemForGrid(textToSearch, item.title, this.localSearchQuery);
                if (score > 0) {
                    item._matchScore = score;
                    return true;
                }
                return false;
            });
            ytData.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
        }

        this.els.counter.textContent = ytData.length;

        if (ytData.length === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:#666; font-family:\'Exo 2\'; font-size:1.2rem;">ПО ВАШИМ ПАРАМЕТРАМ НИЧЕГО НЕ НАЙДЕНО</div>';
            return;
        }

        let htmlBuf = '';
        ytData.forEach((item, index) => {
            htmlBuf += this.factory.createCardHTML(item, (index % 10) * 20);
        });
        
        this.els.gridMain.innerHTML = htmlBuf;

        this.els.gridMain.querySelectorAll('.archive-card-container:not(.archive-divider-row):not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });
    }
}