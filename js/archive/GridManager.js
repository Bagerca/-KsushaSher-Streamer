/* js/archive/GridManager.js */
import EventBus from '../event-bus.js';

export class GridManager {
    constructor(store, cardFactory, lazyLoader) {
        this.store = store;
        this.factory = cardFactory;
        this.lazyLoader = lazyLoader;

        // Создаем физическое разделение сеток
        const wrapper = document.querySelector('.archive-full-grid-wrapper');
        wrapper.innerHTML = `
            <div id="archive-grid-main" class="archive-flex-grid"></div>
            <div id="archive-suggested-header" class="archive-divider-row" style="display:none;">
                <div class="divider-line"></div>
                <div class="divider-text">COMMUNITY_SUGGESTIONS // ПРЕДЛОЖКА</div>
                <div class="divider-line"></div>
            </div>
            <div id="archive-grid-suggested" class="archive-flex-grid"></div>
        `;

        this.els = {
            wrapper: wrapper,
            gridMain: document.getElementById('archive-grid-main'),
            gridSuggested: document.getElementById('archive-grid-suggested'),
            suggestedHeader: document.getElementById('archive-suggested-header')
        };

        this.isExpanded = false;
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
            if (card) {
                const id = card.dataset.id;
                const item = this.store.getItemById(id);
                if (item) {
                    EventBus.emit('PLAY_SOUND', 'expand');
                    EventBus.emit('MODAL_OPEN_MEDIA', { item, type: this.store.currentType });
                }
            }
        });

        // Захват делегированного mouseenter для ленивой загрузки (работает для обеих сеток)
        this.els.wrapper.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.gridMode === 'compact') return;

            const lazyBackLayers = card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]');
            lazyBackLayers.forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl && !layer.style.backgroundImage) {
                    this.lazyLoader._safeImageLoad(bgUrl, card.classList.contains('is-youtube'), layer, null);
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
            if (this.scrollObserver) this.scrollObserver.disconnect();
            
            const oldSentinel = document.getElementById('scroll-sentinel');
            if (oldSentinel) oldSentinel.remove();
            const oldBtn = document.querySelector('.archive-footer-controls');
            if (oldBtn) oldBtn.remove();
        }

        const data = this.store.combinedData;

        if (data.length === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; text-align:center; padding:50px; color:#666;">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
            this.els.wrapper.classList.remove('has-more');
            return;
        }

        this.renderNextBatch();

        if (this.renderedCount < data.length) {
            if (!this.isExpanded) {
                this.renderExpandButton('expand');
                this.ensureOverlay(true);
            } else {
                this.ensureOverlay(false);
                this.setupInfiniteScroll();
                this.renderExpandButton('collapse');
            }
        } else {
            this.ensureOverlay(false);
            if (this.isExpanded) this.renderExpandButton('collapse');
        }
    }

    ensureOverlay(show) {
        let overlay = this.els.wrapper.querySelector('.archive-fade-overlay');
        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'archive-fade-overlay';
                this.els.wrapper.appendChild(overlay);
            }
            this.els.wrapper.classList.add('has-more');
        } else {
            if (overlay) overlay.remove();
            this.els.wrapper.classList.remove('has-more');
        }
    }

    renderExpandButton(mode) {
        let controlsDiv = document.querySelector('.archive-footer-controls');
        if (!controlsDiv) {
            controlsDiv = document.createElement('div');
            controlsDiv.className = 'archive-footer-controls';
            this.els.wrapper.after(controlsDiv);
        }

        const btnText = mode === 'expand' ? `РАЗВЕРНУТЬ БАЗУ (${this.store.combinedData.length})` : 'СВЕРНУТЬ';
        const btnIcon = mode === 'expand' ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
        
        controlsDiv.innerHTML = `<button class="cyber-load-btn ${mode === 'collapse' ? 'collapse-mode' : ''}" id="archive-toggle-btn"><span>${btnText} ${btnIcon}</span></button>`;

        document.getElementById('archive-toggle-btn').addEventListener('click', () => {
            const archiveSection = document.getElementById('media-archive');
            if (!archiveSection) return;

            EventBus.emit('PLAY_SOUND', 'expand');

            if (mode === 'expand') {
                const sectionTop = archiveSection.offsetTop;
                window.scrollTo({ top: sectionTop - 50, behavior: 'smooth' });
                this.isExpanded = true;
                this.renderGrid();
            } else {
                const sectionTop = archiveSection.offsetTop;
                window.scrollTo({ top: sectionTop - 50, behavior: 'smooth' });
                this.isExpanded = false;
                setTimeout(() => { this.renderGrid(true); }, 350);
            }
        });
    }

    setupInfiniteScroll() {
        if (this.scrollObserver) this.scrollObserver.disconnect();
        
        let sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel) {
            sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.style.width = '100%';
            sentinel.style.height = '50px';
            this.els.wrapper.appendChild(sentinel);
        }

        this.scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && this.renderedCount < this.store.combinedData.length) {
                this.renderNextBatch();
            }
        }, { rootMargin: '200px' });
        
        this.scrollObserver.observe(sentinel);
    }

    renderNextBatch() {
        const data = this.store.combinedData;
        const start = this.renderedCount;
        const batchSize = this.getDynamicBatchSize();
        
        let limit = this.isExpanded ? start + batchSize : batchSize;
        const end = Math.min(limit, data.length);
        
        if (start >= end) return;

        for (let i = start; i < end; i++) {
            const item = data[i];
            const delay = (i % batchSize) * 35; 
            const html = this.factory.createCardHTML(item, delay);
            
            if (item.status === 'suggested') {
                this.els.suggestedHeader.style.display = 'flex';
                this.els.gridSuggested.insertAdjacentHTML('beforeend', html);
            } else {
                this.els.gridMain.insertAdjacentHTML('beforeend', html);
            }
        }
        
        const newCards = document.querySelectorAll('.archive-card-container:not(.is-observed)');
        newCards.forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });

        this.renderedCount = end;
    }
}