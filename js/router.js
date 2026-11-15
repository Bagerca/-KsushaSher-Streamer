/* js/router.js */
import { AppStore } from './store.js';
import { AppConfig } from './config.js';

const MEDIA_TYPES = ['games', 'movies'];
const SORT_KEYS = ['name', 'rating'];
const SORT_DIRS = ['asc', 'desc'];
const GRID_MODES = ['detailed', 'compact'];
const LIBRARY_TABS = ['completed', 'playing', 'on-hold', 'dropped', 'suggested'];
const FILTER_STATUSES = ['completed', 'watched', 'playing', 'watching', 'on-hold', 'dropped', 'suggested'];
const ITEM_SOURCES = ['archive', 'library', 'youtube', 'tierlist', 'agents'];

/** Реестр маршрутов: единственный источник истины о структуре URL. */
const ROUTE_DEFS = {
    '/':         { param: null,   title: 'ХАБ' },
    '/archive':  { param: 'type', title: 'БАЗА ДАННЫХ', values: MEDIA_TYPES, fallback: 'games' },
    '/library':  { param: 'type', title: 'БИБЛИОТЕКА',  values: MEDIA_TYPES, fallback: 'games' },
    '/tierlist': { param: 'type', title: 'ТИРЛИСТ',     values: MEDIA_TYPES, fallback: 'games' },
    '/youtube':  { param: null,   title: 'YOUTUBE АРХИВ' },
    '/agents':   { param: 'id',   title: 'ДОСЬЕ АГЕНТА' },
    '/item':     { param: 'id',   title: 'КАРТОЧКА' }
};

/** Какие query-параметры вообще имеют смысл на каждом маршруте. */
const ALLOWED_QUERY = {
    '/':         [],
    '/archive':  ['search', 'filters', 'sort', 'sortDir', 'mode', 'page'],
    '/library':  ['search', 'filters', 'sort', 'sortDir', 'mode', 'tab'],
    '/youtube':  ['search'],
    '/tierlist': ['edit'],
    '/agents':   [],
    '/item':     ['from', 'tab', 'part', 'slide', 'v', 'page', 'agentId', 'edit']
};

/** Дефолты не пишутся в URL — адрес остаётся чистым. */
const QUERY_DEFAULTS = {
    sort: 'name',
    sortDir: 'asc',
    mode: 'detailed',
    tab: 'completed',
    page: '1',
    slide: '0'
};

function safeDecode(segment) {
    try {
        return decodeURIComponent(segment);
    } catch (error) {
        console.warn(`⚠️ [Router] Битый сегмент URL "${segment}":`, error.message);
        return segment;
    }
}

function sanitizeParam(key, value) {
    const raw = String(value);
    switch (key) {
        case 'sort':    return SORT_KEYS.includes(raw) ? raw : null;
        case 'sortDir': return SORT_DIRS.includes(raw) ? raw : null;
        case 'mode':    return GRID_MODES.includes(raw) ? raw : null;
        case 'tab':     return LIBRARY_TABS.includes(raw) ? raw : null;
        case 'from':    return ITEM_SOURCES.includes(raw) ? raw : null;
        case 'edit':    return (raw === '1' || raw === 'true') ? '1' : null;
        case 'page': {
            const n = parseInt(raw, 10);
            return (Number.isFinite(n) && n > 0) ? String(n) : null;
        }
        case 'slide': {
            const n = parseInt(raw, 10);
            return (Number.isFinite(n) && n >= 0) ? String(n) : null;
        }
        case 'filters': {
            const list = raw.split(',').map(s => s.trim()).filter(s => FILTER_STATUSES.includes(s));
            return list.length ? Array.from(new Set(list)).join(',') : null;
        }
        case 'search': {
            const trimmed = raw.trim().slice(0, 120);
            return trimmed.length ? trimmed : null;
        }
        case 'part':
        case 'v':
        case 'agentId': {
            const trimmed = raw.trim().slice(0, 120);
            return trimmed.length ? trimmed : null;
        }
        default: return null;
    }
}

class Router {
    constructor() {
        this.isInitialized = false;
        this.customTitle = null;
        this.onHashChange = () => this.handleHashChange();
    }

    init() {
        if (this.isInitialized) return;
        window.addEventListener('hashchange', this.onHashChange);
        this.isInitialized = true;

        const current = window.location.hash.slice(1);
        if (!current || current === '/') {
            // replace — чтобы не плодить лишнюю запись в истории на старте
            this.writeHash('/', { replace: true });
        } else {
            this.handleHashChange();
        }
        console.log('🧭 [Router] Инициализирован (канонические URL + атомарный ROUTE_SYNC)');
    }

    /* ============================ ПАРСИНГ ============================ */

    parseHash(hash) {
        const clean = String(hash || '').replace(/^#/, '');
        const [pathPart = '', queryPart = ''] = clean.split('?');

        const rawQuery = {};
        if (queryPart) {
            try {
                const params = new URLSearchParams(queryPart);
                params.forEach((value, key) => { rawQuery[key] = value; });
            } catch (error) {
                console.warn('⚠️ [Router] Не удалось разобрать query:', error.message);
            }
        }

        const segments = pathPart.split('/').filter(s => s.length > 0).map(safeDecode);
        const path = segments.length ? `/${segments[0]}` : '/';
        const def = ROUTE_DEFS[path];

        if (!def) {
            return { path, params: {}, query: {}, raw: clean, unknown: true };
        }

        const params = {};
        if (def.param && segments[1]) params[def.param] = segments[1];
        if (segments.length > 2) {
            console.warn(`⚠️ [Router] Лишние сегменты в "${clean}" проигнорированы.`);
        }

        return { path, params, query: this.normalizeQuery(path, rawQuery), raw: clean, unknown: false };
    }

    normalizeQuery(path, rawQuery) {
        const allowed = ALLOWED_QUERY[path] || [];
        const result = {};
        allowed.forEach(key => {
            const value = rawQuery[key];
            if (value === undefined || value === null || value === '') return;
            const clean = sanitizeParam(key, value);
            if (clean === null || clean === undefined || clean === '') return;
            if (QUERY_DEFAULTS[key] !== undefined && String(clean) === QUERY_DEFAULTS[key]) return;
            result[key] = String(clean);
        });
        return result;
    }

    /* ============================ СБОРКА ============================ */

    buildHash(path, params = {}, query = {}) {
        const def = ROUTE_DEFS[path] || ROUTE_DEFS['/'];
        const safePath = ROUTE_DEFS[path] ? path : '/';
        let hash = safePath;

        if (def.param) {
            const value = params[def.param];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                hash += '/' + encodeURIComponent(String(value).trim());
            }
        }

        const cleanQuery = this.normalizeQuery(safePath, query);
        const searchParams = new URLSearchParams();
        Object.keys(cleanQuery).sort().forEach(key => searchParams.append(key, cleanQuery[key]));
        const queryString = searchParams.toString();
        if (queryString) hash += `?${queryString}`;

        return hash;
    }

    /** Приводит распарсенный маршрут к каноническому виду. */
    resolveCanonical(parsed) {
        const state = AppStore.getState();

        if (parsed.unknown) {
            console.warn(`⚠️ [Router] Неизвестный маршрут "${parsed.raw}" -> возврат на хаб.`);
            return { path: '/', params: {}, query: {} };
        }

        const def = ROUTE_DEFS[parsed.path];
        const params = { ...parsed.params };

        if (def.param === 'type') {
            const type = params.type;
            if (!MEDIA_TYPES.includes(type)) {
                // Тип не указан/битый -> берём текущий контекст, чтобы не терять состояние
                params.type = MEDIA_TYPES.includes(state.media.type) ? state.media.type : def.fallback;
            }
        }

        if (parsed.path === '/item' && !params.id) {
            console.warn('⚠️ [Router] /item без ID -> возврат в базу.');
            return { path: '/archive', params: { type: state.media.type || 'games' }, query: {} };
        }

        return { path: parsed.path, params, query: parsed.query };
    }

    /* ============================ ПРИМЕНЕНИЕ ============================ */

    handleHashChange() {
        try {
            const rawHash = window.location.hash.slice(1) || '/';
            const parsed = this.parseHash(rawHash);
            const canonical = this.resolveCanonical(parsed);
            const canonicalHash = this.buildHash(canonical.path, canonical.params, canonical.query);

            if (canonicalHash !== rawHash) {
                console.log(`🧭 [Router] Канонизация: "${rawHash}" -> "${canonicalHash}"`);
                this.writeHash(canonicalHash, { replace: true });
                return;
            }

            this.applyRoute(canonical, canonicalHash);
        } catch (error) {
            console.error('🚨 [Router] Ошибка обработки маршрута:', error);
        }
    }

    /** Какой срез media синхронизируем на этом маршруте (null = не трогаем). */
    buildMediaPatch(route) {
        const { path, params, query } = route;

        if (path === '/archive' || path === '/library') {
            return {
                type: params.type,
                searchQuery: query.search || '',
                filters: query.filters ? query.filters.split(',') : [],
                sort: query.sort || 'name',
                sortDirection: query.sortDir || 'asc',
                gridMode: query.mode || 'detailed',
                currentPage: path === '/archive' ? parseInt(query.page || '1', 10) : 1
            };
        }
        if (path === '/tierlist') return { type: params.type };
        if (path === '/youtube') return { searchQuery: query.search || '' };
        return null;
    }

    applyRoute(route, raw) {
        const state = AppStore.getState();
        const mediaPatch = this.buildMediaPatch(route);

        const sameRoute =
            state.route.raw === raw &&
            state.route.path === route.path &&
            JSON.stringify(state.route.params) === JSON.stringify(route.params) &&
            JSON.stringify(state.route.query) === JSON.stringify(route.query);

        const sameMedia = !mediaPatch || Object.keys(mediaPatch).every(key =>
            JSON.stringify(state.media[key]) === JSON.stringify(mediaPatch[key])
        );

        this.customTitle = null;
        this.updateDocumentTitle(route);

        if (sameRoute && sameMedia) {
            console.log(`🧭 [Router] Маршрут не изменился (${raw}) — диспатч пропущен.`);
            return;
        }

        console.log(`🧭 [Router] Маршрут применён: ${raw}`, { params: route.params, query: route.query });

        // ЕДИНЫЙ АТОМАРНЫЙ ДИСПАТЧ: route и media обновляются вместе.
        AppStore.dispatch({
            type: 'ROUTE_SYNC',
            payload: {
                route: { path: route.path, params: route.params, query: route.query, raw },
                media: mediaPatch
            }
        });
    }

    updateDocumentTitle(route) {
        const base = (AppConfig.identity && AppConfig.identity.pageTitle) || 'TETLA_OS';
        if (this.customTitle) {
            document.title = `${this.customTitle} — ${base}`;
            return;
        }
        const def = ROUTE_DEFS[route.path];
        if (!def || route.path === '/') {
            document.title = base;
            return;
        }
        let label = def.title;
        if (route.path === '/item' && route.params.id) label = route.params.id;
        if (route.path === '/agents' && route.params.id) label = route.params.id;
        if (def.param === 'type' && route.params.type) {
            label += ` / ${route.params.type === 'movies' ? 'КИНО' : 'ИГРЫ'}`;
        }
        document.title = `${label} — ${base}`;
    }

    /** Позволяет странице подставить человекочитаемый заголовок вкладки. */
    setDocumentTitle(text) {
        this.customTitle = text ? String(text) : null;
        this.updateDocumentTitle(AppStore.getState().route);
    }

    /* ============================ НАВИГАЦИЯ ============================ */

    writeHash(hash, options = {}) {
        const target = `#${hash}`;
        const replace = !!options.replace;

        if (window.location.hash === target || (!window.location.hash && hash === '/')) {
            this.handleHashChange();
            return;
        }

        if (replace) {
            let replaced = false;
            try {
                const url = `${window.location.pathname}${window.location.search}${target}`;
                window.history.replaceState(null, '', url);
                replaced = true;
            } catch (error) {
                // file:// может запрещать replaceState — падаем на location.replace
                console.warn('⚠️ [Router] replaceState недоступен, использую location.replace:', error.message);
            }
            if (replaced) {
                this.handleHashChange();
            } else {
                window.location.replace(target);
            }
            return;
        }

        window.location.hash = target;
    }

    navigate(path, params = {}, query = {}, options = {}) {
        try {
            const hash = this.buildHash(path, params, query);
            this.writeHash(hash, options);
        } catch (error) {
            console.error('🚨 [Router] Ошибка навигации:', error);
        }
    }

    updateQuery(patch = {}, options = {}) {
        const route = AppStore.getState().route;
        const merged = { ...route.query, ...patch };
        Object.keys(merged).forEach(key => {
            if (merged[key] === null || merged[key] === undefined || merged[key] === '') delete merged[key];
        });
        this.navigate(route.path, route.params, merged, options);
    }

    /** Куда возвращать «домой», чтобы URL не врал про активный тип базы. */
    getHomeTarget() {
        const type = AppStore.getState().media.type;
        if (type === 'movies') return { path: '/archive', params: { type: 'movies' } };
        return { path: '/', params: {} };
    }

    getCurrent() {
        return AppStore.getState().route;
    }
}

export const AppRouter = new Router();