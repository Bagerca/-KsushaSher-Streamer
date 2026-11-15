/* js/library-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { LibrarySearch } from './library/LibrarySearch.js';
import { LibraryUI } from './library/LibraryUI.js';
import { LibraryGrid } from './library/LibraryGrid.js';

/**
 * Полная библиотека. Тип, вкладка, сортировка, плотность и поиск
 * целиком берутся из адреса: #/library/movies?tab=dropped&mode=compact
 * Поиск делегирован единому компоненту SearchBox через адаптер LibrarySearch.
 */
export class LibraryController {
  constructor() {
    this.container = document.getElementById('route-library');
    if (!this.container) return;

    this.els = {
      pageWrapper: document.getElementById('library-page'),
      backBtn: document.getElementById('btn-library-back'),
      gridMain: document.getElementById('library-grid-main'),
      sortBtns: document.querySelectorAll('#library-sort-switcher .sort-btn'),
      typeBtns: document.querySelectorAll('#library-type-switcher .switcher-btn'),
      typeSwitcher: document.getElementById('library-type-switcher'),
      btnDetailed: document.getElementById('lib-grid-detailed'),
      btnCompact: document.getElementById('lib-grid-compact'),
      tabs: document.querySelectorAll('.lib-tab-btn'),
      labelCompleted: document.getElementById('label-completed'),
      labelPlaying: document.getElementById('label-playing')
    };

    const media = AppStore.getState().media;
    this.gridMode = media.gridMode || 'detailed';
    this.localSearchQuery = '';
    this.activeTab = 'completed';
    this.fadeTimer = null;

    this.search = new LibrarySearch(this);
    this.ui = new LibraryUI(this);
    this.grid = new LibraryGrid(this);

    this.bindEvents();
    console.log('📚 [Library] Контроллер инициализирован (URL-driven)');
  }

  mount() {
    const state = AppStore.getState();
    this.localSearchQuery = state.route.query.search || '';
    this.activeTab = state.route.query.tab || 'completed';

    this.search.setQuery(this.localSearchQuery);
    this.search.toggleSuggestions(false);

    this.applyGridMode(state.media.gridMode);
    this.ui.syncUIWithState();
    this.grid.renderGrid();
    console.log(`📚 [Library] Mount: ${state.media.type} / ${this.activeTab} / ${this.gridMode}`);
  }

  unmount() {
    clearTimeout(this.fadeTimer);
    this.fadeTimer = null;
    this.search.reset();
    if (this.els.gridMain) this.els.gridMain.style.opacity = '1';
    console.log('📚 [Library] Компонент размонтирован');
  }

  applyGridMode(mode) {
    this.gridMode = mode === 'compact' ? 'compact' : 'detailed';
    const compact = this.gridMode === 'compact';
    if (this.els.gridMain) this.els.gridMain.classList.toggle('compact-mode', compact);
    if (this.els.btnDetailed) {
      this.els.btnDetailed.classList.toggle('active', !compact);
      this.els.btnDetailed.setAttribute('aria-pressed', compact ? 'false' : 'true');
    }
    if (this.els.btnCompact) {
      this.els.btnCompact.classList.toggle('active', compact);
      this.els.btnCompact.setAttribute('aria-pressed', compact ? 'true' : 'false');
    }
  }

  fadeRender() {
    clearTimeout(this.fadeTimer);
    this.els.gridMain.style.opacity = '0';
    this.fadeTimer = setTimeout(() => {
      this.fadeTimer = null;
      this.grid.renderGrid();
      this.els.gridMain.style.opacity = '1';
    }, 200);
  }

  bindEvents() {
    AppStore.subscribe((state, prevState) => {
      if (state.route.path !== '/library') return;
      const media = state.media;
      const prev = (prevState && prevState.media) || {};
      const tab = state.route.query.tab || 'completed';

      if (media.gridMode !== prev.gridMode) {
        this.applyGridMode(media.gridMode);
        this.ui.syncUIWithState();
        this.fadeRender();
        return;
      }

      let needsRender = false;
      if (media.type !== prev.type || media.sort !== prev.sort || media.sortDirection !== prev.sortDirection || tab !== this.activeTab) {
        this.activeTab = tab;
        needsRender = true;
      }

      const search = state.route.query.search || '';
      if (search !== this.localSearchQuery) {
        this.localSearchQuery = search;
        this.search.setQuery(search);
        needsRender = true;
      }

      if (needsRender) {
        this.search.toggleSuggestions(false);
        this.ui.syncUIWithState();
        this.grid.renderGrid();
      }
    });

    EventBus.on('MEDIA_STORE_LOADING', () => {
      if (AppStore.getState().route.path !== '/library') return;
      this.els.gridMain.innerHTML = '<div class="suggestion-empty" style="width:100%; padding:100px 20px; color: var(--color-neon-pink);"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
    });

    EventBus.on('MEDIA_STORE_LOADED', () => {
      if (AppStore.getState().route.path !== '/library') return;
      this.ui.syncUIWithState();
      this.grid.renderGrid();
    });
  }
}