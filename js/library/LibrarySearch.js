/* js/library/LibrarySearch.js */
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';
import { SearchBox } from '../components/SearchBox.js';

/**
 * Поиск библиотеки — тонкий адаптер над SearchBox.
 * Область 'standard' + фильтр активной вкладки.
 * Тема 'tab': поисковик перекрашивается вслед за --active-tab-color.
 */
export class LibrarySearch {
  constructor(ctrl) {
    this.ctrl = ctrl;
    this.box = null;

    const mount = document.getElementById('lib-search-mount');
    if (!mount) {
      console.warn('⚠️ [Library] Mount поиска не найден — модуль отключён.');
      return;
    }

    this.box = new SearchBox({
      mount,
      scope: 'standard',
      variant: 'compact',
      accent: 'tab',
      placeholder: 'Поиск по библиотеке...',
      maxSuggestions: 5,
      minScore: 15,
      debounceMs: 300,
      getTab: () => this.ctrl.activeTab,
      isHotkeyActive: () => AppStore.getState().route.path === '/library',
      onSubmit: (query) => this.executeSearch(query)
    });

    console.log('🔎 [Library] LibrarySearch подключён к единому SearchBox');
  }

  executeSearch(query) {
    const clean = String(query || '').trim();
    AppRouter.updateQuery({ search: clean || null });
  }

  /* Совместимый API для LibraryController */
  toggleSuggestions(isOpen) { if (this.box) this.box.toggleSuggestions(isOpen); }
  setQuery(query) { if (this.box) this.box.setQuery(query); }
  reset() { if (this.box) this.box.reset(); }
}