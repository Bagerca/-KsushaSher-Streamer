/* js/archive/GridManager.js */
import EventBus from '../event-bus.js';

export class GridManager {
    constructor(store, cardFactory, lazyLoader) {
        this.store = store;
        this.factory = cardFactory;
        this.lazyLoader = lazyLoader;

        // Строгая привязка к элементам из index.html
        this.els = {
            wrapper: document.getElementById('archive-grid-wrapper'),
            gridMain: document.getElementById('archive-grid-main'),
            gridSuggested: document.getElementById('archive-grid-suggested'),
            suggestedHeader: document.getElementById('archive-suggested-header'),
            overlay: document.getElementById('archive-fade-overlay'),
            controlsDiv: document.getElementById('archive-footer-controls'),
            toggleBtn: document.getElementById('archive-toggle-btn'),
            sentinel: document.getElementById('scroll-sentinel')
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
        const action = mode === 'compact' ? 'add' : 'remove';
        this.els.gridMain.classList[action]('compact-mode');
        this.els.gridSuggested.classList[action]('compact-mode');
        this.renderGrid(true);
    }

    setSwitchingState(isSwitching) {
        const action = isSwitching ? 'add' : 'remove';
        this.els.gridMain.classList[action]('switching');
        this.els.gridSuggested.classList[action]('switching');
    }

    getDynamicBatchSize() {
        const width = window.innerWidth;
        const isCompact = this.gridMode === 'compact';
        let cols = isCompact 
            ? (width > 1600 ? 8 : width > 1400 ? 7 : width > 1000 ? 6 : width > 768 ? 4 : 3)
            : (width > 1600 ? 6 : width > 1400 ? 5 : width > 1000 ? 4 : width > 768 ? 3 : 2);
        return cols * 2; 
    }

    bindEvents() {
        EventBus.on('MEDIA_STORE_LOADED', () => this.renderGrid(true));
        EventBus.on('MEDIA_STORE_UPDATED', () => this.renderGrid(true));

        // Делегирование клика по карточкам
        this.els.wrapper.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || card.classList.contains('fold-out')) return;

            const item = this.store.getItemById(card.dataset.id);
            if (item) {
                EventBus.emit('PLAY_SOUND', 'expand');
                const eventName = item.format === 'youtube' ? 'MODAL_OPEN_YOUTUBE' : 'MODAL_OPEN_MEDIA';
                EventBus.emit(eventName, { item, type: this.store.currentType, triggerElement: card });
            }
        });

        // Отложенная загрузка слоев (3D-стек)
        this.els.wrapper.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.gridMode === 'compact') return;

            card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]').forEach(layer => {
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
            this.resizeDebounceTimer = setTimeout(() => this.renderGrid(true), 300);
        });

        // Кнопка развернуть/свернуть
        this.els.toggleBtn.addEventListener('click', () => this.handleExpandCollapse());
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
            this.toggleUI(false, false);
            return;
        }

        if (this.renderedCount === 0 || this.isExpanded) {
            this.renderNextBatch();
        }

        if (this.renderedCount < data.length) {
            this.toggleUI(!this.isExpanded, true, this.isExpanded ? 'collapse' : 'expand');
            if (this.isExpanded) this.setupInfiniteScroll();
        } else {
            this.toggleUI(false, this.isExpanded && data.length > this.getDynamicBatchSize(), 'collapse');
        }
    }

    toggleUI(showOverlay, showButton, btnMode = 'expand') {
        this.els.overlay.classList.toggle('active', showOverlay);
        this.els.wrapper.classList.toggle('has-more', showOverlay);
        
        this.els.controlsDiv.style.display = showButton ? 'flex' : 'none';
        if (showButton) {
            this.els.controlsDiv.className = `archive-footer-controls mode-${btnMode}`;
            this.els.toggleBtn.className = btnMode === 'expand' ? 'cyber-load-btn' : 'cyber-load-btn collapse-mode';
            this.els.toggleBtn.innerHTML = btnMode === 'expand' 
                ? `<span>РАЗВЕРНУТЬ БАЗУ (${this.store.combinedData.length}) <i class="fas fa-chevron-down"></i></span>`
                : `<span>СВЕРНУТЬ <i class="fas fa-chevron-up"></i></span>`;
        }
    }

    handleExpandCollapse() {
        if (this.isAnimating) return;
        EventBus.emit('PLAY_SOUND', 'expand');

        if (!this.isExpanded) {
            this.isExpanded = true;
            this.toggleUI(false, true, 'collapse');
            this.renderNextBatch(); 
            this.setupInfiniteScroll();
        } else {
            this.isAnimating = true;
            const archiveSection = document.getElementById('media-archive');
            
            if (archiveSection) {
                EventBus.emit('LAYOUT_CHANGED'); 
                window.scrollTo({ top: Math.max(0, archiveSection.offsetTop - 50), behavior: 'smooth' });
            }

            setTimeout(() => {
                const initialBatchSize = this.getDynamicBatchSize();
                const allCards = [
                    ...this.els.gridMain.querySelectorAll('.archive-card-container'),
                    ...this.els.gridSuggested.querySelectorAll('.archive-card-container')
                ];

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
                        
                        this.toggleUI(true, true, 'expand');
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
        
        this.scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && this.renderedCount < this.store.combinedData.length && this.isExpanded) {
                this.renderNextBatch();
            }
        }, { rootMargin: '400px' });
        
        this.scrollObserver.observe(this.els.sentinel);
    }

    renderNextBatch() {
        const data = this.store.combinedData;
        const start = this.renderedCount;
        const batchSize = this.getDynamicBatchSize();
        const end = Math.min(this.isExpanded ? start + batchSize : batchSize, data.length);
        
        if (start >= end) return;

        let mainHtmlBuf = '';
        let suggHtmlBuf = '';

        for (let i = start; i < end; i++) {
            const html = this.factory.createCardHTML(data[i], (i % batchSize) * 35);
            if (data[i].status === 'suggested') suggHtmlBuf += html;
            else mainHtmlBuf += html;
        }
        
        if (suggHtmlBuf) {
            this.els.suggestedHeader.style.display = 'flex';
            this.els.gridSuggested.insertAdjacentHTML('beforeend', suggHtmlBuf);
        }
        if (mainHtmlBuf) {
            this.els.gridMain.insertAdjacentHTML('beforeend', mainHtmlBuf);
        }
        
        document.querySelectorAll('.archive-card-container:not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });

        this.renderedCount = end;
        EventBus.emit('LAYOUT_CHANGED');
    }
}