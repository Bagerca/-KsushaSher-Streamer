/* js/archive/archive-url.js */
/*
 * ЕДИНАЯ ТОЧКА ПРАВДЫ ДЛЯ URL АРХИВА.
 * Архив живёт на дашборде, но любое взаимодействие с ним канонизирует
 * адрес в #/archive/{type}?... — иначе состояние (страница, поиск,
 * сортировка, плотность) невозможно ни скопировать, ни восстановить.
 */
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';

export function isArchiveRoute(path) {
    return path === '/' || path === '/archive';
}

export function getArchiveType() {
    return AppStore.getState().media.type === 'movies' ? 'movies' : 'games';
}

/** Канонический набор query архива из текущего состояния (дефолты опускаются). */
export function getArchiveQuery() {
    const { media } = AppStore.getState();
    const query = {};
    if (media.searchQuery) query.search = media.searchQuery;
    if (Array.isArray(media.filters) && media.filters.length > 0) query.filters = media.filters.join(',');
    if (media.sort !== 'name') query.sort = media.sort;
    if (media.sortDirection !== 'asc') query.sortDir = media.sortDirection;
    if (media.gridMode !== 'detailed') query.mode = media.gridMode;
    if (media.currentPage > 1) query.page = String(media.currentPage);
    return query;
}

export function navigateArchive(patch = {}, options = {}) {
    const query = { ...getArchiveQuery(), ...patch };
    Object.keys(query).forEach(key => {
        if (query[key] === null || query[key] === undefined || query[key] === '') delete query[key];
    });
    AppRouter.navigate('/archive', { type: getArchiveType() }, query, options);
}

/** Смена категории всегда сбрасывает пагинацию: нумерация у типов разная. */
export function navigateArchiveType(type, options = {}) {
    const safeType = type === 'movies' ? 'movies' : 'games';
    const query = getArchiveQuery();
    delete query.page;
    AppRouter.navigate('/archive', { type: safeType }, query, options);
}

/** Ссылка «Полная библиотека» наследует тип, поиск, сортировку и плотность. */
export function buildLibraryHref() {
    const { media } = AppStore.getState();
    const query = {};
    if (media.searchQuery) query.search = media.searchQuery;
    if (media.sort !== 'name') query.sort = media.sort;
    if (media.sortDirection !== 'asc') query.sortDir = media.sortDirection;
    if (media.gridMode !== 'detailed') query.mode = media.gridMode;
    return `#${AppRouter.buildHash('/library', { type: getArchiveType() }, query)}`;
}

/** Контекст возврата из карточки: откуда пришли и на какой странице были. */
export function buildItemQuery(extra = {}) {
    const { media } = AppStore.getState();
    const query = { from: 'archive' };
    if (media.currentPage > 1) query.page = String(media.currentPage);
    return { ...query, ...extra };
}