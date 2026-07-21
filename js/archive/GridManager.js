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
        this.stdPerPage = 12; 
        this.ytPerPage = 6;
        
        this.mainPages = 0;
        this.suggPages = 0;
        this.ytPages = 0;
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
        this.els.gridMain.style.minHeight = '0px';
        this.renderGrid(true);
    }

    setSwitchingState(isSwitching) {
        const action = isSwitching ? 'add' : 'remove';
        this.els.gridMain.classList[action]('switching');
    }

    getColumnsCount() {
        let gridWidth = this.els.gridMain.clientWidth;
        
        if (gridWidth === 0) {
            const containerMax = Math.min(window.innerWidth * 0.95, 1650);
            gridWidth = containerMax - 52 - 30; 
        }

        if (this.gridMode === 'compact') {
            return Math.max(1, Math.floor((gridWidth + 12) / (160 + 12)));
        } else {
            return Math.max(1, Math.floor((gridWidth + 20) / (230 + 20)));
        }
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
            this.resizeDebounceTimer = setTimeout(() => {
                this.els.gridMain.style.minHeight = '0px';
                this.renderGrid(true);
            }, 300);
        });

        this.els.prevBtn.addEventListener('click', () => this.changePage(-1));
        this.els.nextBtn.addEventListener('click', () => this.changePage(1));
    }

    renderGrid(resetToFirstPage = false) {
        if (resetToFirstPage) this.currentPage = 1;

        const cols = this.getColumnsCount();
        this.stdPerPage = cols * 2; 
        
        this.ytPerPage = Math.max(2, Math.floor(cols / 2) * 2); 
        
        this.mainPages = Math.ceil(this.store.filteredMainStandard.length / this.stdPerPage);
        this.suggPages = Math.ceil(this.store.filteredSuggStandard.length / this.stdPerPage);
        this.ytPages = Math.ceil(this.store.filteredYoutube.length / this.ytPerPage);

        this.totalPages = this.mainPages + this.suggPages + this.ytPages;

        if (this.totalPages === 0) {
            this.els.gridMain.innerHTML = '<div style="width:100%; text-align:center; padding:50px; color:#666; font-family:\'Exo 2\';">ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
            this.els.controlsDiv.style.display = 'none';
            return;
        }

        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

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
        if (direction === 0) direction = page > this.currentPage ? 1 : -1;

        this.isAnimating = true;
        EventBus.emit('PLAY_SOUND', 'hover');

        const outClass = direction > 0 ? 'page-slide-up-out' : 'page-slide-down-out';
        this.els.gridMain.classList.add(outClass);

        await new Promise(r => setTimeout(r, 250));
        this.currentPage = page;

        const entryClass = direction > 0 ? 'entering-from-bottom' : 'entering-from-top';
        this.els.gridMain.classList.remove('entering-from-bottom', 'entering-from-top');
        this.els.gridMain.classList.add(entryClass);

        this.renderGridContent();
        this.updatePaginationUI();

        this.els.gridMain.classList.remove(outClass);
        this.isAnimating = false;
        EventBus.emit('LAYOUT_CHANGED');
    }

    renderGridContent() {
        let pageData = [];
        let isYoutubePage = false;
        
        if (this.currentPage <= this.mainPages) {
            const start = (this.currentPage - 1) * this.stdPerPage;
            pageData = this.store.filteredMainStandard.slice(start, start + this.stdPerPage);
        } else if (this.currentPage <= this.mainPages + this.suggPages) {
            const suggPage = this.currentPage - this.mainPages;
            const start = (suggPage - 1) * this.stdPerPage;
            pageData = this.store.filteredSuggStandard.slice(start, start + this.stdPerPage);
        } else {
            isYoutubePage = true;
            const ytPage = this.currentPage - this.mainPages - this.suggPages;
            const start = (ytPage - 1) * this.ytPerPage;
            pageData = this.store.filteredYoutube.slice(start, start + this.ytPerPage);
        }

        let mainHtmlBuf = '';
        pageData.forEach((item, index) => {
            const delay = index * 30; 
            mainHtmlBuf += this.factory.createCardHTML(item, delay);
        });
        
        this.els.gridMain.innerHTML = mainHtmlBuf;

        // ИСПРАВЛЕНИЕ: ЖЕСТКАЯ ФИКСАЦИЯ ВЫСОТЫ КОНТЕЙНЕРА
        requestAnimationFrame(() => {
            const gap = this.gridMode === 'compact' ? 12 : 20;
            const cardWidth = this.gridMode === 'compact' ? 160 : 230;
            
            // Мы ВСЕГДА вычисляем высоту на основе высоких дефолтных карточек.
            // Это гарантирует, что контейнер не сузится при переходе на ютуб-страницы.
            const defaultCardHeight = cardWidth * 1.5; 
            const targetMinHeight = (defaultCardHeight * 2) + gap; 
            
            this.els.gridMain.style.minHeight = `${targetMinHeight}px`;

            // Если страница с ютуб роликами, мы центрируем их внутри зафиксированного высокого контейнера.
            if (isYoutubePage) {
                this.els.gridMain.style.alignContent = 'center';
            } else {
                this.els.gridMain.style.alignContent = 'start';
            }
        });

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

        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

        const getBtnHtml = (i) => {
            let isSugg = false;
            let isYt = false;
            
            if (i > this.mainPages && i <= this.mainPages + this.suggPages) isSugg = true;
            else if (i > this.mainPages + this.suggPages) isYt = true;

            const activeClass = i === cur ? 'active' : '';
            let extraClass = '';
            let displayVal = i;

            if (isSugg) {
                extraClass = 'sugg-page-btn';
                const suggNum = i - this.mainPages;
                displayVal = this.suggPages > 1 
                    ? `<i class="fas fa-star"></i><span style="font-size:0.7em; margin-top:2px;">${suggNum}</span>` 
                    : `<i class="fas fa-star"></i>`;
            } else if (isYt) {
                extraClass = 'yt-page-btn';
                const ytNum = i - this.mainPages - this.suggPages;
                displayVal = this.ytPages > 1 
                    ? `<i class="fab fa-youtube"></i><span style="font-size:0.7em; margin-top:2px;">${ytNum}</span>` 
                    : `<i class="fab fa-youtube"></i>`;
            }

            return `<button class="page-num-btn ${activeClass} ${extraClass}" data-page="${i}">${displayVal}</button>`;
        };

        if (start > 1) { html += getBtnHtml(1); if (start > 2) html += `<span class="page-dots">...</span>`; }
        for (let i = start; i <= end; i++) html += getBtnHtml(i);
        if (end < total) { if (end < total - 1) html += `<span class="page-dots">...</span>`; html += getBtnHtml(total); }

        this.els.pageNumbersContainer.innerHTML = html;
        this.els.pageNumbersContainer.querySelectorAll('.page-num-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => this.goToPage(parseInt(e.currentTarget.dataset.page)));
        });
    }
}