/* js/tierlist/TierlistBoard.js */

export class TierlistBoard {
    constructor(controller) {
        this.ctrl = controller;
        this.boardEl = document.getElementById('tier-board');
        this.setupAddButton();
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        
        this.ctrl.tiers.forEach(tier => {
            this.createRow(tier);
        });

        if (this.ctrl.isEditMode) {
            this.ctrl.dragDrop.setupDropzone(this.ctrl.poolEl);
        }
    }

    createRow(tier) {
        const row = document.createElement('div');
        row.className = 'tier-row';
        row.dataset.id = tier.id;
        row.draggable = this.ctrl.isEditMode; 
        row.style.setProperty('--tier-color', tier.color);
        
        const contentAttr = this.ctrl.isEditMode ? 'contenteditable="true"' : 'contenteditable="false"';

        row.innerHTML = `
            <div class="tier-label-container">
                <div class="drag-grip no-capture edit-only" title="Перетащить категорию"><i class="fas fa-grip-vertical"></i></div>
                <div class="tier-label" ${contentAttr} spellcheck="false">${tier.name}</div>
            </div>
            <div class="tier-content dropzone" data-zone="${tier.id}"></div>
            
            <div class="row-settings no-capture edit-only">
                <div class="color-picker-wrapper" title="Цвет категории">
                    <div class="color-preview"></div>
                    <input type="color" value="${tier.color}">
                </div>
                <button class="row-btn delete" title="Удалить категорию"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        if (this.ctrl.isEditMode) {
            this.bindRowControls(row, tier);
            this.ctrl.dragDrop.bindRowDragEvents(row);
            this.ctrl.dragDrop.setupDropzone(row.querySelector('.tier-content'));
        }
        
        this.boardEl.appendChild(row);
    }

    bindRowControls(row, tier) {
        const label = row.querySelector('.tier-label');
        label.addEventListener('blur', () => {
            tier.name = label.textContent.trim() || '???';
            this.syncTiersFromDOM();
            this.ctrl.saveState();
        });

        const colorInput = row.querySelector('input[type="color"]');
        colorInput.addEventListener('input', (e) => {
            tier.color = e.target.value;
            row.style.setProperty('--tier-color', tier.color);
            this.syncTiersFromDOM();
            this.ctrl.saveState();
        });

        row.querySelector('.delete').addEventListener('click', () => {
            if (confirm(`Удалить категорию "${tier.name}"? Карточки вернутся в базу.`)) {
                const items = Array.from(row.querySelector('.tier-content').children);
                items.forEach(card => this.ctrl.poolEl.appendChild(card));
                row.remove();
                this.syncTiersFromDOM();
                this.ctrl.saveState();
                this.ctrl.updateCounter();
            }
        });
    }

    syncTiersFromDOM() {
        const newTiers = [];
        this.boardEl.querySelectorAll('.tier-row').forEach(row => {
            const id = row.dataset.id;
            const name = row.querySelector('.tier-label').textContent.trim() || '???';
            const color = row.querySelector('input[type="color"]').value;
            newTiers.push({ id, name, color });
        });
        this.ctrl.tiers = newTiers;
    }

    setupAddButton() {
        document.getElementById('btn-add-row').addEventListener('click', () => {
            if (!this.ctrl.isEditMode) return;
            const newId = 'tier_' + Date.now().toString(36);
            const newTier = { id: newId, color: '#888888', name: 'NEW' };
            
            this.ctrl.tiers.push(newTier);
            this.createRow(newTier);
            this.ctrl.saveState();
        });
    }
}