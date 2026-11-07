/* js/archive/ArchivePagination.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';

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
        const { totalPages, currentPage, mainPages, suggPages } = state;

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

        // Голографическая панель выбора (Убрали YouTube)
        html += `<div class="holo-floor-selector" id="holo-floor-selector">
                    <div class="holo-selector-header">ВЫБОР СЕКТОРА</div>
                    <div class="holo-selector-body">`;
                    
        let currentTypeRendered = null;
        for (let i = 1; i <= totalPages; i++) {
            const meta = this.getPageMetadata(i, state);
            if (meta.type !== currentTypeRendered) {
                if (currentTypeRendered !== null) html += `</div>`; 
                let sectorTitle = meta.type === 'main' ? 'MAIN_DB' : 'SUGGESTIONS';
                let sectorColor = meta.type === 'main' ? 'var(--neon-green)' : 'var(--neon-pink)';
                html += `<div class="sector-label" style="color: ${sectorColor}">[ ${sectorTitle} ]</div><div class="sector-grid">`;
                currentTypeRendered = meta.type;
            }
            const activeClass = i === currentPage ? 'is-current' : '';
            html += `<button class="matrix-btn ${meta.colorClass} ${activeClass}" data-page="${meta.raw}">${meta.num}</button>`;
        }
        html += `</div></div></div>`; 

        // Якоря прыжков (Категории) - Только База и Предложка
        html += `<div class="category-jumpers">`;
        const dbState = currentPage <= mainPages ? 'active' : '';
        const dbTarget = mainPages > 0 ? 1 : 0;
        html += `<button class="jumper-btn db ${dbState}" ${mainPages>0?`data-page="${dbTarget}"`:''} ${mainPages===0?'disabled':''} title="База Данных"><i class="fas fa-database"></i></button>`;

        const suggState = currentPage > mainPages ? 'active' : '';
        const suggTarget = suggPages > 0 ? mainPages + 1 : 0;
        html += `<button class="jumper-btn sugg ${suggState}" ${suggPages>0?`data-page="${suggTarget}"`:''} ${suggPages===0?'disabled':''} title="Предложка"><i class="fas fa-star"></i></button>`;

        html += `</div>`;

        this.els.container.innerHTML = html;
        this.bindDynamicEvents();
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

    getPageMetadata(pageIndex, state) {
        const { totalPages, mainPages } = state;
        if (pageIndex < 1 || pageIndex > totalPages) return null;
        if (pageIndex <= mainPages) return { raw: pageIndex, num: pageIndex, type: 'main', colorClass: '' };
        return { raw: pageIndex, num: pageIndex - mainPages, type: 'sugg', colorClass: 'sugg-page-btn' };
    }

    renderTunerSlot(pageIndex, stateClass, state) {
        const meta = this.getPageMetadata(pageIndex, state);
        if (!meta) return `<button class="tuner-slot empty">[--]</button>`;
        return `<button class="tuner-slot ${stateClass} ${meta.colorClass}" data-page="${meta.raw}" title="Этаж ${meta.raw}">${meta.num}</button>`;
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