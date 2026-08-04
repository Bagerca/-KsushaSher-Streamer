/* js/tierlist-app.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { SynthEngine } from './services/SynthEngine.js';
import { MediaModalManager } from './modal/MediaModalManager.js';
import { YoutubeModalManager } from './modal/YoutubeModalManager.js';

// Встроенный переключатель раскладки для умного поиска
const EN_TO_RU = {'q':'й', 'w':'ц', 'e':'у', 'r':'к', 't':'е', 'y':'н', 'u':'г', 'i':'ш', 'o':'щ', 'p':'з', '[':'х', ']':'ъ', 'a':'ф', 's':'ы', 'd':'в', 'f':'а', 'g':'п', 'h':'р', 'j':'о', 'k':'л', 'l':'д', ';':'ж', "'":'э', 'z':'я', 'x':'ч', 'c':'с', 'v':'м', 'b':'и', 'n':'т', 'm':'ь', ',':'б', '.':'ю'};
function switchLayout(str) {
    let res = '';
    for(let char of str) { res += EN_TO_RU[char] || char; }
    return res;
}

const DEFAULT_TIERS = [
    { id: 'tier_S', color: '#ff2d95', name: 'S' },
    { id: 'tier_A', color: '#ff8c00', name: 'A' },
    { id: 'tier_B', color: '#ffd700', name: 'B' },
    { id: 'tier_C', color: '#39ff14', name: 'C' },
    { id: 'tier_D', color: '#00ccff', name: 'D' },
    { id: 'tier_TRASH', color: '#555555', name: 'TRASH' }
];

class TierMaker {
    constructor() {
        this.board = document.getElementById('tier-board');
        this.pool = document.getElementById('tier-pool');
        this.counterEl = document.getElementById('pool-counter');
        
        // Поиск
        this.searchModule = document.getElementById('search-module');
        this.searchInput = document.getElementById('pool-search');
        this.suggestionsBox = document.getElementById('search-suggestions');
        
        this.currentMode = 'games';
        this.dataBank = []; 
        
        this.draggedCard = null;
        this.draggedRow = null; 
        
        this.tiers = [];

        new SynthEngine();
        new MediaModalManager();
        new YoutubeModalManager();

        this.init();
    }

    async init() {
        this.setupButtons();
        this.setupBoardDropzone(); 
        this.setupSearch();
        await this.loadCategory('games');
    }

    async loadCategory(type) {
        this.currentMode = type;
        this.pool.innerHTML = '<div class="pool-loading"><i class="fas fa-circle-notch fa-spin"></i> СКАНИРОВАНИЕ БАЗЫ...</div>';
        
        document.getElementById('btn-load-games').classList.toggle('active', type === 'games');
        document.getElementById('btn-load-movies').classList.toggle('active', type === 'movies');

        const savedState = JSON.parse(localStorage.getItem(`tierlist_master_${type}`));

        if (savedState && savedState.tiers) {
            this.tiers = savedState.tiers;
        } else {
            this.tiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));
        }

        const itemLocations = savedState ? savedState.items : {};

        const endpoint = type === 'games' ? 'games.json' : 'movies.json';
        let rawData = await loadData(endpoint, []);
        
        this.dataBank = [];
        rawData.forEach(item => {
            if (item.format === 'collection' && item.items) {
                item.items.forEach(sub => this.dataBank.push(sub));
            } else if (item.format !== 'youtube') {
                this.dataBank.push(item);
            }
        });

        this.renderBoard();
        this.pool.innerHTML = '';
        
        this.dataBank.forEach(item => {
            const imgUrl = item.image || (item.images && item.images[0]) || 'https://via.placeholder.com/65x95?text=NO+IMG';
            const savedZoneId = itemLocations[item.title];
            const targetZone = savedZoneId ? document.querySelector(`.tier-content[data-zone="${savedZoneId}"]`) : this.pool;
            
            const cardHTML = `
                <div class="t-card" draggable="true" data-title="${item.title}" data-id="${item.title}">
                    <img src="${imgUrl}" alt="${item.title}">
                </div>
            `;
            
            (targetZone || this.pool).insertAdjacentHTML('beforeend', cardHTML);
        });

        this.bindCardEvents();
        this.updateCounter();
    }

    renderBoard() {
        this.board.innerHTML = '';
        
        this.tiers.forEach((tier) => {
            const row = document.createElement('div');
            row.className = 'tier-row';
            row.dataset.id = tier.id;
            row.draggable = true; 
            row.style.setProperty('--tier-color', tier.color);
            
            row.innerHTML = `
                <div class="tier-label-container">
                    <div class="drag-grip no-capture" title="Перетащить категорию"><i class="fas fa-grip-vertical"></i></div>
                    <div class="tier-label" contenteditable="true" spellcheck="false">${tier.name}</div>
                </div>
                <div class="tier-content dropzone" data-zone="${tier.id}"></div>
                <div class="row-settings no-capture">
                    <div class="color-picker-wrapper" title="Цвет категории">
                        <div class="color-preview"></div>
                        <input type="color" value="${tier.color}">
                    </div>
                    <button class="row-btn delete" title="Удалить категорию"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;

            this.bindRowControls(row, tier);
            this.bindRowDragEvents(row);
            this.setupDropzone(row.querySelector('.tier-content'));
            this.board.appendChild(row);
        });

        this.setupDropzone(this.pool);
    }

    bindRowControls(row, tier) {
        const label = row.querySelector('.tier-label');
        label.addEventListener('blur', () => {
            tier.name = label.textContent.trim() || '???';
            this.syncTiersFromDOM();
            this.saveState();
        });

        const colorInput = row.querySelector('input[type="color"]');
        colorInput.addEventListener('input', (e) => {
            tier.color = e.target.value;
            row.style.setProperty('--tier-color', tier.color);
            this.syncTiersFromDOM();
            this.saveState();
        });

        row.querySelector('.delete').addEventListener('click', () => {
            if (confirm(`Удалить категорию "${tier.name}"? Карточки вернутся в базу.`)) {
                const items = Array.from(row.querySelector('.tier-content').children);
                items.forEach(card => this.pool.appendChild(card));
                row.remove();
                this.syncTiersFromDOM();
                this.saveState();
                this.updateCounter();
            }
        });
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
                this.syncTiersFromDOM();
                this.saveState();
            }
            this.draggedRow = null;
        });
    }

    setupBoardDropzone() {
        this.board.addEventListener('dragover', e => {
            if (!this.draggedRow) return; 
            e.preventDefault();
            
            const afterElement = this.getDragAfterRow(this.board, e.clientY);
            if (afterElement == null) {
                this.board.appendChild(this.draggedRow);
            } else {
                this.board.insertBefore(this.draggedRow, afterElement);
            }
        });
    }

    getDragAfterRow(container, y) {
        const draggableElements = [...container.querySelectorAll('.tier-row:not(.is-dragging-row)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            }
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
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                }
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupDropzone(zone) {
        zone.addEventListener('dragover', e => {
            if (!this.draggedCard) return; 
            e.preventDefault(); 
            zone.classList.add('drag-over');

            const afterElement = this.getDragAfterElement(zone, e.clientX, e.clientY);
            if (afterElement == null) {
                zone.appendChild(this.draggedCard);
            } else {
                zone.insertBefore(this.draggedCard, afterElement);
            }
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
            if (!this.draggedCard) return;
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            this.saveState();
            this.updateCounter();
        });
    }

    bindCardEvents() {
        const cards = document.querySelectorAll('.t-card');
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.stopPropagation(); 
                this.draggedCard = card;
                setTimeout(() => card.classList.add('is-dragging'), 0);
            });
            
            card.addEventListener('dragend', () => {
                if(this.draggedCard) {
                    this.draggedCard.classList.remove('is-dragging');
                    this.saveState(); 
                    this.updateCounter();
                }
                this.draggedCard = null;
            });

            card.addEventListener('contextmenu', (e) => {
                e.preventDefault(); 
                const itemTitle = card.dataset.id;
                const item = this.dataBank.find(i => i.title === itemTitle);
                
                if (item) {
                    EventBus.emit('PLAY_SOUND', 'expand'); 
                    if (item.format === 'youtube') {
                        EventBus.emit('MODAL_OPEN_YOUTUBE', { item, triggerElement: card });
                    } else {
                        EventBus.emit('MODAL_OPEN_MEDIA', { item, type: this.currentMode, triggerElement: card });
                    }
                }
            });
        });
    }

    syncTiersFromDOM() {
        const newTiers = [];
        this.board.querySelectorAll('.tier-row').forEach(row => {
            const id = row.dataset.id;
            const name = row.querySelector('.tier-label').textContent.trim() || '???';
            const color = row.querySelector('input[type="color"]').value;
            newTiers.push({ id, name, color });
        });
        this.tiers = newTiers;
    }

    updateCounter() {
        const unassigned = this.pool.querySelectorAll('.t-card').length;
        this.counterEl.textContent = `ОСТАЛОСЬ: ${unassigned}`;
        if (unassigned === 0) {
            this.counterEl.style.color = '#39ff14';
            this.counterEl.style.borderColor = '#39ff14';
            this.counterEl.style.background = 'rgba(57, 255, 20, 0.1)';
        } else {
            this.counterEl.style.color = '#fff';
            this.counterEl.style.borderColor = 'var(--neon-green)';
            this.counterEl.style.background = 'transparent';
        }
    }

    // ИМБОВЫЙ ПОИСКОВИК
    setupSearch() {
        let debounceTimer;

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }
        });

        // Закрываем по клику вне
        document.addEventListener('click', (e) => {
            if (!this.searchModule.contains(e.target)) {
                this.toggleSuggestions(false);
            }
        });

        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const hotkeyHint = document.getElementById('search-hotkey-hint');
            if (hotkeyHint) hotkeyHint.style.opacity = query.length > 0 ? '0' : '1';

            clearTimeout(debounceTimer);

            if (query.length === 0) {
                this.toggleSuggestions(false);
                this.filterGlobalPool(''); // Сброс
                return;
            }

            debounceTimer = setTimeout(() => {
                this.renderSuggestions(query);
            }, 300);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.toggleSuggestions(false);
                this.filterGlobalPool(this.searchInput.value.toLowerCase().trim());
            } else if (e.key === 'Escape') {
                this.toggleSuggestions(false);
            }
        });
    }

    toggleSuggestions(isOpen) {
        this.suggestionsBox.classList.toggle('active', isOpen);
        this.searchModule.classList.toggle('suggestions-open', isOpen);
    }

    renderSuggestions(query) {
        const layoutSwitched = switchLayout(query);
        
        // Ищем совпадения ТОЛЬКО среди карточек, которые лежат в ПУЛЕ (не в тирах)
        const poolCards = Array.from(this.pool.querySelectorAll('.t-card'));
        
        const matches = poolCards.filter(card => {
            const title = card.dataset.title.toLowerCase();
            return title.includes(query) || title.includes(layoutSwitched);
        }).slice(0, 8); // Показываем максимум 8 результатов в подсказке

        if (matches.length === 0) {
            this.suggestionsBox.innerHTML = '<div style="padding: 15px; color: #888; text-align: center;">Ничего не найдено в базе</div>';
        } else {
            this.suggestionsBox.innerHTML = matches.map(card => {
                const title = card.dataset.title;
                const img = card.querySelector('img').src;
                return `
                    <div class="suggestion-item" data-title="${title}">
                        <img src="${img}" class="sugg-thumb">
                        <span class="sugg-title">${title}</span>
                    </div>
                `;
            }).join('');

            // Клик по подсказке применяет фильтр на всё
            this.suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.searchInput.value = item.dataset.title;
                    this.toggleSuggestions(false);
                    this.filterGlobalPool(item.dataset.title.toLowerCase());
                });
            });
        }
        
        this.toggleSuggestions(true);
    }

    filterGlobalPool(query) {
        const layoutSwitched = switchLayout(query);
        const poolCards = this.pool.querySelectorAll('.t-card');
        
        poolCards.forEach(card => {
            const title = card.dataset.title.toLowerCase();
            if (query === '' || title.includes(query) || title.includes(layoutSwitched)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    setupButtons() {
        document.getElementById('btn-load-games').addEventListener('click', () => this.loadCategory('games'));
        document.getElementById('btn-load-movies').addEventListener('click', () => this.loadCategory('movies'));

        document.getElementById('btn-add-row').addEventListener('click', () => {
            const newId = 'tier_' + Date.now().toString(36);
            this.tiers.push({ id: newId, color: '#888888', name: 'NEW' });
            
            const row = document.createElement('div');
            row.className = 'tier-row';
            row.dataset.id = newId;
            row.draggable = true; 
            row.style.setProperty('--tier-color', '#888888');
            
            row.innerHTML = `
                <div class="tier-label-container">
                    <div class="drag-grip no-capture" title="Перетащить категорию"><i class="fas fa-grip-vertical"></i></div>
                    <div class="tier-label" contenteditable="true" spellcheck="false">NEW</div>
                </div>
                <div class="tier-content dropzone" data-zone="${newId}"></div>
                <div class="row-settings no-capture">
                    <div class="color-picker-wrapper" title="Цвет категории">
                        <div class="color-preview"></div>
                        <input type="color" value="#888888">
                    </div>
                    <button class="row-btn delete" title="Удалить категорию"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            const tierObj = this.tiers[this.tiers.length - 1];
            this.bindRowControls(row, tierObj);
            this.bindRowDragEvents(row);
            this.setupDropzone(row.querySelector('.tier-content'));
            this.board.appendChild(row);
            
            this.saveState();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if(confirm('Сбросить весь тирлист к заводским настройкам? Все данные будут утеряны.')) {
                localStorage.removeItem(`tierlist_master_${this.currentMode}`);
                this.loadCategory(this.currentMode);
            }
        });

        document.getElementById('btn-export-json').addEventListener('click', () => {
            const exportData = {
                metadata: { generatedAt: new Date().toISOString(), category: this.currentMode },
                tiers: this.tiers.map(t => {
                    const zone = document.querySelector(`.tier-content[data-zone="${t.id}"]`);
                    const items = zone ? Array.from(zone.querySelectorAll('.t-card')).map(c => c.dataset.id) : [];
                    return { id: t.id, name: t.name, color: t.color, items: items };
                }),
                unassigned: Array.from(this.pool.querySelectorAll('.t-card')).map(c => c.dataset.id)
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `TierList_Data_${this.currentMode}_${Date.now()}.json`);
            dlAnchorElem.click();
        });

        document.getElementById('btn-export-png').addEventListener('click', async () => {
            const btn = document.getElementById('btn-export-png');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ОБРАБОТКА...';
            
            // ИСПРАВЛЕНИЕ: Идеальный экспорт PNG. Убираем ВСЕ ограничения высоты, снимаем скриншот всей страницы
            window.scrollTo(0, 0);
            document.body.classList.add('is-exporting');
            
            // Ждем 2 фрейма для перестроения DOM без overflow:hidden
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            
            const captureZone = document.getElementById('capture-zone');
            
            try {
                const canvas = await html2canvas(captureZone, {
                    backgroundColor: '#050508', 
                    scale: 2, 
                    logging: false,
                    useCORS: true,
                    scrollY: -window.scrollY // Защита от сдвигов
                });

                const link = document.createElement('a');
                link.download = `Tetla_TierList_${this.currentMode}_${new Date().toLocaleDateString()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                alert('Ошибка при сохранении: ' + err.message);
            }
            
            document.body.classList.remove('is-exporting');
            btn.innerHTML = '<i class="fas fa-camera"></i> PNG';
        });
    }

    collectItemsState() {
        const state = {};
        document.querySelectorAll('.tier-content').forEach(zone => {
            const zoneId = zone.dataset.zone;
            zone.querySelectorAll('.t-card').forEach(card => {
                state[card.dataset.id] = zoneId;
            });
        });
        return state;
    }

    saveState() {
        const masterState = { tiers: this.tiers, items: this.collectItemsState() };
        localStorage.setItem(`tierlist_master_${this.currentMode}`, JSON.stringify(masterState));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TierMaker();
});