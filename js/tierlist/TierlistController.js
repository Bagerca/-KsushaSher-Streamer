/* js/tierlist/TierlistController.js */
import { loadData } from '../api.js';
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';
import { TierlistBoard } from './TierlistBoard.js';
import { TierlistDragDrop } from './TierlistDragDrop.js';
import { TierlistSearch } from './TierlistSearch.js';
import { TierlistExporter } from './TierlistExporter.js';

export const DEFAULT_TIERS = [
  { id: 'tier_S', color: '#ff2d95', name: 'S' },
  { id: 'tier_A', color: '#ff8c00', name: 'A' },
  { id: 'tier_B', color: '#ffd700', name: 'B' },
  { id: 'tier_C', color: '#39ff14', name: 'C' },
  { id: 'tier_D', color: '#00ccff', name: 'D' },
  { id: 'tier_TRASH', color: '#555555', name: 'TRASH' }
];

function escapeAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Тирлист, управляемый адресом:
 *   #/tierlist/games        — просмотр
 *   #/tierlist/movies?edit=1 — редактирование
 * Категория и режим больше не живут в приватных полях контроллера.
 */
export class TierlistController {
  constructor() {
    this.container = document.getElementById('tierlist-app');
    if (!this.container) return;

    this.poolEl = document.getElementById('tier-pool');
    this.counterEl = document.getElementById('pool-counter');
    this.btnGames = document.getElementById('btn-load-games');
    this.btnMovies = document.getElementById('btn-load-movies');

    this.currentMode = 'games';
    this.dataBank = [];
    this.tiers = [];
    this.isEditMode = false;
    this.loadToken = 0;
    this.loadedKey = null;

    this.board = new TierlistBoard(this);
    this.dragDrop = new TierlistDragDrop(this);
    this.search = new TierlistSearch(this);
    this.exporter = new TierlistExporter(this);

    this.setupButtons();
    this.subscribeToStore();
    this.applyModeClasses();
    console.log('📋 [Tierlist] Контроллер инициализирован (URL-driven)');
  }

  /* ==================== LIFECYCLE ==================== */

  mount() {
    const route = AppStore.getState().route;
    this.ensureLoaded(this.resolveType(route), route.query.edit === '1');
    console.log(`📋 [Tierlist] Mount: ${this.currentMode} / ${this.isEditMode ? 'EDIT' : 'VIEW'}`);
  }

  unmount() {
    this.loadToken++;
    this.loadedKey = null;
    this.exporter.cleanup();
    this.search.reset();
    console.log('📋 [Tierlist] Компонент размонтирован');
  }

  resolveType(route) {
    if (route.params && (route.params.type === 'games' || route.params.type === 'movies')) return route.params.type;
    return AppStore.getState().media.type === 'movies' ? 'movies' : 'games';
  }

  subscribeToStore() {
    AppStore.subscribe((state) => {
      if (state.route.path !== '/tierlist') return;
      this.ensureLoaded(this.resolveType(state.route), state.route.query.edit === '1');
    });
  }

  ensureLoaded(type, edit) {
    const key = `${type}|${edit ? '1' : '0'}`;
    if (this.loadedKey === key) return;
    this.loadedKey = key;
    this.isEditMode = edit;
    this.applyModeClasses();
    this.loadCategory(type);
  }

  applyModeClasses() {
    this.container.classList.toggle('edit-mode', this.isEditMode);
    this.container.classList.toggle('view-mode', !this.isEditMode);
  }

  /* ==================== ДАННЫЕ ==================== */

  async loadCategory(type) {
    const token = ++this.loadToken;
    this.currentMode = type;
    if (this.btnGames) this.btnGames.classList.toggle('active', type === 'games');
    if (this.btnMovies) this.btnMovies.classList.toggle('active', type === 'movies');
    this.poolEl.innerHTML = '<div class="pool-loading"><i class="fas fa-circle-notch fa-spin"></i> СКАНИРОВАНИЕ БАЗЫ...</div>';
    this.search.toggleSuggestions(false);

    try {
      const endpoint = type === 'games' ? 'games.json' : 'movies.json';
      const rawData = await loadData(endpoint, []);
      if (token !== this.loadToken) return;

      this.dataBank = [];
      (Array.isArray(rawData) ? rawData : []).forEach(item => {
        if (item.format === 'collection' && Array.isArray(item.items)) {
          item.items.forEach(sub => this.dataBank.push(sub));
        } else if (item.format !== 'youtube') {
          this.dataBank.push(item);
        }
      });

      if (this.isEditMode) await this.renderEditState(type, token);
      else await this.renderStaticState(type, token);
      if (token !== this.loadToken) return;

      this.dragDrop.bindCardEvents();
      AppRouter.setDocumentTitle(`ТИРЛИСТ / ${type === 'movies' ? 'КИНО' : 'ИГРЫ'}`);
      console.log(`📋 [Tierlist] Категория "${type}" отрисована. Объектов: ${this.dataBank.length}`);
    } catch (error) {
      if (token !== this.loadToken) return;
      console.error('🚨 [Tierlist] Ошибка загрузки категории:', error);
      this.poolEl.innerHTML = '<div class="pool-loading">ОШИБКА ЗАГРУЗКИ БАЗЫ</div>';
      this.tiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));
      this.board.renderBoard();
    }
  }

  findBankItem(title) {
    return this.dataBank.find(i => i.title === title) || null;
  }

  cardHtml(item, draggable) {
    const img = item.image || (Array.isArray(item.images) ? item.images[0] : '');
    const title = escapeAttr(item.title);
    const imgTag = img
      ? `<img src="${escapeAttr(img)}" alt="${title}" loading="lazy">`
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--color-bg-medium);color:var(--color-text-muted);font-family:var(--font-header);">?</div>';
    return `<div class="t-card" draggable="${draggable ? 'true' : 'false'}" data-title="${title}" data-id="${title}">${imgTag}</div>`;
  }

  async renderStaticState(type, token) {
    const staticFile = type === 'games' ? 'tierlist-static-games.json' : 'tierlist-static-movies.json';
    const staticData = await loadData(staticFile, null);
    if (token !== this.loadToken) return;

    this.tiers = (staticData && Array.isArray(staticData.tiers) && staticData.tiers.length > 0)
      ? staticData.tiers.map(t => ({ id: t.id, name: t.name, color: t.color, items: t.items || [] }))
      : JSON.parse(JSON.stringify(DEFAULT_TIERS));

    this.board.renderBoard();
    this.poolEl.innerHTML = '';

    let placed = 0;
    this.tiers.forEach(tier => {
      const zone = this.board.boardEl.querySelector(`.tier-content[data-zone="${tier.id}"]`);
      if (!zone || !Array.isArray(tier.items)) return;
      tier.items.forEach(title => {
        const item = this.findBankItem(title);
        if (!item) return;
        zone.insertAdjacentHTML('beforeend', this.cardHtml(item, false));
        placed++;
      });
    });

    if (placed === 0) {
      this.board.boardEl.insertAdjacentHTML('beforeend',
        '<div class="schedule-empty"><i class="fas fa-list"></i><br>ЭТА БАЗА ЕЩЁ НЕ РАСПРЕДЕЛЕНА<br><span style="font-size:0.8rem;">Нажмите «ИЗМЕНИТЬ», чтобы собрать тирлист</span></div>');
    }
  }

  async renderEditState(type, token) {
    const saved = this.readSavedState(type);
    if (token !== this.loadToken) return;

    this.tiers = (saved && Array.isArray(saved.tiers) && saved.tiers.length > 0)
      ? saved.tiers.map(t => ({ id: t.id, name: t.name, color: t.color }))
      : JSON.parse(JSON.stringify(DEFAULT_TIERS));

    const locations = (saved && saved.items) || {};
    this.board.renderBoard();
    this.poolEl.innerHTML = '';

    this.dataBank.forEach(item => {
      const zoneId = locations[item.title];
      const zone = zoneId ? this.board.boardEl.querySelector(`.tier-content[data-zone="${zoneId}"]`) : null;
      (zone || this.poolEl).insertAdjacentHTML('beforeend', this.cardHtml(item, true));
    });

    this.updateCounter();
  }

  /* ==================== ХРАНИЛИЩЕ ==================== */

  readSavedState(type) {
    try {
      const raw = localStorage.getItem(`tierlist_master_${type}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('Некорректная структура');
      return parsed;
    } catch (error) {
      console.warn(`⚠️ [Tierlist] Локальное состояние "${type}" повреждено и будет сброшено:`, error.message);
      try { localStorage.removeItem(`tierlist_master_${type}`); } catch (e) { /* приватный режим */ }
      return null;
    }
  }

  saveState() {
    if (!this.isEditMode) return;
    try {
      const payload = { tiers: this.tiers, items: this.collectItemsState() };
      localStorage.setItem(`tierlist_master_${this.currentMode}`, JSON.stringify(payload));
    } catch (error) {
      console.error('🚨 [Tierlist] Не удалось сохранить состояние:', error.message);
      EventBus.emit('SYS_LOG', {
        type: 'system', tag: 'TIERLIST', action: 'SAVE',
        value: 'STORAGE_ERROR', color: 'var(--color-danger-red)'
      });
    }
  }

  collectItemsState() {
    const state = {};
    this.board.boardEl.querySelectorAll('.tier-content').forEach(zone => {
      zone.querySelectorAll('.t-card').forEach(card => { state[card.dataset.id] = zone.dataset.zone; });
    });
    return state;
  }

  updateCounter() {
    if (!this.isEditMode || !this.counterEl) return;
    const left = this.poolEl.querySelectorAll('.t-card').length;
    this.counterEl.textContent = `ОСТАЛОСЬ: ${left}`;
    const done = left === 0;
    this.counterEl.style.color = done ? 'var(--color-neon-green)' : 'var(--color-text-white)';
    this.counterEl.style.borderColor = 'var(--color-neon-green)';
    this.counterEl.style.background = done ? 'color-mix(in srgb, var(--color-neon-green) 12%, transparent)' : 'transparent';
  }

  /* ==================== УПРАВЛЕНИЕ ==================== */

  toggleEditMode(enable) {
    if (this.isEditMode === enable) return;
    EventBus.emit('PLAY_SOUND', 'click');
    AppRouter.updateQuery({ edit: enable ? '1' : null });
  }

  setupButtons() {
    const btnHome = document.getElementById('btn-back-home');
    if (btnHome) {
      btnHome.addEventListener('click', () => {
        EventBus.emit('PLAY_SOUND', 'click');
        const home = AppRouter.getHomeTarget();
        AppRouter.navigate(home.path, home.params);
      });
    }

    const btnEnable = document.getElementById('btn-enable-edit');
    if (btnEnable) btnEnable.addEventListener('click', () => this.toggleEditMode(true));
    const btnExit = document.getElementById('btn-exit-edit');
    if (btnExit) btnExit.addEventListener('click', () => this.toggleEditMode(false));

    if (this.btnGames) {
      this.btnGames.addEventListener('click', () => {
        if (this.currentMode === 'games') return;
        EventBus.emit('PLAY_SOUND', 'click');
        AppRouter.navigate('/tierlist', { type: 'games' }, this.isEditMode ? { edit: '1' } : {});
      });
    }
    if (this.btnMovies) {
      this.btnMovies.addEventListener('click', () => {
        if (this.currentMode === 'movies') return;
        EventBus.emit('PLAY_SOUND', 'click');
        AppRouter.navigate('/tierlist', { type: 'movies' }, this.isEditMode ? { edit: '1' } : {});
      });
    }

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (!this.isEditMode) return;
        if (!confirm('Сбросить весь тирлист к заводским настройкам? Все локальные данные будут утеряны.')) return;
        try { localStorage.removeItem(`tierlist_master_${this.currentMode}`); }
        catch (error) { console.warn('⚠️ [Tierlist] Не удалось очистить хранилище:', error.message); }
        this.loadedKey = null;
        this.loadCategory(this.currentMode);
      });
    }
  }
}