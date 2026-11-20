/* js/youtube-library-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { CardFactory } from './archive/CardFactory.js';
import { LazyLoader } from './archive/LazyLoader.js';
import { SearchEngine } from './services/SearchEngine.js';
import { SearchBox } from './components/SearchBox.js';
import { WatchedYoutubeService } from './services/WatchedVideosService.js';

const LONG_PRESS_MS = 550;
const LONG_PRESS_MOVE_TOLERANCE = 12;
const TOGGLE_GUARD_MS = 700;

/**
 * YouTube-архив. Inline-поиск удалён целиком — используется единый SearchBox
 * (scope 'youtube', красный акцент через CSS-модификатор, без хардкода цвета).
 *
 * Отметки «ПРОСМОТРЕНО»:
 *  - ПКМ по карточке (desktop) / long-press (touch) -> toggle через сервис;
 *  - сервис диспатчит в Store, подписка точечно обновляет карточку;
 *  - ЛКМ остаётся навигацией на страницу объекта.
 * Шапка страницы чистая: только счётчик видео, без служебных виджетов.
 */
export class YoutubeLibraryController {
  constructor() {
    this.container = document.getElementById('route-youtube');
    if (!this.container) return;

    this.els = {
      backBtn: document.getElementById('btn-yt-library-back'),
      gridMain: document.getElementById('yt-library-grid-main'),
      counter: document.getElementById('yt-lib-video-count')
    };

    this.localSearchQuery = '';
    this.factory = new CardFactory(() => 'detailed');
    this.lazyLoader = new LazyLoader(() => 'detailed');

    /* Состояние long-press и защита от фантомного клика после удержания. */
    this.longPress = null;
    this.suppressClick = false;
    this.lastToggle = null;

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
    console.log('📺 [YoutubeLibrary] Контроллер инициализирован (поиск через единый SearchBox, отметки через WatchedService)');
  }

  mount() {
    console.log('📺 [YoutubeLibrary] Компонент смонтирован');
    this.localSearchQuery = AppStore.getState().route.query.search || '';
    this.search.setQuery(this.localSearchQuery);
    this.search.toggleSuggestions(false);
    this.renderGrid();
    this.syncWatchedCards();
  }

  unmount() {
    this.cancelLongPress();
    this.suppressClick = false;
    this.search.reset();
    console.log('📺 [YoutubeLibrary] Компонент размонтирован');
  }

  bindEvents() {
    this.els.backBtn.addEventListener('click', () => {
      EventBus.emit('PLAY_SOUND', 'click');
      AppRouter.navigate('/');
    });

    /* ЛКМ — навигация. После long-press клик гасим один раз. */
    this.els.gridMain.addEventListener('click', (e) => {
      if (this.suppressClick) {
        this.suppressClick = false;
        return;
      }
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

    /* ПКМ — toggle отметки «просмотрено» (устоявшийся жест проекта). */
    this.els.gridMain.addEventListener('contextmenu', (e) => {
      const card = e.target.closest('.archive-card-container');
      if (!card) return;
      e.preventDefault();
      this.handleWatchToggle(card, 'contextmenu');
    });

    /* Long-press для тач-устройств (ПКМ там недоступен). */
    this.els.gridMain.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      const card = e.target.closest('.archive-card-container');
      if (!card) return;
      this.cancelLongPress();
      this.longPress = {
        pointerId: e.pointerId,
        card,
        x: e.clientX,
        y: e.clientY,
        fired: false,
        timer: setTimeout(() => {
          if (!this.longPress) return;
          this.longPress.fired = true;
          this.suppressClick = true;
          this.handleWatchToggle(card, 'long-press');
          try { if (navigator.vibrate) navigator.vibrate(25); } catch (err) { /* не критично */ }
        }, LONG_PRESS_MS)
      };
    });

    this.els.gridMain.addEventListener('pointermove', (e) => {
      if (!this.longPress || e.pointerId !== this.longPress.pointerId) return;
      const dx = e.clientX - this.longPress.x;
      const dy = e.clientY - this.longPress.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) {
        // Палец поехал (скролл) — отметку не ставим.
        this.cancelLongPress();
      }
    });

    const finishPress = (e) => {
      if (!this.longPress || e.pointerId !== this.longPress.pointerId) return;
      const fired = this.longPress.fired;
      this.cancelLongPress();
      if (fired) {
        this.suppressClick = true;
        setTimeout(() => { this.suppressClick = false; }, 400);
      }
    };
    this.els.gridMain.addEventListener('pointerup', finishPress);
    this.els.gridMain.addEventListener('pointercancel', finishPress);
    this.els.gridMain.addEventListener('pointerleave', () => this.cancelLongPress());

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

      /* Точечная реакция на отметки: без перерендера сетки. */
      const prevWatched = prevState ? prevState.watched.youtube : null;
      if (state.watched.youtube !== prevWatched) {
        this.syncWatchedCards();
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

  /* ==================== ОТМЕТКИ «ПРОСМОТРЕНО» ==================== */

  cancelLongPress() {
    if (this.longPress) {
      clearTimeout(this.longPress.timer);
      this.longPress = null;
    }
  }

  /**
   * Единая точка toggle. Guard 700ms гасит двойной триггер на Android,
   * где после long-press браузер дополнительно шлёт нативный contextmenu.
   */
  handleWatchToggle(card, source) {
    const state = AppStore.getState();
    if (!state.data.isMediaLoaded) return;

    const id = card.dataset.id;
    const item = state.data.media.find(i => i.id === id);
    if (!item || item.format !== 'youtube') {
      console.warn(`⚠️ [YoutubeLibrary] Отметка невозможна: объект "${id}" не найден или не YouTube.`);
      return;
    }

    const now = performance.now();
    if (this.lastToggle && this.lastToggle.id === id && (now - this.lastToggle.time) < TOGGLE_GUARD_MS) {
      console.log(`📺 [YoutubeLibrary] Двойной триггер отметки (${source}) проигнорирован: ${id}`);
      return;
    }
    this.lastToggle = { id, time: now };

    const watched = WatchedYoutubeService.toggle(id);
    EventBus.emit('PLAY_SOUND', 'click');
    EventBus.emit('SYS_LOG', {
      type: 'system',
      tag: 'YOUTUBE',
      action: watched ? 'WATCHED' : 'UNWATCHED',
      value: item.title || id,
      color: watched ? 'var(--status-completed)' : 'var(--color-text-muted)'
    });
    console.log(`📺 [YoutubeLibrary] ${watched ? 'Отмечено' : 'Отметка снята'} (${source}): ${item.title || id}`);
  }

  /** Синхронизация классов/табличек существующих карточек с Store. */
  syncWatchedCards() {
    if (!this.els.gridMain) return;
    const map = AppStore.getState().watched.youtube || {};
    this.els.gridMain.querySelectorAll('.archive-card-container').forEach(card => {
      const should = Boolean(map[card.dataset.id]);
      if (card.classList.contains('is-watched') !== should) {
        CardFactory.applyWatchedState(card, should);
      }
    });
  }

  /* ==================== СЕТКА ==================== */

  renderGrid() {
    const storeData = AppStore.getState().data;

    if (!storeData.isMediaLoaded) {
      this.els.gridMain.innerHTML = '<div style="width:100%; grid-column: 1 / -1; text-align:center; padding:100px; color: var(--color-youtube); font-size:1.5rem;"><i class="fas fa-circle-notch fa-spin"></i> ЗАГРУЗКА БАЗЫ ДАННЫХ...</div>';
      if (this.els.counter) this.els.counter.textContent = '0';
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

    if (this.els.counter) this.els.counter.textContent = ytData.length;

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