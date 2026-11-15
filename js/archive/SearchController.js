/* js/archive/SearchController.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { SearchBox } from '../components/SearchBox.js';
import { navigateArchive, isArchiveRoute } from './archive-url.js';

/**
 * Поиск архива — тонкий адаптер над SearchBox.
 * Вся механика (debounce, клавиатура, подсветка, подсказки) живёт в компоненте.
 * Здесь только навигация: запрос уходит в адрес #/archive/{type}?search=...
 * Область поиска 'standard' гарантированно исключает YouTube.
 */
export class SearchController {
  constructor() {
    const mount = document.getElementById('archive-search-mount');
    if (!mount) {
      console.warn('⚠️ [Archive] Mount поиска не найден — модуль отключён.');
      return;
    }

    this.box = new SearchBox({
      mount,
      scope: 'standard',
      variant: 'rich',
      accent: 'green',
      placeholder: 'Поиск по базе...',
      maxSuggestions: 6,
      minScore: 15,
      debounceMs: 320,
      isHotkeyActive: () => isArchiveRoute(AppStore.getState().route.path),
      onSubmit: (query) => this.executeSearch(query)
    });

    const syncInput = () => {
      if (!isArchiveRoute(AppStore.getState().route.path)) return;
      this.box.setQuery(AppStore.getState().media.searchQuery || '');
    };

    EventBus.on('MEDIA_STORE_LOADED', syncInput);
    AppStore.subscribe((state, prevState) => {
      if (state.media.searchQuery !== (prevState && prevState.media.searchQuery)) syncInput();
    });
    syncInput();

    console.log('🔎 [Archive] SearchController подключён к единому SearchBox');
  }

  executeSearch(query) {
    if (!isArchiveRoute(AppStore.getState().route.path)) return;
    const clean = String(query || '').trim();
    navigateArchive({ search: clean || null, page: null });
  }
}