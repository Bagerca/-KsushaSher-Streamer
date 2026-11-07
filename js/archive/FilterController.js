/* js/archive/FilterController.js */
import EventBus from '../event-bus.js';
import { STATUS_MAP } from '../media-store.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';

export class FilterController {
    constructor(gridManager) {
        this.gridManager = gridManager; 
        
        // ИСПРАВЛЕНИЕ: Изолируем поиск элементов СТРОГО внутри секции Архива, 
        // чтобы не ломать логику на других страницах (например, в Библиотеке).
        const archiveSection = document.getElementById('media-archive');

        this.els = {
            statusFilters: document.getElementById('archive-filters-status'),
            typeSwitcher: archiveSection.querySelector('.type-switcher'),
            typeBtns: archiveSection.querySelectorAll('.switcher-btn'),
            sortBtns: archiveSection.querySelectorAll('.sort-btn'),
            densityBtns: archiveSection.querySelectorAll('.density-btn'),
            clearFiltersBtn: document.getElementById('clear-filters-btn')
        };

        this.bindEvents();
        this.syncUIWithState(); 
    }

    bindEvents() {
        AppStore.subscribe((state, prevState) => {
            const curr = state.media;
            const prev = prevState?.media;
            
            if (
                curr.type !== prev?.type || 
                curr.gridMode !== prev?.gridMode || 
                curr.searchQuery !== prev?.searchQuery ||
                JSON.stringify(curr.filters) !== JSON.stringify(prev?.filters) ||
                curr.sort !== prev?.sort ||
                curr.sortDirection !== prev?.sortDirection
            ) {
                this.syncUIWithState();
            }
        });

        // 1. ПЕРЕКЛЮЧАТЕЛЬ ТИПА (Только для Архива)
        this.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (AppStore.getState().media.type !== type) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    
                    const currentQuery = { ...AppStore.getState().route.query };
                    delete currentQuery.filters; 

                    AppRouter.navigate('/archive', { type }, currentQuery);
                }
            });
        });

        // 2. СОРТИРОВКА
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

        // 3. ПЛОТНОСТЬ СЕТКИ
        this.els.densityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (AppStore.getState().media.gridMode !== mode) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    AppRouter.updateQuery({ mode });
                }
            });
        });

        // 4. СБРОС ФИЛЬТРОВ
        if (this.els.clearFiltersBtn) {
            this.els.clearFiltersBtn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                const searchInput = document.getElementById('archive-search');
                if (searchInput) searchInput.value = '';
                
                AppRouter.updateQuery({ filters: null, search: null });
            });
        }
    }

    syncUIWithState() {
        const state = AppStore.getState().media;
        
        if (this.els.typeSwitcher) {
            this.els.typeSwitcher.classList.toggle('movies-active', state.type === 'movies');
        }
        this.els.typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === state.type));
        
        this.els.densityBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === state.gridMode);
        });

        this.els.sortBtns.forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            if (btn.dataset.sort === state.sort) {
                if (!btn.classList.contains('active')) btn.classList.add('active');
                
                let newIconClass = btn.dataset.sort === 'name' 
                    ? (state.sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up')
                    : (state.sortDirection === 'desc' ? 'fas fa-sort-numeric-down-alt' : 'fas fa-sort-numeric-up-alt');
                
                if (icon && !icon.className.includes(newIconClass)) {
                    icon.classList.add('flipping');
                    setTimeout(() => {
                        icon.className = `${newIconClass} sort-icon flipping`;
                        requestAnimationFrame(() => icon.classList.remove('flipping'));
                    }, 150);
                }
            } else {
                btn.classList.remove('active');
                if (icon) icon.className = btn.dataset.sort === 'name' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-star sort-icon';
            }
        });

        this.renderChips();
    }

    renderChips() {
        if (!this.els.statusFilters) return;
        const state = AppStore.getState().media;

        let statusesOrder = state.type === 'games' 
            ? ['completed', 'playing', 'on-hold', 'dropped']
            : ['watched', 'watching', 'on-hold', 'dropped'];
        
        const isActive = (val) => state.filters.includes(val) ? 'active' : '';

        this.els.statusFilters.innerHTML = statusesOrder.map(s => `
            <div class="filter-chip is-status status-${s} ${isActive(s)}" data-filter="${s}">
                ${STATUS_MAP[s] || s}
            </div>
        `).join('');

        // ИСПРАВЛЕНИЕ: Вешаем обработчики только на фильтры ВНУТРИ архива
        this.els.statusFilters.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                const val = chip.dataset.filter;
                const currentFilters = AppStore.getState().media.filters;
                
                const newFilters = currentFilters.includes(val) ? [] : [val];
                AppRouter.updateQuery({ filters: newFilters.length ? newFilters.join(',') : null });
            });
        });

        if (this.els.clearFiltersBtn) {
            if (state.filters.length > 0 || state.searchQuery.length > 0) {
                this.els.clearFiltersBtn.classList.remove('hidden');
            } else {
                this.els.clearFiltersBtn.classList.add('hidden');
            }
        }
    }
}