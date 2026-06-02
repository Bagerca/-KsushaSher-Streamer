/* js/archive/FilterController.js */
import EventBus from '../event-bus.js';
import { GENRE_MAP, STATUS_MAP } from '../media-store.js';

export class FilterController {
    constructor(store, gridManager) {
        this.store = store;
        this.gridManager = gridManager; // Нужен для вызова перерисовки при смене плотности

        this.els = {
            statusFilters: document.getElementById('archive-filters-status'),
            genreFilters: document.getElementById('archive-filters-genre'),
            typeSwitcher: document.querySelector('.type-switcher'),
            typeBtns: document.querySelectorAll('.switcher-btn'),
            sortBtns: document.querySelectorAll('.sort-side-btn'),
            controlBar: document.querySelector('.header-control-bar')
        };

        this.initDensitySwitcher();
        this.bindEvents();
    }

    initDensitySwitcher() {
        if (!this.els.controlBar) return;
        const densitySwitcher = document.createElement('div');
        densitySwitcher.className = 'density-switcher';
        densitySwitcher.innerHTML = `
            <button class="density-btn active" data-mode="detailed" title="Подробная сетка"><i class="fas fa-th-large"></i></button>
            <button class="density-btn" data-mode="compact" title="Компактная сетка"><i class="fas fa-th"></i></button>
        `;
        this.els.controlBar.appendChild(densitySwitcher);

        densitySwitcher.querySelectorAll('.density-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (this.gridManager.gridMode !== mode) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    this.gridManager.setGridMode(mode);
                    densitySwitcher.querySelectorAll('.density-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
    }

    bindEvents() {
        EventBus.on('MEDIA_STORE_LOADED', () => this.updateUI());
        EventBus.on('MEDIA_STORE_UPDATED', () => this.updateUI());

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

        this.els.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.store.setSort(btn.dataset.sort);
                this.animateSortIcon(btn);
            });
        });
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

        this.els.statusFilters.innerHTML = statusesOrder.map(s => `
            <div class="filter-chip is-status ${s === 'suggested' ? 'status-suggested' : `status-${s}`} ${isActive(s)}" data-filter="${s}">
                ${STATUS_MAP[s] || s}
            </div>
        `).join('');

        this.els.genreFilters.innerHTML = this.store.getAllGenres().map(g => `
            <div class="filter-chip ${isActive(g)}" data-filter="${g}">${GENRE_MAP[g] || g}</div>
        `).join('');

        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.store.toggleFilter(chip.dataset.filter);
            });
        });
    }

    animateSortIcon(clickedBtn) {
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
}