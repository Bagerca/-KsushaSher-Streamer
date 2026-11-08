/* js/archive/GridManager.js */
import EventBus from '../event-bus.js';
import { AppRouter } from '../router.js';
import { AppStore } from '../store.js';
import { ArchivePagination } from './ArchivePagination.js';
import { SearchEngine } from '../services/SearchEngine.js';

export class GridManager {
    constructor(store, cardFactory, lazyLoader) {
        this.store = store;
        this.factory = cardFactory;
        this.lazyLoader = lazyLoader;

        this.els = {
            wrapper: document.getElementById('archive-grid-wrapper'),
            gridMain: document.getElementById('archive-grid-main')
        };

        this.currentPage = 1;
        this.stdPerPage = 12; 
        
        this.totalPages = 1;
        this.isAnimating = false; 
        this.animationSessionId = 0; 
        
        this.lastColsCount = 0;
        this.lastIsMobile = false;
        this.resizeDebounceTimer = null;
        
        this.pagination = new ArchivePagination({
            onPageChange: (val, isAbsolute = false) => {
                const targetPage = isAbsolute ? val : this.currentPage + val;
                this.goToPage(targetPage);
            }
        });

        this.gridMode = AppStore.getState().media.gridMode || 'detailed';
        if (this.gridMode === 'compact') {
            this.els.gridMain.classList.add('compact-mode');
        }

        this.bindEvents();
    }

    setGridMode(mode) {
        this.gridMode = mode;
        const action = mode === 'compact' ? 'add' : 'remove';
        this.els.gridMain.classList[action]('compact-mode');
        
        this.els.gridMain.style.opacity = '0';
        setTimeout(() => {
            this.renderGrid(false);
            this.els.gridMain.style.opacity = '1';
        }, 200);
    }

    getColumnsCount() {
        let gridWidth = this.els.gridMain.clientWidth;
        if (gridWidth === 0) {
            const containerMax = Math.min(window.innerWidth * 0.95, 1650);
            gridWidth = containerMax - 52 - 30; 
        }
        return this.gridMode === 'compact' 
            ? Math.max(1, Math.floor((gridWidth + 12) / (160 + 12)))
            : Math.max(1, Math.floor((gridWidth + 20) / (230 + 20)));
    }

    bindEvents() {
        EventBus.on('MEDIA_STORE_LOADING', async () => {
            this.isAnimating = true;
            this.animationSessionId++;
            this.els.gridMain.classList.remove('entering-from-bottom', 'entering-from-top');
            this.els.gridMain.classList.add('page-slide-up-out');
        });

        EventBus.on('MEDIA_STORE_LOADED', () => {
            this.currentPage = 1; 
            this.runEntrySequence('bottom');
        });

        EventBus.on('MEDIA_STORE_UPDATED', async () => {
            if (this.isAnimating) return; 
            
            this.isAnimating = true;
            this.animationSessionId++;
            const currentSession = this.animationSessionId;
            
            this.els.gridMain.classList.add('page-slide-down-out');
            
            await this.sleep(250);
            if (this.animationSessionId !== currentSession) return; 
            
            this.els.gridMain.classList.remove('page-slide-down-out');
            this.runEntrySequence('top');
        });

        EventBus.on('MEDIA_STORE_SILENT_UPDATE', () => {
            const allItems = this.store.combinedData || [];
            document.querySelectorAll('.archive-card-container').forEach(card => {
                const id = card.dataset.id;
                const itemData = allItems.find(i => i.id === id);
                if (itemData) {
                    const titleEl = card.querySelector('.card-title');
                    if (titleEl && titleEl.textContent !== itemData.title) {
                        titleEl.textContent = itemData.title;
                        titleEl.title = itemData.title;
                    }
                }
            });
        });

        AppStore.subscribe((state, prevState) => {
            if (state.media.gridMode !== prevState?.media?.gridMode) {
                this.setGridMode(state.media.gridMode);
            }
        });

        this.els.wrapper.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.isAnimating) return;

            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) return;
            
            const item = state.data.media.find(i => i.id === card.dataset.id);
            if (item) {
                EventBus.emit('PLAY_SOUND', 'expand');
                AppRouter.navigate('/item', { id: item.id }, { from: 'archive' });
            }
        });

        this.els.wrapper.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.gridMode === 'compact') return;

            card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]').forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl && !layer.style.backgroundImage) {
                    this.lazyLoader._safeImageLoad(bgUrl, false, layer, null, null, layer);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }, true);

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeDebounceTimer);
            this.resizeDebounceTimer = setTimeout(() => {
                const currentCols = this.getColumnsCount();
                const isMobile = window.innerWidth <= 600;
                
                if (this.lastColsCount !== currentCols || this.lastIsMobile !== isMobile) {
                    this.els.gridMain.style.minHeight = '0px';
                    this.renderGrid(false);
                }
            }, 300);
        });
    }

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async runEntrySequence(direction) {
        this.animationSessionId++;
        const currentSession = this.animationSessionId;
        this.isAnimating = true;

        this.els.gridMain.classList.remove('page-slide-up-out', 'page-slide-down-out');
        
        try { this.renderGrid(false); } 
        catch (e) { console.error("Ошибка рендера карточек:", e); }
        
        const entryClass = direction === 'bottom' ? 'entering-from-bottom' : 'entering-from-top';
        this.els.gridMain.classList.add(entryClass);

        await this.sleep(500);
        
        if (this.animationSessionId !== currentSession) return; 

        this.els.gridMain.classList.remove(entryClass);
        this.els.gridMain.querySelectorAll('.animate-entry').forEach(card => {
            card.classList.remove('animate-entry');
            card.style.animationDelay = '';
        });

        this.isAnimating = false;
        EventBus.emit('LAYOUT_CHANGED');
    }

    async goToPage(page) {
        if (this.isAnimating || page === this.currentPage || page < 1 || page > this.totalPages) return;
        
        this.pagination.closeSelector(); 
        const direction = page > this.currentPage ? 'up' : 'down';
        
        this.isAnimating = true;
        this.animationSessionId++;
        const currentSession = this.animationSessionId;

        const outClass = direction === 'up' ? 'page-slide-up-out' : 'page-slide-down-out';
        this.els.gridMain.classList.add(outClass);

        await this.sleep(250);
        if (this.animationSessionId !== currentSession) return;

        this.currentPage = page;
        this.runEntrySequence(direction === 'up' ? 'bottom' : 'top');
    }

    renderGrid(resetToFirstPage = false) {
        if (resetToFirstPage) this.currentPage = 1;

        this.lastColsCount = this.getColumnsCount();
        this.lastIsMobile = window.innerWidth <= 600;
        this.stdPerPage = this.lastIsMobile ? 6 : this.lastColsCount * 2; 

        const state = AppStore.getState().media;
        const allData = this.store.combinedData || [];
        const searchQuery = state.searchQuery || '';

        const categoryDefs = [
            { id: 'completed', match: ['completed', 'watched'] },
            { id: 'playing', match: ['playing', 'watching'] },
            { id: 'on-hold', match: ['on-hold'] },
            { id: 'dropped', match: ['dropped'] },
            { id: 'suggested', match: ['suggested'] }
        ];

        let buckets = { 'completed': [], 'playing': [], 'on-hold': [], 'dropped': [], 'suggested': [] };

        // 1. УМНОЕ РАСЩЕПЛЕНИЕ КОЛЛЕКЦИЙ И СКОРИНГ ПОИСКА
        allData.forEach(item => {
            if (item.type !== state.type || item.format === 'youtube') return;

            let matchScore = 1;
            if (searchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => { textToSearch += ` ${sub.title || ''} ${sub.description || ''}`; });
                }
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, searchQuery);
            }

            if (searchQuery.length > 0 && matchScore === 0) return;

            if (item.format === 'collection' && item.items) {
                categoryDefs.forEach(cat => {
                    const matchingItems = item.items.filter(sub => cat.match.includes(sub.status || item.status));
                    if (matchingItems.length > 0) {
                        const virtualCollection = {
                            ...item,
                            // ИСПРАВЛЕНИЕ: Берем правильный статус, а массив items оставляем целым для счетчика!
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
                        buckets[cat.id].push(virtualCollection);
                    }
                });
            } else {
                const itemStatus = item.status || 'unknown';
                const targetCat = categoryDefs.find(c => c.match.includes(itemStatus));
                if (targetCat) {
                    buckets[targetCat.id].push({ ...item, _matchScore: matchScore });
                }
            }
        });

        // 2. СОРТИРОВКА ВНУТРИ БАКЕТОВ И ПОДСЧЕТ СТРАНИЦ
        const dir = state.sortDirection === 'asc' ? 1 : -1;
        const sortFn = (a, b) => {
            if (searchQuery.length > 0 && Math.abs((a._matchScore||0) - (b._matchScore||0)) > 0.1) {
                return (b._matchScore||0) - (a._matchScore||0);
            }
            if (state.sort === 'rating') {
                return ((a.rating || 0) - (b.rating || 0)) * dir;
            }
            return (a.title || "").localeCompare(b.title || "") * dir;
        };

        let totalPages = 0;
        let bucketsMeta = [];

        categoryDefs.forEach(cat => {
            const arr = buckets[cat.id];
            arr.sort(sortFn);
            
            const pages = Math.ceil(arr.length / this.stdPerPage);
            bucketsMeta.push({
                id: cat.id,
                items: arr,
                pageCount: pages,
                startPage: totalPages + 1,
                endPage: totalPages + pages
            });
            totalPages += pages;
        });

        this.totalPages = totalPages;

        if (this.totalPages === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; text-align:center; padding:50px; color:#666; font-family:\'Exo 2\';">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
            this.pagination.render({ totalPages: 0 }); 
            return;
        }

        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        // 3. ОПРЕДЕЛЕНИЕ ТЕКУЩЕГО БАКЕТА
        let targetBucket = bucketsMeta.find(b => this.currentPage >= b.startPage && this.currentPage <= b.endPage);
        if (!targetBucket) targetBucket = bucketsMeta.find(b => b.pageCount > 0);

        const localPage = this.currentPage - targetBucket.startPage; 
        const startIdx = localPage * this.stdPerPage;
        const pageData = targetBucket.items.slice(startIdx, startIdx + this.stdPerPage);

        let mainHtmlBuf = '';
        pageData.forEach((item, index) => {
            mainHtmlBuf += this.factory.createCardHTML(item, index * 30);
        });
        
        this.els.gridMain.innerHTML = mainHtmlBuf;

        requestAnimationFrame(() => {
            if (this.lastIsMobile) {
                this.els.gridMain.style.minHeight = '0px'; 
            } else {
                const gap = this.gridMode === 'compact' ? 12 : 20;
                const cardWidth = this.gridMode === 'compact' ? 160 : 230;
                this.els.gridMain.style.minHeight = `${((cardWidth * 1.5) * 2) + gap}px`;
            }
            this.els.gridMain.style.alignContent = 'start';
        });

        this.els.gridMain.querySelectorAll('.archive-card-container:not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });

        this.pagination.render({
            totalPages: this.totalPages,
            currentPage: this.currentPage,
            bucketsMeta: bucketsMeta,
            type: state.type 
        });
    }
}