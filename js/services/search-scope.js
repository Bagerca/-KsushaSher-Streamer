/* js/services/search-scope.js */
import { AppStore } from '../store.js';

/**
 * ЕДИНАЯ ОБЛАСТЬ ПОИСКА (Search Scope).
 * Единственное место в приложении, где решается, ЧТО можно искать.
 * Любой потребитель (SearchBox, будущие фильтры/разделы) получает
 * уже отфильтрованный список и не дублирует проверки формата.
 *
 * Гарантии:
 *  - scope 'standard' НИКОГДА не возвращает YouTube (ни родителей,
 *    ни саб-айтемы коллекций, ни yt-предложки, замаскированные под collection);
 *  - scope 'youtube' возвращает ТОЛЬКО YouTube;
 *  - scope 'custom' делегирует источник вызывающей стороне (например, DOM пула тирлиста).
 */

/** Общий знаменатель статусов кино и игр (watched -> completed и т.д.). */
export function normalizeStatus(status) {
  if (status === 'watched') return 'completed';
  if (status === 'watching') return 'playing';
  return status || 'unknown';
}

/**
 * Надёжный предикат YouTube-объекта.
 * Префикс 'yt-' зарезервирован генератором стабильных id за YouTube-базой,
 * поэтому проверка ловит даже yt-предложку, у которой из-за поля items
 * формат стал 'collection' (историческая дыра нормализации).
 */
export function isYouTubeItem(item) {
  if (!item) return false;
  if (item.format === 'youtube') return true;
  return typeof item.id === 'string' && item.id.startsWith('yt-');
}

/**
 * Возвращает плоский список объектов для поиска.
 * @param {object} options
 * @param {'standard'|'youtube'|'custom'} options.scope
 * @param {string|null} options.type  - 'games' | 'movies' (null = активный тип из Store)
 * @param {string|null} options.tab   - вкладка библиотеки (null = все статусы)
 * @param {Function|null} options.source - источник для scope 'custom'
 */
export function getSearchableItems(options = {}) {
  const { scope = 'standard', type = null, tab = null, source = null } = options;

  try {
    if (scope === 'custom') {
      const items = typeof source === 'function' ? source() : [];
      return Array.isArray(items) ? items : [];
    }

    const state = AppStore.getState();
    if (!state.data.isMediaLoaded) return [];
    const media = Array.isArray(state.data.media) ? state.data.media : [];

    if (scope === 'youtube') {
      return media.filter(item => isYouTubeItem(item));
    }

    if (scope !== 'standard') {
      console.warn(`⚠️ [SearchScope] Неизвестная область "${scope}" — возвращаю пустой список.`);
      return [];
    }

    const activeType = type || state.media.type;
    const flat = [];

    media.forEach(item => {
      if (!item || item.type !== activeType) return;
      // ЖЁСТКОЕ отсечение YouTube на уровне родителя.
      if (isYouTubeItem(item)) return;

      if (item.format === 'collection' && Array.isArray(item.items)) {
        item.items.forEach(sub => {
          // ...и на уровне каждого саб-айтема коллекции.
          if (!sub || isYouTubeItem(sub)) return;
          const status = sub.status || item.status;
          if (tab && normalizeStatus(status) !== tab) return;
          flat.push({
            ...sub,
            status,
            parentTitle: item.title,
            collectionCount: item.items.length,
            image: sub.image || item.image
          });
        });
      } else {
        if (tab && normalizeStatus(item.status) !== tab) return;
        flat.push(item);
      }
    });

    const unique = new Map();
    flat.forEach(item => {
      if (item && item.id != null && !unique.has(item.id)) unique.set(item.id, item);
    });
    return Array.from(unique.values());
  } catch (error) {
    console.error('🚨 [SearchScope] Ошибка построения области поиска:', error);
    return [];
  }
}