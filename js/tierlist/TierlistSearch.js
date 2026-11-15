/* js/tierlist/TierlistSearch.js */
import { AppStore } from '../store.js';
import { SearchEngine } from '../services/SearchEngine.js';
import { SearchBox } from '../components/SearchBox.js';

/**
 * Поиск пула тирлиста — адаптер над SearchBox с кастомным DOM-источником.
 * Дублированная карта EN_TO_RU удалена: раскладка берётся из SearchEngine.
 * Enter/выбор подсказки не навигируют, а фильтруют пул на месте.
 */
export class TierlistSearch {
  constructor(controller) {
    this.ctrl = controller;
    this.box = null;

    const mount = document.getElementById('tierlist-search-mount');
    if (!mount) {
      console.warn('⚠️ [Tierlist] Mount поиска не найден — модуль отключён.');
      return;
    }

    this.box = new SearchBox({
      mount,
      scope: 'custom',
      variant: 'compact',
      accent: 'green',
      size: 'sm',
      placeholder: 'Поиск по базе...',
      maxSuggestions: 8,
      minScore: 15,
      debounceMs: 300,
      source: () => this.readPoolItems(),
      isHotkeyActive: () => AppStore.getState().route.path === '/tierlist' && this.ctrl.isEditMode,
      onSubmit: (query) => this.filterGlobalPool(query)
    });

    console.log('🔎 [Tierlist] TierlistSearch подключён к единому SearchBox');
  }

  /** Источник данных: карточки, реально лежащие в пуле. */
  readPoolItems() {
    if (!this.ctrl.poolEl) return [];
    return Array.from(this.ctrl.poolEl.querySelectorAll('.t-card')).map(card => {
      const imgEl = card.querySelector('img');
      return {
        id: card.dataset.id || card.dataset.title,
        title: card.dataset.title || '',
        image: (imgEl && imgEl.src) || ''
      };
    });
  }

  filterGlobalPool(query) {
    if (!this.ctrl.poolEl) return;
    const clean = String(query || '').toLowerCase().trim();
    const layoutSwitched = SearchEngine.switchLayout(clean);
    this.ctrl.poolEl.querySelectorAll('.t-card').forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const visible = !clean || title.includes(clean) || title.includes(layoutSwitched);
      card.style.display = visible ? 'block' : 'none';
    });
  }

  /* Совместимый API для TierlistController */
  toggleSuggestions(isOpen) { if (this.box) this.box.toggleSuggestions(isOpen); }

  reset() {
    if (this.box) this.box.reset();
    this.filterGlobalPool('');
  }
}