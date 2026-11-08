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
            if (item) {
                EventBus.emit('PLAY_SOUND', 'expand');
                AppRouter.navigate('/item', { id: item.id }, { from: 'library', tab: this.ctrl.activeTab });
            }
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
        const storeData = AppStore.getState().data;
        if (!storeData.isMediaLoaded) {
            this.ctrl.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:var(--color-neon-pink); font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
            return;
        }

        const state = AppStore.getState().media;
        let gridData = [];

        storeData.media.forEach(item => {
            if (item.type !== state.type || item.format === 'youtube') return;

            let matchScore = 1;
            if (this.ctrl.localSearchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => { textToSearch += ` ${sub.title || ''} ${sub.description || ''}`; });
                }
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, this.ctrl.localSearchQuery);
            }

            if (this.ctrl.localSearchQuery.length > 0 && matchScore === 0) return; 

            if (item.format === 'collection' && item.items) {
                const matchingItems = item.items.filter(sub => normalizeStatus(sub.status || item.status) === this.ctrl.activeTab);
                
                if (matchingItems.length > 0) {
                    const virtualCollection = {
                        ...item,
                        status: matchingItems[0].status || item.status,
                        items: item.items, 
                        image: matchingItems[0].image || item.image,
                        images: matchingItems.slice(0, 3).map(i => i.image).filter(Boolean),
                        customColor: matchingItems[0].customColor || item.customColor,
                        _matchScore: matchScore
                    };
                    
                    virtualCollection.stackColors = [
                        virtualCollection.customColor || '#444455',
                        (matchingItems[1] && matchingItems[1].customColor) ? matchingItems[1].customColor : (virtualCollection.customColor || '#444455'),
                        (matchingItems[2] && matchingItems[2].customColor) ? matchingItems[2].customColor : (virtualCollection.customColor || '#444455')
                    ];

                    gridData.push(virtualCollection);
                }
            } else if (normalizeStatus(item.status) === this.ctrl.activeTab) {
                gridData.push({ ...item, _matchScore: matchScore });
            }
        });

        const dir = state.sortDirection === 'asc' ? 1 : -1;
        gridData.sort((a, b) => {
            if (this.ctrl.localSearchQuery.length > 0 && Math.abs((a._matchScore||0) - (b._matchScore||0)) > 0.1) {
                return (b._matchScore||0) - (a._matchScore||0);
            }
            if (state.sort === 'rating') {
                return ((a.rating || 0) - (b.rating || 0)) * dir;
            }
            return (a.title || "").localeCompare(b.title || "") * dir;
        });

        if (gridData.length === 0) {
            this.ctrl.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color:#666; font-family:\'Exo 2\'; font-size:1.2rem;">КАТЕГОРИЯ ПУСТА</div>';
            return;
        }

        let htmlBuf = '';
        gridData.forEach((item, index) => {
            htmlBuf += this.factory.createCardHTML(item, (index % 15) * 20);
        });
        
        this.ctrl.els.gridMain.innerHTML = htmlBuf;

        this.ctrl.els.gridMain.querySelectorAll('.archive-card-container:not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });
    }
}