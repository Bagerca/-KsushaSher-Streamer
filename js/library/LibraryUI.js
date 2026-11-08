/* js/library/LibraryUI.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';
import { TAB_COLORS, normalizeStatus } from './library-utils.js';

export class LibraryUI {
    constructor(ctrl) {
        this.ctrl = ctrl;
        this.bindEvents();
    }

    bindEvents() {
        this.ctrl.els.backBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            AppRouter.navigate('/', {});
        });

        this.ctrl.els.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                if (this.ctrl.activeTab !== targetTab) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    AppRouter.updateQuery({ tab: targetTab });
                }
            });
        });

        this.ctrl.els.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                const state = AppStore.getState().media;
                const newSortDir = state.sort === btn.dataset.sort 
                    ? (state.sortDirection === 'asc' ? 'desc' : 'asc') 
                    : (btn.dataset.sort === 'rating' ? 'desc' : 'asc');
                
                AppRouter.updateQuery({ sort: btn.dataset.sort, sortDir: newSortDir });
            });
        });

        this.ctrl.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (AppStore.getState().media.type !== type) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    const currentQuery = { ...AppStore.getState().route.query };
                    delete currentQuery.search; 
                    AppRouter.navigate('/library', { type }, currentQuery);
                }
            });
        });

        this.ctrl.els.btnDetailed.addEventListener('click', () => this.updateGridMode('detailed'));
        this.ctrl.els.btnCompact.addEventListener('click', () => this.updateGridMode('compact'));
    }

    updateGridMode(mode) {
        if (this.ctrl.gridMode === mode) return;
        EventBus.emit('PLAY_SOUND', 'click');
        this.ctrl.gridMode = mode;
        this.ctrl.els.btnDetailed.classList.toggle('active', mode === 'detailed');
        this.ctrl.els.btnCompact.classList.toggle('active', mode === 'compact');
        
        if (mode === 'compact') this.ctrl.els.gridMain.classList.add('compact-mode');
        else this.ctrl.els.gridMain.classList.remove('compact-mode');
        
        this.ctrl.els.gridMain.style.opacity = '0';
        setTimeout(() => { 
            this.ctrl.grid.renderGrid(); 
            this.ctrl.els.gridMain.style.opacity = '1'; 
        }, 200);
    }

    syncUIWithState() {
        const state = AppStore.getState().media;
        const mediaData = AppStore.getState().data.media || [];
        
        if (this.ctrl.els.typeSwitcher) {
            this.ctrl.els.typeSwitcher.classList.toggle('movies-active', state.type === 'movies');
        }
        this.ctrl.els.typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === state.type));
        
        if (this.ctrl.els.labelCompleted && this.ctrl.els.labelPlaying) {
            this.ctrl.els.labelCompleted.textContent = state.type === 'movies' ? 'ПОСМОТРЕНО' : 'ПРОЙДЕНО';
            this.ctrl.els.labelPlaying.textContent = state.type === 'movies' ? 'СМОТРИМ' : 'В ПРОЦЕССЕ';
        }

        this.ctrl.els.sortBtns.forEach(btn => {
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
                if (icon) icon.className = btn.dataset.sort === 'name' ? 'fas fa-sort-alpha-down sort-icon' : 'fas fa-sort-numeric-down-alt sort-icon';
            }
        });

        const counts = { completed: 0, playing: 0, 'on-hold': 0, dropped: 0, suggested: 0 };
        
        mediaData.forEach(item => {
            if (item.type !== state.type || item.format === 'youtube') return;

            if (item.format === 'collection' && item.items) {
                item.items.forEach(sub => {
                    const subStatus = normalizeStatus(sub.status || item.status);
                    if (counts[subStatus] !== undefined) counts[subStatus]++;
                });
            } else {
                const itemStatus = normalizeStatus(item.status);
                if (counts[itemStatus] !== undefined) counts[itemStatus]++;
            }
        });

        this.ctrl.els.tabs.forEach(tab => {
            const tabName = tab.dataset.tab;
            tab.classList.toggle('active', tabName === this.ctrl.activeTab);
            
            const countEl = document.getElementById(`count-${tabName}`);
            if (countEl) countEl.textContent = counts[tabName] || 0;
        });

        const currentColor = TAB_COLORS[this.ctrl.activeTab] || TAB_COLORS['completed'];
        this.ctrl.els.pageWrapper.style.setProperty('--active-tab-color', currentColor);
    }
}