/* js/tierlist/TierlistController.js */
import { loadData } from '../api.js';
import { TierlistBoard } from './TierlistBoard.js';
import { TierlistDragDrop } from './TierlistDragDrop.js';
import { TierlistSearch } from './TierlistSearch.js';
import { TierlistExporter } from './TierlistExporter.js';
import { AppRouter } from '../router.js'; 

export const DEFAULT_TIERS = [
    { id: 'tier_S', color: '#ff2d95', name: 'S' },
    { id: 'tier_A', color: '#ff8c00', name: 'A' },
    { id: 'tier_B', color: '#ffd700', name: 'B' },
    { id: 'tier_C', color: '#39ff14', name: 'C' },
    { id: 'tier_D', color: '#00ccff', name: 'D' },
    { id: 'tier_TRASH', color: '#555555', name: 'TRASH' }
];

export class TierlistController {
    constructor() {
        this.container = document.getElementById('tierlist-app');
        if (!this.container) return;

        this.poolEl = document.getElementById('tier-pool');
        this.counterEl = document.getElementById('pool-counter');
        
        this.currentMode = 'games'; 
        this.dataBank = []; 
        this.tiers = [];
        this.isEditMode = false;

        this.board = new TierlistBoard(this);
        this.dragDrop = new TierlistDragDrop(this);
        this.search = new TierlistSearch(this);
        this.exporter = new TierlistExporter(this);

        this.init();
    }

    async init() {
        this.setupButtons();
        await this.loadCategory('games');
    }

    // ДОБАВЛЕНО В ШАГЕ 3: Lifecycle Хуки
    mount() {
        // Вызывается когда роутер включает тирлист
        console.log('📋 [Tierlist] Успешный Mount компонента');
    }

    unmount() {
        // Вызывается когда уходим с тирлиста
        if (this.isEditMode) {
            this.toggleEditMode(false);
        }
        console.log('📋 [Tierlist] Успешный Unmount компонента');
    }

    async loadCategory(type) {
        this.currentMode = type;
        this.poolEl.innerHTML = '<div class="pool-loading"><i class="fas fa-circle-notch fa-spin"></i> СКАНИРОВАНИЕ БАЗЫ...</div>';
        
        document.getElementById('btn-load-games').classList.toggle('active', type === 'games');
        document.getElementById('btn-load-movies').classList.toggle('active', type === 'movies');

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

        if (this.isEditMode) {
            await this.renderEditState(type);
        } else {
            await this.renderStaticState(type);
        }

        this.dragDrop.bindCardEvents(); 
    }

    async renderStaticState(type) {
        let staticFile = type === 'games' ? 'tierlist-static-games.json' : 'tierlist-static-movies.json';
        let staticData = await loadData(staticFile, null);

        if (!staticData || !staticData.tiers) {
            this.tiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));
            this.board.renderBoard();
            return;
        }

        this.tiers = staticData.tiers;
        this.board.renderBoard();

        staticData.tiers.forEach(tier => {
            const zone = document.querySelector(`.tier-content[data-zone="${tier.id}"]`);
            if (!zone) return;

            tier.items.forEach(itemId => {
                const item = this.dataBank.find(i => i.title === itemId);
                if (item) {
                    const imgUrl = item.image || (item.images && item.images[0]) || 'https://via.placeholder.com/65x95?text=NO+IMG';
                    const cardHTML = `
                        <div class="t-card" draggable="false" data-title="${item.title}" data-id="${item.title}">
                            <img src="${imgUrl}" alt="${item.title}">
                        </div>
                    `;
                    zone.insertAdjacentHTML('beforeend', cardHTML);
                }
            });
        });
    }

    async renderEditState(type) {
        const savedState = JSON.parse(localStorage.getItem(`tierlist_master_${type}`));

        this.tiers = (savedState && savedState.tiers) 
            ? savedState.tiers 
            : JSON.parse(JSON.stringify(DEFAULT_TIERS));

        const itemLocations = savedState ? savedState.items : {};

        this.board.renderBoard();
        this.poolEl.innerHTML = '';
        
        this.dataBank.forEach(item => {
            const imgUrl = item.image || (item.images && item.images[0]) || 'https://via.placeholder.com/65x95?text=NO+IMG';
            const savedZoneId = itemLocations[item.title];
            const targetZone = savedZoneId ? document.querySelector(`.tier-content[data-zone="${savedZoneId}"]`) : this.poolEl;
            
            const cardHTML = `
                <div class="t-card" draggable="true" data-title="${item.title}" data-id="${item.title}">
                    <img src="${imgUrl}" alt="${item.title}">
                </div>
            `;
            
            (targetZone || this.poolEl).insertAdjacentHTML('beforeend', cardHTML);
        });

        this.updateCounter();
    }

    toggleEditMode(enable) {
        this.isEditMode = enable;
        
        if (enable) {
            this.container.classList.remove('view-mode');
            this.container.classList.add('edit-mode');
        } else {
            this.container.classList.add('view-mode');
            this.container.classList.remove('edit-mode');
        }

        this.loadCategory(this.currentMode);
    }

    updateCounter() {
        if (!this.isEditMode) return;
        const unassigned = this.poolEl.querySelectorAll('.t-card').length;
        this.counterEl.textContent = `ОСТАЛОСЬ: ${unassigned}`;
        if (unassigned === 0) {
            this.counterEl.style.color = '#39ff14';
            this.counterEl.style.borderColor = '#39ff14';
            this.counterEl.style.background = 'rgba(57, 255, 20, 0.1)';
        } else {
            this.counterEl.style.color = '#fff';
            this.counterEl.style.borderColor = 'var(--color-neon-green)';
            this.counterEl.style.background = 'transparent';
        }
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
        if (!this.isEditMode) return;
        const masterState = { tiers: this.tiers, items: this.collectItemsState() };
        localStorage.setItem(`tierlist_master_${this.currentMode}`, JSON.stringify(masterState));
    }

    setupButtons() {
        const btnHome = document.getElementById('btn-back-home');
        if (btnHome) {
            btnHome.addEventListener('click', () => {
                AppRouter.navigate('/'); 
            });
        }

        document.getElementById('btn-enable-edit').addEventListener('click', () => this.toggleEditMode(true));
        document.getElementById('btn-exit-edit').addEventListener('click', () => this.toggleEditMode(false));

        document.getElementById('btn-load-games').addEventListener('click', () => this.loadCategory('games'));
        document.getElementById('btn-load-movies').addEventListener('click', () => this.loadCategory('movies'));

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (!this.isEditMode) return;
            if(confirm('Сбросить весь тирлист к заводским настройкам? Все данные будут утеряны.')) {
                localStorage.removeItem(`tierlist_master_${this.currentMode}`);
                this.loadCategory(this.currentMode);
            }
        });
    }
}