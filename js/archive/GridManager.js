/* js/archive/GridManager.js */
import EventBus from '../event-bus.js';

export class GridManager {
    constructor(store, cardFactory, lazyLoader) {
        this.store = store;
        this.factory = cardFactory;
        this.lazyLoader = lazyLoader;

        this.els = {
            wrapper: document.getElementById('archive-grid-wrapper'),
            gridMain: document.getElementById('archive-grid-main'),
            controlsDiv: document.getElementById('archive-side-pagination'),
            prevBtn: document.getElementById('page-prev-btn'),
            nextBtn: document.getElementById('page-next-btn'),
            pageNumbersContainer: document.getElementById('page-numbers-container')
        };

        this.currentPage = 1;
        this.itemsPerPage = 12; 
        this.totalPages = 1;
        
        this.isAnimating = false; 
        this.resizeDebounceTimer = null;
        this.gridMode = 'detailed';

        this.bindEvents();
    }

    setGridMode(mode) {
        this.gridMode = mode;
        const action = mode === 'compact' ? 'add' : 'remove';
        this.els.gridMain.classList[action]('compact-mode');
        this.renderGrid(true);
    }

    setSwitchingState(isSwitching) {
        const action = isSwitching ? 'add' : 'remove';
        this.els.gridMain.classList[action]('switching');
    }

    calculateItemsPerPage() {
        const width = window.innerWidth;
        // Отнимаем ширину сайдбара из расчетов
        const effectiveWidth = width > 1024 ? width - 80 : width;
        const isCompact = this.gridMode === 'compact';
        let cols = isCompact 
            ? (effectiveWidth > 1600 ? 8 : effectiveWidth > 1400 ? 7 : effectiveWidth > 1000 ? 6 : effectiveWidth > 768 ? 4 : 3)
            : (effectiveWidth > 1600 ? 6 : effectiveWidth > 1400 ? 5 : effectiveWidth > 1000 ? 4 : effectiveWidth > 768 ? 3 : 2);
            
        return cols * 2; 
    }

    bindEvents() {
        EventBus.on('MEDIA_STORE_LOADED', () => this.renderGrid(true));
        EventBus.on('MEDIA_STORE_UPDATED', () => this.renderGrid(true));

        this.els.wrapper.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.isAnimating) return;

            const item = this.store.getItemById(card.dataset.id);
            if (item) {
                EventBus.emit('PLAY_SOUND', 'expand');
                const eventName = item.format === 'youtube' ? 'MODAL_OPEN_YOUTUBE' : 'MODAL_OPEN_MEDIA';
                EventBus.emit(eventName, { item, type: this.store.currentType, triggerElement: card });
            }
        });

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
            clearTimeout(this.resizeDebounceTimer);
            this.resizeDebounceTimer = setTimeout(() => this.renderGrid(true), 300);
        });

        this.els.prevBtn.addEventListener('click', () => this.changePage(-1));
        this.els.nextBtn.addEventListener('click', () => this.changePage(1));
    }

    renderGrid(resetToFirstPage = false) {
        if (resetToFirstPage) {
            this.currentPage = 1;
        }

        const data = this.store.combinedData;
        this.itemsPerPage = this.calculateItemsPerPage();
        this.totalPages = Math.ceil(data.length / this.itemsPerPage) || 1;

        if (data.length === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; text-align:center; padding:50px; color:#666; font-family:\'Exo 2\';">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
            this.els.controlsDiv.style.display = 'none';
            return;
        }

        this.renderGridContent();
        this.updatePaginationUI();
    }

    async changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage < 1 || newPage > this.totalPages) return;
        this.goToPage(newPage, direction);
    }

    async goToPage(page, direction = 0) {
        if (this.isAnimating || page === this.currentPage) return;
        
        // Вычисляем направление, если кликнули по конкретной цифре
        if (direction === 0) {
            direction = page > this.currentPage ? 1 : -1;
        }

        this.isAnimating = true;
        EventBus.emit('PLAY_SOUND', 'hover');

        // Выбираем класс ухода (вверх или вниз)
        const outClass = direction > 0 ? 'page-slide-up-out' : 'page-slide-down-out';
        this.els.gridMain.classList.add(outClass);

        await new Promise(r => setTimeout(r, 250)); // Ждем окончания анимации

        this.currentPage = page;

        // Применяем класс, откуда будут появляться новые карточки
        const entryClass = direction > 0 ? 'entering-from-bottom' : 'entering-from-top';
        this.els.gridMain.classList.remove('entering-from-bottom', 'entering-from-top');
        this.els.gridMain.classList.add(entryClass);

        this.renderGridContent();
        this.updatePaginationUI();

        // Снимаем класс ухода, чтобы карточки начали появляться
        this.els.gridMain.classList.remove(outClass);
        
        this.isAnimating = false;
        EventBus.emit('LAYOUT_CHANGED');
    }

    renderGridContent() {
        const data = this.store.combinedData;
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = Math.min(start + this.itemsPerPage, data.length);
        
        const pageData = data.slice(start, end);

        let mainHtmlBuf = '';

        pageData.forEach((item, index) => {
            const delay = index * 30; 
            mainHtmlBuf += this.factory.createCardHTML(item, delay);
        });
        
        this.els.gridMain.innerHTML = mainHtmlBuf;

        document.querySelectorAll('.archive-card-container:not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });
    }

    updatePaginationUI() {
        if (this.totalPages <= 1) {
            this.els.controlsDiv.style.display = 'none';
            return;
        }
        
        this.els.controlsDiv.style.display = 'flex';
        
        this.els.prevBtn.disabled = this.currentPage === 1;
        this.els.nextBtn.disabled = this.currentPage === this.totalPages;
        
        this.renderPageNumbers();
    }

    renderPageNumbers() {
        let html = '';
        const maxVisible = 5; 
        const total = this.totalPages;
        const cur = this.currentPage;

        let start = Math.max(1, cur - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        if (start > 1) {
            html += `<button class="page-num-btn" data-page="1">1</button>`;
            if (start > 2) html += `<span class="page-dots">...</span>`;
        }

        for (let i = start; i <= end; i++) {
            if (i === cur) {
                html += `<button class="page-num-btn active">${i}</button>`;
            } else {
                html += `<button class="page-num-btn" data-page="${i}">${i}</button>`;
            }
        }

        if (end < total) {
            if (end < total - 1) html += `<span class="page-dots">...</span>`;
            html += `<button class="page-num-btn" data-page="${total}">${total}</button>`;
        }

        this.els.pageNumbersContainer.innerHTML = html;

        this.els.pageNumbersContainer.querySelectorAll('.page-num-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPage = parseInt(e.target.dataset.page);
                this.goToPage(targetPage);
            });
        });
    }
}