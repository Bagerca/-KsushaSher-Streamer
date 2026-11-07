/* js/tierlist/TierlistDragDrop.js */
import EventBus from '../event-bus.js';
import { AppRouter } from '../router.js';

export class TierlistDragDrop {
    constructor(controller) {
        this.ctrl = controller;
        this.draggedCard = null;
        this.draggedRow = null;
        
        this.setupBoardDropzone();
    }

    bindRowDragEvents(row) {
        row.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('t-card') || e.target.closest('.t-card')) return;
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
        this.ctrl.board.boardEl.addEventListener('dragover', e => {
            if (!this.ctrl.isEditMode || !this.draggedRow) return; 
            e.preventDefault();
            const afterElement = this.getDragAfterRow(this.ctrl.board.boardEl, e.clientY);
            if (afterElement == null) {
                this.ctrl.board.boardEl.appendChild(this.draggedRow);
            } else {
                this.ctrl.board.boardEl.insertBefore(this.draggedRow, afterElement);
            }
        });
    }

    getDragAfterRow(container, y) {
        const draggableElements = [...container.querySelectorAll('.tier-row:not(.is-dragging-row)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.t-card:not(.is-dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const inSameRow = y >= box.top && y <= box.bottom;
            if (inSameRow) {
                const offset = x - box.left - box.width / 2;
                if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; }
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupDropzone(zone) {
        zone.addEventListener('dragover', e => {
            if (!this.ctrl.isEditMode || !this.draggedCard) return; 
            e.preventDefault(); 
            zone.classList.add('drag-over');

            const afterElement = this.getDragAfterElement(zone, e.clientX, e.clientY);
            if (afterElement == null) {
                zone.appendChild(this.draggedCard);
            } else {
                zone.insertBefore(this.draggedCard, afterElement);
            }
        });

        zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });

        zone.addEventListener('drop', e => {
            if (!this.ctrl.isEditMode || !this.draggedCard) return;
            e.preventDefault();
            zone.classList.remove('drag-over');
            this.ctrl.saveState();
            this.ctrl.updateCounter();
        });
    }

    bindCardEvents() {
        const cards = document.querySelectorAll('.t-card');
        cards.forEach(card => {
            
            card.addEventListener('dragstart', (e) => {
                if (!this.ctrl.isEditMode) { e.preventDefault(); return; }
                e.stopPropagation(); 
                this.draggedCard = card;
                setTimeout(() => card.classList.add('is-dragging'), 0);
            });
            
            card.addEventListener('dragend', () => {
                if (!this.ctrl.isEditMode) return;
                if(this.draggedCard) {
                    this.draggedCard.classList.remove('is-dragging');
                    this.ctrl.saveState(); 
                    this.ctrl.updateCounter();
                }
                this.draggedCard = null;
            });

            card.addEventListener('contextmenu', (e) => {
                e.preventDefault(); 
                const itemTitle = card.dataset.id;
                const item = this.ctrl.dataBank.find(i => i.title === itemTitle);
                
                if (item) {
                    EventBus.emit('PLAY_SOUND', 'expand'); 
                    // ИСПРАВЛЕНИЕ: Добавляем метку откуда пришли
                    AppRouter.navigate('/item', { id: item.id || item.title }, { from: 'tierlist' });
                }
            });
        });
    }
}