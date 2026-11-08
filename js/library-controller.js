/* js/library-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { LibrarySearch } from './library/LibrarySearch.js';
import { LibraryUI } from './library/LibraryUI.js';
import { LibraryGrid } from './library/LibraryGrid.js';

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
        this.activeTab = 'completed'; 

        // Инициализация модулей
        this.search = new LibrarySearch(this);
        this.ui = new LibraryUI(this);
        this.grid = new LibraryGrid(this);

        this.bindEvents();
    }

    mount() {
        console.log('📚 [Library] Компонент смонтирован (Модульный)');
        
        const query = AppStore.getState().route.query;
        this.localSearchQuery = query.search || '';
        this.els.searchInput.value = this.localSearchQuery;
        this.activeTab = query.tab || 'completed';

        this.search.toggleSuggestions(false);
        this.ui.syncUIWithState();
        this.grid.renderGrid();
    }

    unmount() {
        console.log('📚 [Library] Компонент размонтирован');
    }

    bindEvents() {
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
                    this.ui.syncUIWithState();
                    this.grid.renderGrid();
                }
                
                const currentSearch = state.route.query.search || '';
                if (currentSearch !== this.localSearchQuery) {
                    this.localSearchQuery = currentSearch;
                    this.els.searchInput.value = this.localSearchQuery;
                    this.grid.renderGrid();
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
                this.ui.syncUIWithState(); 
                this.grid.renderGrid();
            }
        });
    }
}