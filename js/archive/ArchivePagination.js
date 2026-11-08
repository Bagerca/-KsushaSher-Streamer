/* js/archive/ArchivePagination.js */
import EventBus from '../event-bus.js';

export class ArchivePagination {
    constructor(callbacks) {
        this.onPageChange = callbacks.onPageChange;
        
        this.els = {
            controlsDiv: document.getElementById('archive-side-pagination'),
            prevBtn: document.getElementById('page-prev-btn'),
            nextBtn: document.getElementById('page-next-btn'),
            container: document.getElementById('page-numbers-container')
        };

        this.isSelectorOpen = false;
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        this.els.prevBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'hover');
            this.onPageChange(-1);
        });
        
        this.els.nextBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'hover');
            this.onPageChange(1);
        });

        document.addEventListener('click', (e) => {
            if (this.isSelectorOpen && !e.target.closest('#archive-side-pagination')) {
                this.closeSelector();
            }
        });
    }

    render(state) {
        const { totalPages, currentPage, bucketsMeta, type } = state;
        
        if (totalPages <= 1) {
            this.els.controlsDiv.style.display = 'none';
            return;
        }

        this.els.controlsDiv.style.display = 'flex';
        this.els.prevBtn.disabled = currentPage === 1;
        this.els.nextBtn.disabled = currentPage === totalPages;

        let html = `<div class="tuner-container">`;
        html += this.renderTunerSlot(currentPage - 1, 'prev', state);
        html += this.renderTunerSlot(currentPage, 'active', state); 
        html += this.renderTunerSlot(currentPage + 1, 'next', state);

        // Голографическая панель выбора (Сортировка по бакетам)
        html += `<div class="holo-floor-selector" id="holo-floor-selector">
                    <div class="holo-selector-header">ВЫБОР КАТЕГОРИИ</div>
                    <div class="holo-selector-body">`;
                    
        bucketsMeta.forEach(b => {
            if (b.pageCount > 0) {
                let catName = this.getCategoryName(b.id, type);
                let catColor = this.getCategoryColor(b.id);
                
                html += `<div class="sector-label" style="color: ${catColor}">[ ${catName} ]</div><div class="sector-grid">`;
                
                for (let i = b.startPage; i <= b.endPage; i++) {
                    const activeClass = i === currentPage ? 'is-current' : '';
                    const colorClass = `btn-${b.id}`;
                    const localNum = i - b.startPage + 1;
                    html += `<button class="matrix-btn ${colorClass} ${activeClass}" data-page="${i}">${localNum}</button>`;
                }
                
                html += `</div>`;
            }
        });
        html += `</div></div></div>`;

        // 5 КНОПОК-ЯКОРЕЙ КАТЕГОРИЙ СЛЕВА
        html += `<div class="category-jumpers">`;
        bucketsMeta.forEach(b => {
            const isActive = (currentPage >= b.startPage && currentPage <= b.endPage);
            const isDisabled = b.pageCount === 0;
            const targetPage = b.pageCount > 0 ? b.startPage : 0;
            
            // Получаем иконку из нашего локального пака SVG
            const icon = this.getCategoryIcon(b.id);
            const name = this.getCategoryName(b.id, type);
            const btnClass = `jumper-btn j-${b.id} ${isActive ? 'active' : ''}`;
            
            // ИСПРАВЛЕНИЕ: Прячем кнопку если категория пуста (display:none вместо disabled для красоты лифта)
            if (!isDisabled) {
                html += `<button class="${btnClass}" data-page="${targetPage}" title="${name}">
                            <i class="${icon}"></i>
                         </button>`;
            }
        });
        html += `</div>`;

        this.els.container.innerHTML = html;
        this.bindDynamicEvents();
    }

    getCategoryName(id, type) {
        if (id === 'completed') return type === 'movies' ? 'ПОСМОТРЕНО' : 'ПРОЙДЕНО';
        if (id === 'playing') return type === 'movies' ? 'СМОТРИМ' : 'В ПРОЦЕССЕ';
        if (id === 'on-hold') return 'НА ПАУЗЕ';
        if (id === 'dropped') return 'БРОШЕНО';
        if (id === 'suggested') return 'ПРЕДЛОЖКА';
        return 'UNKNOWN';
    }

    getCategoryColor(id) {
        if (id === 'completed') return 'var(--color-neon-green)';
        if (id === 'playing') return 'var(--color-accent-blue)';
        if (id === 'on-hold') return 'var(--color-warning-yellow)';
        if (id === 'dropped') return 'var(--color-danger-red)';
        if (id === 'suggested') return 'var(--color-neon-pink)';
        return '#ffffff';
    }

    getCategoryIcon(id) {
        // ИСПРАВЛЕНИЕ: Используем только те иконки, что собраны скриптом 1_fetch_icons.py
        if (id === 'completed') return 'fas fa-medal';
        if (id === 'playing') return 'fas fa-play';
        if (id === 'on-hold') return 'fas fa-pause';
        if (id === 'dropped') return 'fas fa-times';
        if (id === 'suggested') return 'fas fa-star';
        return 'fas fa-circle-notch';
    }

    getPageMetadata(pageIndex, state) {
        const { totalPages, bucketsMeta } = state;
        if (pageIndex < 1 || pageIndex > totalPages) return null;
        
        const bucket = bucketsMeta.find(b => pageIndex >= b.startPage && pageIndex <= b.endPage);
        if (!bucket) return null;
        
        return {
            raw: pageIndex,
            num: pageIndex - bucket.startPage + 1,
            bucketId: bucket.id
        };
    }

    renderTunerSlot(pageIndex, stateClass, state) {
        const meta = this.getPageMetadata(pageIndex, state);
        if (!meta) return `<button class="tuner-slot empty">[--]</button>`;
        return `<button class="tuner-slot ${stateClass} btn-${meta.bucketId}" data-page="${meta.raw}" title="Страница ${meta.raw}">${meta.num}</button>`;
    }

    bindDynamicEvents() {
        this.els.container.querySelectorAll('.tuner-slot:not(.active):not(.empty), .jumper-btn:not(:disabled), .matrix-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                EventBus.emit('PLAY_SOUND', 'hover');
                this.onPageChange(parseInt(e.currentTarget.dataset.page), true);
            });
        });

        const activeSlot = this.els.container.querySelector('.tuner-slot.active');
        if (activeSlot) {
            activeSlot.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.toggleSelector();
            });
        }
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