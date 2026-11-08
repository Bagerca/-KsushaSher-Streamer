/* js/archive/FilterController.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';

export class FilterController {
    constructor(gridManager) {
        this.gridManager = gridManager; 
        
        const archiveSection = document.getElementById('media-archive');

        this.els = {
            typeSwitcher: archiveSection.querySelector('.type-switcher'),
            typeBtns: archiveSection.querySelectorAll('.switcher-btn'),
            sortBtns: archiveSection.querySelectorAll('.sort-btn'),
            densityBtns: archiveSection.querySelectorAll('.density-btn')
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
                curr.sort !== prev?.sort ||
                curr.sortDirection !== prev?.sortDirection
            ) {
                this.syncUIWithState();
            }
        });

        this.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (AppStore.getState().media.type !== type) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    
                    const currentQuery = { ...AppStore.getState().route.query };
                    AppRouter.navigate('/archive', { type }, currentQuery);
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

        this.els.densityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (AppStore.getState().media.gridMode !== mode) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    AppRouter.updateQuery({ mode });
                }
            });
        });
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
                if (icon) icon.className = btn.dataset.sort === 'name' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-sort-numeric-down-alt sort-icon';
            }
        });
    }
}