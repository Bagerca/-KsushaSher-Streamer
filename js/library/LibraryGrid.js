/* js/library/LibraryGrid.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';
import { SearchEngine } from '../services/SearchEngine.js';
import { normalizeStatus } from './library-utils.js';
import { CardFactory } from '../archive/CardFactory.js';
import { LazyLoader } from '../archive/LazyLoader.js';

export class LibraryGrid {
    constructor(ctrl) {
        this.ctrl = ctrl;
        this.factory = new CardFactory(() => this.ctrl.gridMode);
        this.lazyLoader = new LazyLoader(() => this.ctrl.gridMode);
        this.bindEvents();
    }

    bindEvents() {
        this.ctrl.els.gridMain.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || card.classList.contains('archive-divider-row')) return;

            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) return;
            const item = state.data.media.find(i => i.id === card.dataset.id);
            if (!item) {
                console.warn(`⚠️ [Library] Карточка "${card.dataset.id}" отсутствует в базе.`);
                return;
            }

            EventBus.emit('PLAY_SOUND', 'expand');
            const query = { from: 'library', tab: this.ctrl.activeTab };

            // Коллекция открывается на части из активной вкладки.
            if (item.format === 'collection' && Array.isArray(item.items)) {
                const entry = item.items.find(sub => normalizeStatus(sub.status || item.status) === this.ctrl.activeTab);
                if (entry && entry.id) query.part = String(entry.id);
            }

            AppRouter.navigate('/item', { id: item.id }, query);
        });

        this.ctrl.els.gridMain.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.ctrl.gridMode === 'compact') return;
            card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]').forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl && !layer.style.backgroundImage) {
                    this.lazyLoader._safeImageLoad(bgUrl, card.classList.contains('is-youtube'), layer, null, null, layer);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }, true);
    }

    renderGrid() {
        const state = AppStore.getState();
        if (!state.data.isMediaLoaded) {
            this.ctrl.els.gridMain.innerHTML = '<div class="suggestion-empty" style="width:100%; padding:100px 20px; color: var(--color-neon-pink);"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
            return;
        }

        const media = state.media;
        const search = this.ctrl.localSearchQuery || '';
        const gridData = [];

        state.data.media.forEach(item => {
            if (item.type !== media.type || item.format === 'youtube') return;

            let matchScore = 1;
            if (search.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && Array.isArray(item.items)) {
                    item.items.forEach(sub => { textToSearch += ` ${sub.title || ''} ${sub.description || ''}`; });
                }
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, search);
                if (matchScore === 0) return;
            }

            if (item.format === 'collection' && Array.isArray(item.items)) {
                const matching = item.items.filter(sub => normalizeStatus(sub.status || item.status) === this.ctrl.activeTab);
                if (matching.length === 0) return;
                const virtual = {
                    ...item,
                    status: matching[0].status || item.status,
                    items: item.items,
                    image: matching[0].image || item.image,
                    images: matching.slice(0, 3).map(i => i.image).filter(Boolean),
                    customColor: matching[0].customColor || item.customColor,
                    _matchScore: matchScore
                };
                const base = virtual.customColor || 'var(--color-bg-medium)';
                virtual.stackColors = [
                    base,
                    (matching[1] && matching[1].customColor) || base,
                    (matching[2] && matching[2].customColor) || base
                ];
                gridData.push(virtual);
            } else if (normalizeStatus(item.status) === this.ctrl.activeTab) {
                gridData.push({ ...item, _matchScore: matchScore });
            }
        });

        const dir = media.sortDirection === 'asc' ? 1 : -1;
        gridData.sort((a, b) => {
            if (search.length > 0 && Math.abs((a._matchScore || 0) - (b._matchScore || 0)) > 0.1) {
                return (b._matchScore || 0) - (a._matchScore || 0);
            }
            if (media.sort === 'rating') return ((a.rating || 0) - (b.rating || 0)) * dir;
            return (a.title || '').localeCompare(b.title || '') * dir;
        });

        if (gridData.length === 0) {
            const message = search ? 'ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО' : 'КАТЕГОРИЯ ПУСТА';
            this.ctrl.els.gridMain.innerHTML = `<div class="suggestion-empty" style="width:100%; padding:100px 20px;"><i class="fas fa-folder-open"></i>${message}</div>`;
            return;
        }

        this.ctrl.els.gridMain.innerHTML = gridData
            .map((item, index) => this.factory.createCardHTML(item, (index % 15) * 20))
            .join('');

        this.ctrl.els.gridMain.querySelectorAll('.archive-card-container:not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });
    }
}