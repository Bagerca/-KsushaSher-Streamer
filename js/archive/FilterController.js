/* js/archive/FilterController.js */
import EventBus from '../event-bus.js';
import { GENRE_MAP, STATUS_MAP } from '../media-store.js';

export class FilterController {
    constructor(store, gridManager) {
        this.store = store;
        this.gridManager = gridManager; 

        this.els = {
            statusFilters: document.getElementById('archive-filters-status'),
            genreFilters: document.getElementById('archive-filters-genre'),
            typeSwitcher: document.querySelector('.type-switcher'),
            typeBtns: document.querySelectorAll('.switcher-btn'),
            sortBtns: document.querySelectorAll('.sort-btn'),
            densityBtns: document.querySelectorAll('.density-btn'),
            
            toggleGenresBtn: document.getElementById('toggle-genres-btn'),
            genresAccordion: document.getElementById('genres-accordion'),
            genreCountBadge: document.getElementById('genre-count'),
            clearFiltersBtn: document.getElementById('clear-filters-btn')
        };

        this.bindEvents();
    }

    bindEvents() {
        EventBus.on('MEDIA_STORE_LOADED', () => this.updateUI());
        EventBus.on('MEDIA_STORE_UPDATED', () => this.updateUI());

        // Переключатель типа (Игры/Кино)
        this.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (this.store.currentType !== type) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    this.gridManager.setSwitchingState(true);
                    setTimeout(() => this.store.loadType(type), 400);
                }
            });
        });

        // Сортировка
        this.els.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.store.setSort(btn.dataset.sort);
                this.animateSortIcon(btn);
            });
        });

        // Плотность сетки
        this.els.densityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (this.gridManager.gridMode !== mode) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    this.gridManager.setGridMode(mode);
                    this.els.densityBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // Аккордеон жанров
        if (this.els.toggleGenresBtn && this.els.genresAccordion) {
            this.els.toggleGenresBtn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'expand');
                this.els.genresAccordion.classList.toggle('expanded');
                this.els.toggleGenresBtn.classList.toggle('active');
            });
        }

        // Кнопка сброса фильтров
        if (this.els.clearFiltersBtn) {
            this.els.clearFiltersBtn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.store.activeFilters.clear();
                
                // Очищаем поиск тоже
                const searchInput = document.getElementById('archive-search');
                if (searchInput) searchInput.value = '';
                this.store.searchQuery = '';
                
                this.store.processData();
                EventBus.emit('MEDIA_STORE_UPDATED');
            });
        }
    }

    updateUI() {
        this.gridManager.setSwitchingState(false);
        if (this.els.typeSwitcher) {
            this.els.typeSwitcher.classList.toggle('movies-active', this.store.currentType === 'movies');
        }
        this.els.typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === this.store.currentType));
        this.renderChips();
    }

    renderChips() {
        if (!this.els.statusFilters || !this.els.genreFilters) return;

        let statusesOrder = this.store.currentType === 'games' 
            ? ['completed', 'playing', 'suggested', 'on-hold', 'dropped']
            : ['watched', 'watching', 'suggested', 'on-hold', 'dropped'];
        
        const isActive = (val) => this.store.activeFilters.has(val) ? 'active' : '';

        // Отрисовка статусов
        this.els.statusFilters.innerHTML = statusesOrder.map(s => `
            <div class="filter-chip is-status ${s === 'suggested' ? 'status-suggested' : `status-${s}`} ${isActive(s)}" data-filter="${s}">
                ${STATUS_MAP[s] || s}
            </div>
        `).join('');

        // Отрисовка жанров
        this.els.genreFilters.innerHTML = this.store.getAllGenres().map(g => `
            <div class="filter-chip genre-chip ${isActive(g)}" data-filter="${g}">${GENRE_MAP[g] || g}</div>
        `).join('');

        // Добавляем листенеры на чипы
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.store.toggleFilter(chip.dataset.filter);
            });
        });

        // Подсчет активных жанров для бейджа
        const activeGenresCount = Array.from(this.store.activeFilters).filter(f => !Object.keys(STATUS_MAP).includes(f)).length;
        
        if (this.els.genreCountBadge) {
            this.els.genreCountBadge.textContent = activeGenresCount;
            if (activeGenresCount > 0) {
                this.els.genreCountBadge.classList.remove('hidden');
                this.els.toggleGenresBtn.classList.add('has-filters');
            } else {
                this.els.genreCountBadge.classList.add('hidden');
                this.els.toggleGenresBtn.classList.remove('has-filters');
            }
        }

        // Показ/Скрытие кнопки сброса фильтров
        if (this.els.clearFiltersBtn) {
            if (this.store.activeFilters.size > 0 || this.store.searchQuery.length > 0) {
                this.els.clearFiltersBtn.classList.remove('hidden');
            } else {
                this.els.clearFiltersBtn.classList.add('hidden');
            }
        }
    }

    animateSortIcon(clickedBtn) {
        this.els.sortBtns.forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            if (btn !== clickedBtn) {
                btn.classList.remove('active');
                if (icon) icon.className = btn.dataset.sort === 'name' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-star sort-icon';
            } else {
                btn.classList.add('active');
                let newIconClass = btn.dataset.sort === 'name' 
                    ? (this.store.sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up')
                    : (this.store.sortDirection === 'desc' ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up');
                
                // Если рейтинг, используем другие иконки
                if (btn.dataset.sort === 'rating') {
                    newIconClass = this.store.sortDirection === 'desc' ? 'fas fa-sort-numeric-down-alt' : 'fas fa-sort-numeric-up-alt';
                }
                
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
}