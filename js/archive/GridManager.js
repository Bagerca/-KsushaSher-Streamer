/* js/archive/GridManager.js */
import EventBus from '../event-bus.js';

export class GridManager {
    constructor(store, cardFactory, lazyLoader) {
        this.store = store;
        this.factory = cardFactory;
        this.lazyLoader = lazyLoader;

        const wrapper = document.querySelector('.archive-full-grid-wrapper');
        wrapper.innerHTML = `
            <div id="archive-grid-main" class="archive-flex-grid"></div>
            <div id="archive-suggested-header" class="archive-divider-row" style="display:none;">
                <div class="divider-line"></div>
                <div class="divider-text">COMMUNITY_SUGGESTIONS // ПРЕДЛОЖКА</div>
                <div class="divider-line"></div>
            </div>
            <div id="archive-grid-suggested" class="archive-flex-grid"></div>
            <div class="archive-fade-overlay" id="archive-fade-overlay"></div>
        `;

        this.els = {
            wrapper: wrapper,
            gridMain: document.getElementById('archive-grid-main'),
            gridSuggested: document.getElementById('archive-grid-suggested'),
            suggestedHeader: document.getElementById('archive-suggested-header'),
            overlay: document.getElementById('archive-fade-overlay')
        };

        this.isExpanded = false;
        this.isAnimating = false; 
        this.renderedCount = 0;
        this.scrollObserver = null;
        this.resizeDebounceTimer = null;
        this.gridMode = 'detailed';

        this.bindEvents();
    }

    setGridMode(mode) {
        this.gridMode = mode;
        if (mode === 'compact') {
            this.els.gridMain.classList.add('compact-mode');
            this.els.gridSuggested.classList.add('compact-mode');
        } else {
            this.els.gridMain.classList.remove('compact-mode');
            this.els.gridSuggested.classList.remove('compact-mode');
        }
        this.renderGrid(true);
    }

    setSwitchingState(isSwitching) {
        if (isSwitching) {
            this.els.gridMain.classList.add('switching');
            this.els.gridSuggested.classList.add('switching');
        } else {
            this.els.gridMain.classList.remove('switching');
            this.els.gridSuggested.classList.remove('switching');
        }
    }

    getDynamicBatchSize() {
        const width = window.innerWidth;
        const isCompact = this.gridMode === 'compact';
        let cols = 6;

        if (isCompact) {
            if (width > 1600) cols = 8;
            else if (width > 1400) cols = 7;
            else if (width > 1000) cols = 6;
            else if (width > 768) cols = 4;
            else cols = 3;
        } else {
            if (width > 1600) cols = 6;
            else if (width > 1400) cols = 5;
            else if (width > 1000) cols = 4;
            else if (width > 768) cols = 3;
            else cols = 2;
        }
        return cols * 2; 
    }

    bindEvents() {
        EventBus.on('MEDIA_STORE_LOADED', () => this.renderGrid(true));
        EventBus.on('MEDIA_STORE_UPDATED', () => this.renderGrid(true));

        this.els.wrapper.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (card && !card.classList.contains('fold-out')) {
                const id = card.dataset.id;
                const item = this.store.getItemById(id);
                if (item) {
                    EventBus.emit('PLAY_SOUND', 'expand');
                    
                    // РАЗВИЛКА ДЛЯ РАЗНЫХ МОДАЛОК В ЗАВИСИМОСТИ ОТ ФОРМАТА
                    if (item.format === 'youtube') {
                        EventBus.emit('MODAL_OPEN_YOUTUBE', { item, triggerElement: card });
                    } else {
                        EventBus.emit('MODAL_OPEN_MEDIA', { item, type: this.store.currentType, triggerElement: card });
                    }
                }
            }
        });

        this.els.wrapper.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.gridMode === 'compact') return;

            const lazyBackLayers = card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]');
            lazyBackLayers.forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl && !layer.style.backgroundImage) {
                    this.lazyLoader._safeImageLoad(bgUrl, card.classList.contains('is-youtube'), layer, null, null, layer);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }, true);

        window.addEventListener('resize', () => {
            if (this.isExpanded) return; 
            clearTimeout(this.resizeDebounceTimer);
            this.resizeDebounceTimer = setTimeout(() => { this.renderGrid(true); }, 300);
        });
    }

    renderGrid(reset = false) {
        if (reset) {
            this.els.gridMain.innerHTML = '';
            this.els.gridSuggested.innerHTML = '';
            this.els.suggestedHeader.style.display = 'none';
            this.renderedCount = 0;
            this.isExpanded = false; 
            if (this.scrollObserver) this.scrollObserver.disconnect();
        }

        const data = this.store.combinedData;

        if (data.length === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; text-align:center; padding:50px; color:#666; font-family:\'Exo 2\';">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
            this.toggleOverlay(false);
            this.toggleExpandButton(false);
            return;
        }

        if (this.renderedCount === 0 || this.isExpanded) {
            this.renderNextBatch();
        }

        if (this.renderedCount < data.length) {
            if (!this.isExpanded) {
                this.toggleOverlay(true);
                this.toggleExpandButton(true, 'expand');
            } else {
                this.toggleOverlay(false);
                this.setupInfiniteScroll();
                this.toggleExpandButton(true, 'collapse');
            }
        } else {
            this.toggleOverlay(false);
            if (this.isExpanded && data.length > this.getDynamicBatchSize()) {
                this.toggleExpandButton(true, 'collapse');
            } else {
                this.toggleExpandButton(false);
            }
        }
    }

    toggleOverlay(show) {
        if (show) {
            this.els.overlay.classList.add('active');
            this.els.wrapper.classList.add('has-more');
        } else {
            this.els.overlay.classList.remove('active');
            this.els.wrapper.classList.remove('has-more');
        }
    }

    toggleExpandButton(show, mode = 'expand') {
        let controlsDiv = document.getElementById('archive-footer-controls');
        
        if (!show) {
            if (controlsDiv) controlsDiv.style.display = 'none';
            return;
        }

        if (!controlsDiv) {
            controlsDiv = document.createElement('div');
            controlsDiv.id = 'archive-footer-controls';
            this.els.wrapper.after(controlsDiv);
            
            const btn = document.createElement('button');
            btn.id = 'archive-toggle-btn';
            controlsDiv.appendChild(btn);
            
            btn.addEventListener('click', () => this.handleExpandCollapse());
        }

        controlsDiv.style.display = 'flex';
        controlsDiv.className = `archive-footer-controls mode-${mode}`;
        
        const btn = document.getElementById('archive-toggle-btn');
        const total = this.store.combinedData.length;
        
        if (mode === 'expand') {
            btn.className = 'cyber-load-btn';
            btn.innerHTML = `<span>РАЗВЕРНУТЬ БАЗУ (${total}) <i class="fas fa-chevron-down"></i></span>`;
        } else {
            btn.className = 'cyber-load-btn collapse-mode';
            btn.innerHTML = `<span>СВЕРНУТЬ <i class="fas fa-chevron-up"></i></span>`;
        }
    }

    handleExpandCollapse() {
        if (this.isAnimating) return;
        EventBus.emit('PLAY_SOUND', 'expand');

        if (!this.isExpanded) {
            this.isExpanded = true;
            this.toggleOverlay(false);
            this.toggleExpandButton(true, 'collapse');
            this.renderNextBatch(); 
            this.setupInfiniteScroll();
        } else {
            this.isAnimating = true;
            const archiveSection = document.getElementById('media-archive');
            
            if (archiveSection) {
                EventBus.emit('LAYOUT_CHANGED'); 
                const targetY = archiveSection.offsetTop - 50;
                window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
            }

            setTimeout(() => {
                const initialBatchSize = this.getDynamicBatchSize();
                const mainCards = Array.from(this.els.gridMain.querySelectorAll('.archive-card-container'));
                const suggCards = Array.from(this.els.gridSuggested.querySelectorAll('.archive-card-container'));
                const allCards = [...mainCards, ...suggCards];

                const cardsToRemove = allCards.slice(initialBatchSize);

                if (cardsToRemove.length > 0) {
                    cardsToRemove.forEach(card => card.classList.add('fold-out'));
                    
                    setTimeout(() => {
                        cardsToRemove.forEach(card => card.remove());
                        if (this.els.gridSuggested.children.length === 0) {
                            this.els.suggestedHeader.style.display = 'none';
                        }
                        
                        this.renderedCount = initialBatchSize;
                        this.isExpanded = false;
                        
                        this.toggleOverlay(true);
                        this.toggleExpandButton(true, 'expand');
                        
                        if (this.scrollObserver) this.scrollObserver.disconnect();
                        
                        EventBus.emit('LAYOUT_CHANGED'); 
                        this.isAnimating = false;
                        
                    }, 350); 
                } else {
                    this.isAnimating = false;
                }
            }, 600);
        }
    }

    setupInfiniteScroll() {
        if (this.scrollObserver) this.scrollObserver.disconnect();
        
        let sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel) {
            sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.style.width = '100%';
            sentinel.style.height = '10px';
            sentinel.style.position = 'absolute';
            sentinel.style.bottom = '50px';
            this.els.wrapper.appendChild(sentinel);
        }

        this.scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && this.renderedCount < this.store.combinedData.length && this.isExpanded) {
                this.renderNextBatch();
            }
        }, { rootMargin: '400px' });
        
        this.scrollObserver.observe(sentinel);
    }

    renderNextBatch() {
        const perfStart = performance.now();
        
        const data = this.store.combinedData;
        const start = this.renderedCount;
        const batchSize = this.getDynamicBatchSize();
        
        let limit = this.isExpanded ? start + batchSize : batchSize;
        const end = Math.min(limit, data.length);
        
        if (start >= end) return;

        let mainHtmlBuf = '';
        let suggHtmlBuf = '';
        let hasSuggested = false;

        for (let i = start; i < end; i++) {
            const item = data[i];
            const delay = (i % batchSize) * 35; 
            const html = this.factory.createCardHTML(item, delay);
            
            if (item.status === 'suggested') {
                hasSuggested = true;
                suggHtmlBuf += html;
            } else {
                mainHtmlBuf += html;
            }
        }
        
        if (hasSuggested) {
            this.els.suggestedHeader.style.display = 'flex';
            this.els.gridSuggested.insertAdjacentHTML('beforeend', suggHtmlBuf);
        }
        if (mainHtmlBuf) {
            this.els.gridMain.insertAdjacentHTML('beforeend', mainHtmlBuf);
        }
        
        const newCards = document.querySelectorAll('.archive-card-container:not(.is-observed)');
        newCards.forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });

        this.renderedCount = end;
        EventBus.emit('LAYOUT_CHANGED');
        
        console.log(`📦 [GridManager] Пакет из ${end - start} карт отрендерен за ${(performance.now() - perfStart).toFixed(2)}мс`);
    }
}