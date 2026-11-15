/* js/archive/FilterController.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { navigateArchive, navigateArchiveType, buildLibraryHref, isArchiveRoute } from './archive-url.js';

/**
 * Панель управления архивом. Ни один контрол не мутирует Store напрямую:
 * клик меняет адрес, роутер обновляет Store, UI синхронизируется подпиской.
 */
export class FilterController {
    constructor(gridManager) {
        this.gridManager = gridManager;
        const section = document.getElementById('media-archive');
        if (!section) {
            console.error('🚨 [Archive] Секция архива не найдена.');
            return;
        }

        this.els = {
            section,
            typeSwitcher: section.querySelector('.type-switcher'),
            typeBtns: section.querySelectorAll('.switcher-btn'),
            sortBtns: section.querySelectorAll('.sort-btn'),
            densityBtns: section.querySelectorAll('.density-btn'),
            libraryLink: section.querySelector('.library-open-btn')
        };

        this.bindEvents();
        this.syncUIWithState();
        console.log('🎛️ [Archive] FilterController инициализирован (URL-first)');
    }

    bindEvents() {
        AppStore.subscribe((state, prevState) => {
            const curr = state.media;
            const prev = (prevState && prevState.media) || {};
            if (
                curr.type !== prev.type ||
                curr.gridMode !== prev.gridMode ||
                curr.searchQuery !== prev.searchQuery ||
                curr.sort !== prev.sort ||
                curr.sortDirection !== prev.sortDirection
            ) {
                this.syncUIWithState();
            }
        });

        this.els.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (AppStore.getState().media.type === type) return;
                EventBus.emit('PLAY_SOUND', 'click');
                navigateArchiveType(type);
            });
        });

        this.els.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                const media = AppStore.getState().media;
                const nextDir = media.sort === btn.dataset.sort
                    ? (media.sortDirection === 'asc' ? 'desc' : 'asc')
                    : (btn.dataset.sort === 'rating' ? 'desc' : 'asc');
                // Новый порядок — новая нумерация страниц.
                navigateArchive({ sort: btn.dataset.sort, sortDir: nextDir, page: null });
            });
        });

        this.els.densityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (AppStore.getState().media.gridMode === mode) return;
                EventBus.emit('PLAY_SOUND', 'click');
                navigateArchive({ mode, page: null });
            });
        });

        if (this.els.libraryLink) {
            //_href мог быть кликнут до первой синхронизации — страхуемся на лету.
            this.els.libraryLink.addEventListener('click', () => {
                this.els.libraryLink.href = buildLibraryHref();
            });
        }
    }

    syncUIWithState() {
        const media = AppStore.getState().media;

        if (this.els.typeSwitcher) {
            this.els.typeSwitcher.classList.toggle('movies-active', media.type === 'movies');
        }
        this.els.typeBtns.forEach(btn => {
            const active = btn.dataset.type === media.type;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        this.els.densityBtns.forEach(btn => {
            const active = btn.dataset.mode === media.gridMode;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        this.els.sortBtns.forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            const isActive = btn.dataset.sort === media.sort;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

            if (isActive) {
                const nextClass = btn.dataset.sort === 'name'
                    ? (media.sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up')
                    : (media.sortDirection === 'desc' ? 'fas fa-sort-numeric-down-alt' : 'fas fa-sort-numeric-up-alt');
                if (icon && !icon.className.includes(nextClass)) {
                    icon.classList.add('flipping');
                    setTimeout(() => {
                        icon.className = `${nextClass} sort-icon flipping`;
                        requestAnimationFrame(() => icon.classList.remove('flipping'));
                    }, 150);
                }
                btn.title = btn.dataset.sort === 'name'
                    ? `По алфавиту (${media.sortDirection === 'asc' ? 'А→Я' : 'Я→А'})`
                    : `По рейтингу (${media.sortDirection === 'desc' ? 'убыв.' : 'возр.'})`;
            } else if (icon) {
                icon.className = btn.dataset.sort === 'name'
                    ? 'fas fa-sort-alpha-down sort-icon'
                    : 'fas fa-sort-numeric-down-alt sort-icon';
            }
        });

        if (this.els.libraryLink && isArchiveRoute(AppStore.getState().route.path)) {
            this.els.libraryLink.href = buildLibraryHref();
        }
    }
}