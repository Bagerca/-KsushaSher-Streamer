/* js/library/LibraryUI.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';
import { TAB_COLORS, normalizeStatus } from './library-utils.js';

/**
 * Шапка библиотеки: все переключатели пишут в адрес,
 * а подсветка читается из Store — рассинхрон невозможен.
 */
export class LibraryUI {
    constructor(ctrl) {
        this.ctrl = ctrl;
        this.bindEvents();
    }

    bindEvents() {
        this.ctrl.els.backBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            const home = AppRouter.getHomeTarget();
            AppRouter.navigate(home.path, home.params);
        });

        this.ctrl.els.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                if (this.ctrl.activeTab === target) return;
                EventBus.emit('PLAY_SOUND', 'click');
                AppRouter.updateQuery({ tab: target });
            });
        });

        this.ctrl.els.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                const media = AppStore.getState().media;
                const nextDir = media.sort === btn.dataset.sort
                    ? (media.sortDirection === 'asc' ? 'desc' : 'asc')
                    : (btn.dataset.sort === 'rating' ? 'desc' : 'asc');
                AppRouter.updateQuery({ sort: btn.dataset.sort, sortDir: nextDir });
            });
        });

        this.ctrl.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (AppStore.getState().media.type === type) return;
                EventBus.emit('PLAY_SOUND', 'click');
                const query = { ...AppStore.getState().route.query };
                // Поиск по играм бессмыслен в кино — сбрасываем, вкладку сохраняем.
                delete query.search;
                AppRouter.navigate('/library', { type }, query);
            });
        });

        if (this.ctrl.els.btnDetailed) {
            this.ctrl.els.btnDetailed.addEventListener('click', () => this.updateGridMode('detailed'));
        }
        if (this.ctrl.els.btnCompact) {
            this.ctrl.els.btnCompact.addEventListener('click', () => this.updateGridMode('compact'));
        }
    }

    updateGridMode(mode) {
        if (AppStore.getState().media.gridMode === mode) return;
        EventBus.emit('PLAY_SOUND', 'click');
        AppRouter.updateQuery({ mode });
    }

    syncUIWithState() {
        const state = AppStore.getState();
        const media = state.media;
        const mediaData = state.data.media || [];
        const els = this.ctrl.els;

        if (els.typeSwitcher) els.typeSwitcher.classList.toggle('movies-active', media.type === 'movies');
        els.typeBtns.forEach(btn => {
            const active = btn.dataset.type === media.type;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (els.labelCompleted && els.labelPlaying) {
            els.labelCompleted.textContent = media.type === 'movies' ? 'ПОСМОТРЕНО' : 'ПРОЙДЕНО';
            els.labelPlaying.textContent = media.type === 'movies' ? 'СМОТРИМ' : 'В ПРОЦЕССЕ';
        }

        els.sortBtns.forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            const active = btn.dataset.sort === media.sort;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            if (active) {
                const nextClass = btn.dataset.sort === 'name'
                    ? (media.sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up')
                    : (media.sortDirection === 'desc' ? 'fas fa-sort-numeric-down-alt' : 'fas fa-sort-numeric-up-alt');
                if (icon) icon.className = `${nextClass} sort-icon`;
            } else if (icon) {
                icon.className = btn.dataset.sort === 'name'
                    ? 'fas fa-sort-alpha-down sort-icon'
                    : 'fas fa-sort-numeric-down-alt sort-icon';
            }
        });

        const counts = { completed: 0, playing: 0, 'on-hold': 0, dropped: 0, suggested: 0 };
        mediaData.forEach(item => {
            if (item.type !== media.type || item.format === 'youtube') return;
            if (item.format === 'collection' && Array.isArray(item.items)) {
                item.items.forEach(sub => {
                    const status = normalizeStatus(sub.status || item.status);
                    if (counts[status] !== undefined) counts[status]++;
                });
            } else {
                const status = normalizeStatus(item.status);
                if (counts[status] !== undefined) counts[status]++;
            }
        });

        els.tabs.forEach(tab => {
            const name = tab.dataset.tab;
            const active = name === this.ctrl.activeTab;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-pressed', active ? 'true' : 'false');
            const countEl = document.getElementById(`count-${name}`);
            if (countEl) countEl.textContent = counts[name] || 0;
        });

        if (els.pageWrapper) {
            els.pageWrapper.style.setProperty('--active-tab-color', TAB_COLORS[this.ctrl.activeTab] || TAB_COLORS.completed);
        }
    }
}