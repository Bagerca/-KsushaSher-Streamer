/* js/services/WatchedVideosService.js */
import { AppStore } from '../store.js';

/**
 * СЕРВИС ПОЛЬЗОВАТЕЛЬСКИХ ОТМЕТОК «ПРОСМОТРЕНО».
 *
 * Архитектура:
 *  - localStorage — персистентность (паттерн тирлиста, версионированный ключ);
 *  - AppStore     — единый источник истины в рантайме;
 *  - UI           — подписывается на Store и обновляется сам.
 *
 * Сервис НЕ хранит собственную копию карты: toggle диспатчит экшен,
 * редьюсер меняет Store, сервис персистит снапшот Store. Рассинхрон невозможен.
 *
 * Namespace-параметр — задел на будущее (movies/games и т.п.):
 * для нового пространства достаточно добавить пару case в редьюсер
 * и создать ещё один экземпляр сервиса.
 */

const STORAGE_PREFIX = 'tetla_watched_';
const STORAGE_VERSION = 'v1';

export class WatchedVideosService {
  constructor(namespace = 'youtube') {
    this.namespace = String(namespace || 'youtube');
    this.storageKey = `${STORAGE_PREFIX}${this.namespace}_${STORAGE_VERSION}`;
    this.storageOk = true;
    this.isInitialized = false;
  }

  /** Имя экшена для текущего namespace (youtube -> WATCHED_YOUTUBE_*). */
  action(suffix) {
    return `WATCHED_${this.namespace.toUpperCase()}_${suffix}`;
  }

  /** Текущая карта отметок из Store (id -> timestamp). */
  getMap() {
    const slice = AppStore.getState().watched;
    return (slice && slice[this.namespace]) || {};
  }

  isWatched(id) {
    if (!id) return false;
    return Boolean(this.getMap()[String(id)]);
  }

  getCount() {
    return Object.keys(this.getMap()).length;
  }

  /**
   * Загрузка при boot. Битый JSON сбрасывается, недоступный localStorage
   * (приватный режим) переводит сервис в memory-only без падения приложения.
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    let map = {};
    let raw = null;

    try {
      raw = window.localStorage.getItem(this.storageKey);
    } catch (error) {
      this.storageOk = false;
      console.warn(`⚠️ [Watched:${this.namespace}] localStorage недоступен (приватный режим?). Отметки будут жить только в памяти сессии:`, error.message);
    }

    if (raw) {
      try {
        map = this.sanitizeMap(JSON.parse(raw));
      } catch (error) {
        console.warn(`⚠️ [Watched:${this.namespace}] Сохранённые отметки повреждены — сбрасываю ключ:`, error.message);
        try { window.localStorage.removeItem(this.storageKey); } catch (e) { /* уже недоступен */ }
      }
    }

    AppStore.dispatch({ type: this.action('SET'), payload: map });
    console.log(`👁️ [Watched:${this.namespace}] Инициализация. Отметок загружено: ${Object.keys(map).length} (storage: ${this.storageOk ? 'OK' : 'MEMORY-ONLY'})`);
  }

  /** Валидация структуры: только plain-object { stringId: finiteTimestamp }. */
  sanitizeMap(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('ожидался объект отметок');
    }
    const clean = {};
    let skipped = 0;
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof key === 'string' && key.trim() !== '' && Number.isFinite(value) && value > 0) {
        clean[key] = value;
      } else {
        skipped++;
      }
    }
    if (skipped > 0) {
      console.warn(`⚠️ [Watched:${this.namespace}] Отброшено невалидных записей: ${skipped}`);
    }
    return clean;
  }

  /**
   * Toggle отметки. Возвращает НОВОЕ состояние (true = просмотрено).
   * UI обновится синхронно через подписку Store ещё до return.
   */
  toggle(id) {
    const key = String(id || '').trim();
    if (!key) {
      console.warn(`⚠️ [Watched:${this.namespace}] toggle() вызван без id — пропуск.`);
      return false;
    }

    AppStore.dispatch({
      type: this.action('TOGGLE'),
      payload: { id: key, timestamp: Date.now() }
    });

    const watched = this.isWatched(key);
    this.persist();
    console.log(`👁️ [Watched:${this.namespace}] ${watched ? 'MARKED' : 'UNMARKED'}: ${key}`);
    return watched;
  }

  /** Персист снапшота Store. Ошибка записи не ломает рантайм-состояние. */
  persist() {
    if (!this.storageOk) return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.getMap()));
    } catch (error) {
      this.storageOk = false;
      console.warn(`⚠️ [Watched:${this.namespace}] Не удалось сохранить отметки (quota/приватный режим). Продолжаю в памяти:`, error.message);
    }
  }
}

/* Singleton для YouTube-архива. */
export const WatchedYoutubeService = new WatchedVideosService('youtube');