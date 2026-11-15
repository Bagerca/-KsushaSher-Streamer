/* js/youtube-library-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { CardFactory } from './archive/CardFactory.js';
import { LazyLoader } from './archive/LazyLoader.js';
import { SearchEngine } from './services/SearchEngine.js';
import { SearchBox } from './components/SearchBox.js';

/**
 * YouTube-архив. Inline-поиск удалён целиком — используется единый SearchBox
 * (scope 'youtube', красный акцент через CSS-модификатор, без хардкода цвета).
 */
export class YoutubeLibraryController {
  constructor() {
    this.container = document.getElementById('route-youtube');
    if (!this.container) return;

    this.els = {
      backBtn: document.getElementById('btn-yt-library-back'),
      gridMain: document.getElementById('yt-library-grid-main'),
      counter: document.querySelector('.yt-lib-counter-val')
    };

    this.localSearchQuery = '';
    this.factory = new CardFactory(() => 'detailed');
    this.lazyLoader = new LazyLoader(() => 'detailed');

    this.search = new SearchBox({
      mount: document.getElementById('yt-lib-search-mount'),
      scope: 'youtube',
      variant: 'compact',
      accent: 'youtube',
      placeholder: 'Поиск по видеозаписям...',
      maxSuggestions: 5,
      minScore: 10,
      debounceMs: 300,
      isHotkeyActive: () => AppStore.getState().route.path === '/youtube',
      onSubmit: (query) => {
        const clean = String(query || '').trim();
        AppRouter.updateQuery({ search: clean || null });
      }
    });

    this.bindEvents();
    console.log('📺 [YoutubeLibrary] Контроллер инициализирован (поиск через единый SearchBox)');
  }

  mount() {
    console.log('📺 [YoutubeLibrary] Компонент смонтирован');
    this.localSearchQuery = AppStore.getState().route.query.search || '';
    this.search.setQuery(this.localSearchQuery);
    this.search.toggleSuggestions(false);
    this.renderGrid();
  }

  unmount() {
    this.search.reset();
    console.log('📺 [YoutubeLibrary] Компонент размонтирован');
  }

  bindEvents() {
    this.els.backBtn.addEventListener('click', () => {
      EventBus.emit('PLAY_SOUND', 'click');
      AppRouter.navigate('/');
    });

    this.els.gridMain.addEventListener('click', (e) => {
      const card = e.target.closest('.archive-card-container');
      if (!card) return;
      const state = AppStore.getState();
      if (!state.data.isMediaLoaded) return;
      const item = state.data.media.find(i => i.id === card.dataset.id);
      if (item) {
        EventBus.emit('PLAY_SOUND', 'expand');
        AppRouter.navigate('/item', { id: item.id }, { from: 'youtube' });
      }
    });

    AppStore.subscribe((state, prevState) => {
      if (state.route.path !== '/youtube') return;
      const currentSearch = state.route.query.search || '';
      const prevSearch = (prevState && prevState.route.query.search) || '';
      if (currentSearch !== prevSearch) {
        this.localSearchQuery = currentSearch;
        this.search.setQuery(currentSearch);
        this.search.toggleSuggestions(false);
        this.renderGrid();
      }
    });

    EventBus.on('MEDIA_STORE_LOADED', () => {
      if (AppStore.getState().route.path === '/youtube') this.renderGrid();
    });

    this.els.gridMain.addEventListener('mouseenter', (e) => {
      const card = e.target.closest('.archive-card-container');
      if (!card) return;
      card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]').forEach(layer => {
        const bgUrl = layer.dataset.lazyBg;
        if (bgUrl && !layer.style.backgroundImage) {
          this.lazyLoader._safeImageLoad(bgUrl, card.classList.contains('is-youtube'), layer, null, null, layer);
          layer.removeAttribute('data-lazy-bg');
        }
      });
    }, true);
  }

  renderGrid() {
    const storeData = AppStore.getState().data;
    if (!storeData.isMediaLoaded) {
      this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color: var(--color-youtube); font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
      this.els.counter.textContent = '0';
      return;
    }

    let ytData = storeData.media.filter(item => item.format === 'youtube');

    if (this.localSearchQuery.length > 0) {
      ytData = ytData.filter(item => {
        const textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        const score = SearchEngine.scoreItemForGrid(textToSearch, item.title, this.localSearchQuery);
        if (score > 0) {
          item._matchScore = score;
          return true;
        }
        return false;
      });
      ytData.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
    }

    this.els.counter.textContent = ytData.length;

    if (ytData.length === 0) {
      this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color: var(--color-text-muted); font-family: var(--font-primary); font-size:1.2rem;">ПО ВАШИМ ПАРАМЕТРАМ НИЧЕГО НЕ НАЙДЕНО</div>';
      return;
    }

    let htmlBuf = '';
    ytData.forEach((item, index) => {
      htmlBuf += this.factory.createCardHTML(item, (index % 10) * 20);
    });
    this.els.gridMain.innerHTML = htmlBuf;

    this.els.gridMain.querySelectorAll('.archive-card-container:not(.archive-divider-row):not(.is-observed)').forEach(card => {
      card.classList.add('is-observed');
      this.lazyLoader.observe(card);
    });
  }
}