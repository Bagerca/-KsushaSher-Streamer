/* js/tierlist/TierlistDragDrop.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';

/**
 * Drag & Drop тирлиста.
 * Dropzone-слушатели навешиваются один раз на узел (WeakSet),
 * поэтому повторные рендеры не размножают обработчики.
 */
export class TierlistDragDrop {
    constructor(controller) {
        this.ctrl = controller;
        this.draggedCard = null;
        this.draggedRow = null;
        this.boundZones = new WeakSet();
        this.setupBoardDropzone();
    }

    bindRowDragEvents(row) {
        if (row.dataset.dragBound === '1') return;
        row.dataset.dragBound = '1';

        row.addEventListener('dragstart', (e) => {
            if (e.target.closest('.t-card')) return;
            this.draggedRow = row;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => row.classList.add('is-dragging-row'), 0);
        });

        row.addEventListener('dragend', () => {
            if (this.draggedRow) {
                this.draggedRow.classList.remove('is-dragging-row');
                this.ctrl.board.syncTiersFromDOM();
                this.ctrl.saveState();
            }
            this.draggedRow = null;
        });
    }

    setupBoardDropzone() {
        const boardEl = this.ctrl.board.boardEl;
        if (!boardEl || this.boundZones.has(boardEl)) return;
        this.boundZones.add(boardEl);

        boardEl.addEventListener('dragover', (e) => {
            if (!this.ctrl.isEditMode || !this.draggedRow) return;
            e.preventDefault();
            const after = this.getDragAfterRow(boardEl, e.clientY);
            if (after == null) boardEl.appendChild(this.draggedRow);
            else boardEl.insertBefore(this.draggedRow, after);
        });
    }

    getDragAfterRow(container, y) {
        const rows = [...container.querySelectorAll('.tier-row:not(.is-dragging-row)')];
        return rows.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    getDragAfterElement(container, x, y) {
        const cards = [...container.querySelectorAll('.t-card:not(.is-dragging)')];
        return cards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            if (y >= box.top && y <= box.bottom) {
                const offset = x - box.left - box.width / 2;
                if (offset < 0 && offset > closest.offset) return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupDropzone(zone) {
        if (!zone || this.boundZones.has(zone)) return;
        this.boundZones.add(zone);

        zone.addEventListener('dragover', (e) => {
            if (!this.ctrl.isEditMode || !this.draggedCard) return;
            e.preventDefault();
            zone.classList.add('drag-over');
            const after = this.getDragAfterElement(zone, e.clientX, e.clientY);
            if (after == null) zone.appendChild(this.draggedCard);
            else zone.insertBefore(this.draggedCard, after);
        });

        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

        zone.addEventListener('drop', (e) => {
            if (!this.ctrl.isEditMode || !this.draggedCard) return;
            e.preventDefault();
            zone.classList.remove('drag-over');
            this.ctrl.saveState();
            this.ctrl.updateCounter();
        });
    }

    bindCardEvents() {
        const root = this.ctrl.container;
        if (!root) return;

        root.querySelectorAll('.t-card').forEach(card => {
            if (card.dataset.bound === '1') return;
            card.dataset.bound = '1';

            card.addEventListener('dragstart', (e) => {
                if (!this.ctrl.isEditMode) { e.preventDefault(); return; }
                e.stopPropagation();
                this.draggedCard = card;
                setTimeout(() => card.classList.add('is-dragging'), 0);
            });

            card.addEventListener('dragend', () => {
                if (!this.ctrl.isEditMode) return;
                if (this.draggedCard) {
                    this.draggedCard.classList.remove('is-dragging');
                    this.ctrl.saveState();
                    this.ctrl.updateCounter();
                }
                this.draggedCard = null;
            });

            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const title = card.dataset.id;
                const item = this.ctrl.findBankItem(title);
                if (!item) {
                    console.warn(`⚠️ [Tierlist] Объект "${title}" не найден в базе категории.`);
                    return;
                }
                EventBus.emit('PLAY_SOUND', 'expand');
                const query = { from: 'tierlist' };
                if (this.ctrl.isEditMode) query.edit = '1';
                AppRouter.navigate('/item', { id: item.id || item.title }, query);
            });
        });
    }
}