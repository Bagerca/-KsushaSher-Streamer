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
        this.isSelectorOpen = false; 

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

        this.els.prevBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'hover');
            this.changePage(-1);
        });
        this.els.nextBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'hover');
            this.changePage(1);
        });

        document.addEventListener('click', (e) => {
            if (this.isSelectorOpen && !e.target.closest('#archive-side-pagination')) {
                this.closeSelector();
            }
        });
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
        this.closeSelector(); 

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

        requestAnimationFrame(() => {
            const gap = this.gridMode === 'compact' ? 12 : 20;
            const cardWidth = this.gridMode === 'compact' ? 160 : 230;
            const defaultCardHeight = cardWidth * 1.5; 
            const targetMinHeight = (defaultCardHeight * 2) + gap; 
            
            this.els.gridMain.style.minHeight = `${targetMinHeight}px`;
            this.els.gridMain.style.alignContent = isYoutubePage ? 'center' : 'start';
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

    getPageMetadata(pageIndex) {
        if (pageIndex < 1 || pageIndex > this.totalPages) return null;
        
        if (pageIndex <= this.mainPages) {
            return { raw: pageIndex, num: pageIndex, type: 'main', icon: '', colorClass: '' };
        } else if (pageIndex <= this.mainPages + this.suggPages) {
            return { raw: pageIndex, num: pageIndex - this.mainPages, type: 'sugg', icon: '<i class="fas fa-star"></i>', colorClass: 'sugg-page-btn' };
        } else {
            return { raw: pageIndex, num: pageIndex - this.mainPages - this.suggPages, type: 'yt', icon: '<i class="fab fa-youtube"></i>', colorClass: 'yt-page-btn' };
        }
    }

    renderTunerSlot(pageIndex, stateClass) {
        const meta = this.getPageMetadata(pageIndex);
        if (!meta) return `<button class="tuner-slot empty">[--]</button>`;
        const content = meta.icon ? `${meta.icon}<span>${meta.num}</span>` : meta.num;
        return `<button class="tuner-slot ${stateClass} ${meta.colorClass}" data-page="${meta.raw}" title="Этаж ${meta.raw}">${content}</button>`;
    }

    renderPageNumbers() {
        const M = this.mainPages;
        const S = this.suggPages;
        const Y = this.ytPages;
        const cur = this.currentPage;
        let html = '';

        // 1. ОПТИЧЕСКИЙ ТЮНЕР
        html += `<div class="tuner-container">`;
        html += this.renderTunerSlot(cur - 1, 'prev');
        html += this.renderTunerSlot(cur, 'active'); 
        html += this.renderTunerSlot(cur + 1, 'next');

        // 2. ГОЛО-МАТРИЦА (Выезжает вправо)
        html += `<div class="holo-floor-selector" id="holo-floor-selector">
                    <div class="holo-selector-header">ВЫБОР СЕКТОРА</div>
                    <div class="holo-selector-body">`;
        
        let currentTypeRendered = null;
        for (let i = 1; i <= this.totalPages; i++) {
            const meta = this.getPageMetadata(i);
            
            if (meta.type !== currentTypeRendered) {
                if (currentTypeRendered !== null) html += `</div>`; 
                let sectorTitle = meta.type === 'main' ? 'MAIN_DB' : (meta.type === 'sugg' ? 'SUGGESTIONS' : 'YOUTUBE_ARCHIVE');
                let sectorColor = meta.type === 'main' ? 'var(--neon-green)' : (meta.type === 'sugg' ? 'var(--neon-pink)' : '#ff0000');
                html += `<div class="sector-label" style="color: ${sectorColor}">[ ${sectorTitle} ]</div><div class="sector-grid">`;
                currentTypeRendered = meta.type;
            }

            const activeClass = i === cur ? 'is-current' : '';
            const content = meta.icon ? `${meta.icon}${meta.num}` : meta.num;
            html += `<button class="matrix-btn ${meta.colorClass} ${activeClass}" data-page="${meta.raw}">${content}</button>`;
        }
        html += `</div></div>`; // Закрываем матрицу
        html += `</div>`; // Закрываем Тюнер

        // 3. БЛОК-СПУТНИК СЛЕВА (Якоря)
        html += `<div class="category-jumpers">`;
        
        const dbState = cur <= M ? 'active' : '';
        const dbTarget = M > 0 ? 1 : 0;
        html += `<button class="jumper-btn db ${dbState}" ${M>0?`data-page="${dbTarget}"`:''} ${M===0?'disabled':''} title="База Данных"><i class="fas fa-database"></i></button>`;

        const suggState = (cur > M && cur <= M + S) ? 'active' : '';
        const suggTarget = S > 0 ? M + 1 : 0;
        html += `<button class="jumper-btn sugg ${suggState}" ${S>0?`data-page="${suggTarget}"`:''} ${S===0?'disabled':''} title="Предложка"><i class="fas fa-star"></i></button>`;

        const ytState = cur > M + S ? 'active' : '';
        const ytTarget = Y > 0 ? M + S + 1 : 0;
        const ytHiddenClass = this.store.currentType === 'games' ? 'is-hidden' : '';
        html += `<button class="jumper-btn yt ${ytState} ${ytHiddenClass}" ${Y>0?`data-page="${ytTarget}"`:''} ${Y===0?'disabled':''} title="YouTube"><i class="fab fa-youtube"></i></button>`;

        html += `</div>`;

        this.els.pageNumbersContainer.innerHTML = html;

        // --- СОБЫТИЯ ---
        this.els.pageNumbersContainer.querySelectorAll('.tuner-slot:not(.active):not(.empty)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                EventBus.emit('PLAY_SOUND', 'hover');
                this.goToPage(parseInt(e.currentTarget.dataset.page));
            });
        });

        this.els.pageNumbersContainer.querySelectorAll('.jumper-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                EventBus.emit('PLAY_SOUND', 'hover');
                this.goToPage(parseInt(e.currentTarget.dataset.page));
            });
        });

        const activeSlot = this.els.pageNumbersContainer.querySelector('.tuner-slot.active');
        if (activeSlot) {
            activeSlot.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.toggleSelector();
            });
        }

        this.els.pageNumbersContainer.querySelectorAll('.matrix-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.goToPage(parseInt(e.currentTarget.dataset.page));
            });
        });
    }

    toggleSelector() {
        const selector = document.getElementById('holo-floor-selector');
        if (!selector) return;
        this.isSelectorOpen = !this.isSelectorOpen;
        selector.classList.toggle('open', this.isSelectorOpen);
        
        const tuner = document.querySelector('.tuner-container');
        if (tuner) tuner.classList.toggle('selector-open', this.isSelectorOpen);
    }

    closeSelector() {
        this.isSelectorOpen = false;
        const selector = document.getElementById('holo-floor-selector');
        const tuner = document.querySelector('.tuner-container');
        if (selector) selector.classList.remove('open');
        if (tuner) tuner.classList.remove('selector-open');
    }
}