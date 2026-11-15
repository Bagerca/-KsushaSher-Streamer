/* js/store.js */
/**
 * НАЧАЛЬНОЕ СОСТОЯНИЕ ПРИЛОЖЕНИЯ (STATE TREE)
 * Единый источник истины.
 */
const initialState = {
    route: {
        path: '/',
        params: {},
        query: {},
        raw: ''
    },
    data: {
        media: [],
        agents: [],
        isMediaLoaded: false,
        isAgentsLoaded: false
    },
    media: {
        type: 'games',
        searchQuery: '',
        filters: [],
        sort: 'name',
        sortDirection: 'asc',
        gridMode: 'detailed',
        currentPage: 1
    },
    audio: {
        isMusicModeActive: false,
        isPlaying: false,
        volume: 0.5,
        currentTrackIdx: 0,
        tracks: []
    },
    fx: {
        mode: 0,
        isGodMode: false,
        isPaused: false,
        activeEngines: []
    },
    system: {
        isMobile: false,
        isLoaded: false,
        lastError: null
    }
};

/**
 * РЕДЬЮСЕР (REDUCER)
 */
function reducer(state, action) {
    const { type, payload } = action;

    switch (type) {
        /* АТОМАРНАЯ СИНХРОНИЗАЦИЯ МАРШРУТА.
           route + media применяются за один шаг, поэтому подписчики
           никогда не видят "новый URL со старым типом данных". */
        case 'ROUTE_SYNC': {
            const nextRoute = { ...state.route, ...(payload.route || {}) };
            const nextMedia = payload.media
                ? { ...state.media, ...payload.media }
                : state.media;
            return { ...state, route: nextRoute, media: nextMedia };
        }

        case 'SET_ROUTE':
            return { ...state, route: { ...state.route, ...payload } };

        case 'DATA_SET_MEDIA':
            return {
                ...state,
                data: {
                    ...state.data,
                    media: Array.isArray(payload) ? payload : [],
                    isMediaLoaded: true
                }
            };

        case 'DATA_SET_AGENTS':
            return {
                ...state,
                data: {
                    ...state.data,
                    agents: Array.isArray(payload) ? payload : [],
                    isAgentsLoaded: true
                }
            };

        case 'MEDIA_SYNC_STATE':
            return {
                ...state,
                media: {
                    ...state.media,
                    searchQuery: payload.searchQuery !== undefined ? payload.searchQuery : state.media.searchQuery,
                    filters: payload.filters !== undefined ? payload.filters : state.media.filters,
                    sort: payload.sort !== undefined ? payload.sort : state.media.sort,
                    sortDirection: payload.sortDirection !== undefined ? payload.sortDirection : state.media.sortDirection,
                    gridMode: payload.gridMode !== undefined ? payload.gridMode : state.media.gridMode,
                    currentPage: payload.currentPage !== undefined ? payload.currentPage : state.media.currentPage,
                    type: payload.type !== undefined ? payload.type : state.media.type
                }
            };

        case 'MEDIA_SET_PAGE':
            return { ...state, media: { ...state.media, currentPage: payload } };

        case 'AUDIO_LOAD_TRACKS':
            return { ...state, audio: { ...state.audio, tracks: payload } };

        case 'AUDIO_TOGGLE_MODE':
            return { ...state, audio: { ...state.audio, isMusicModeActive: !state.audio.isMusicModeActive } };

        case 'AUDIO_SET_PLAYING':
            return { ...state, audio: { ...state.audio, isPlaying: payload } };

        case 'AUDIO_SET_VOLUME':
            return { ...state, audio: { ...state.audio, volume: payload } };

        case 'AUDIO_SET_TRACK':
            return { ...state, audio: { ...state.audio, currentTrackIdx: payload } };

        case 'FX_CYCLE_MODE':
            return { ...state, fx: { ...state.fx, mode: (state.fx.mode + 1) % 4 } };

        case 'FX_TOGGLE_GODMODE':
            return { ...state, fx: { ...state.fx, isGodMode: !state.fx.isGodMode } };

        case 'FX_SET_ENGINES':
            return { ...state, fx: { ...state.fx, activeEngines: payload } };

        case 'FX_SET_PAUSE':
            return { ...state, fx: { ...state.fx, isPaused: payload } };

        case 'SYSTEM_SET_MOBILE':
            return { ...state, system: { ...state.system, isMobile: payload } };

        case 'SYSTEM_SET_LOADED':
            return { ...state, system: { ...state.system, isLoaded: true } };

        case 'SYSTEM_SET_ERROR':
            return { ...state, system: { ...state.system, lastError: payload } };

        default:
            return state;
    }
}

/**
 * STORE CLASS
 */
class Store {
    constructor(reducerFn, seed) {
        this.reducer = reducerFn;
        this.state = JSON.parse(JSON.stringify(seed));
        this.listeners = [];
        console.log('📦 [Store] Единое хранилище инициализировано');
    }

    getState() {
        return this.state;
    }

    dispatch(action) {
        if (!action || !action.type) {
            console.warn('⚠️ [Store] Пустой action проигнорирован.');
            return;
        }

        const prevState = this.state;
        let nextState;

        try {
            nextState = this.reducer(prevState, action);
        } catch (error) {
            console.error(`🚨 [Store] Ошибка редьюсера на action "${action.type}":`, error);
            return;
        }

        if (nextState === prevState) return;

        this.state = nextState;

        /* ВАЖНО: уведомляем СНАПШОТОМ nextState, а не this.state.
           Иначе вложенный dispatch (например, роутер пишет канонический URL
           прямо из mount) подменит аргументы у остальных подписчиков. */
        const snapshot = this.listeners.slice();
        snapshot.forEach(listener => {
            try {
                listener(nextState, prevState);
            } catch (error) {
                console.error(`🚨 [Store] Ошибка в listener на "${action.type}":`, error);
            }
        });
    }

    subscribe(listener) {
        if (typeof listener !== 'function') {
            console.warn('⚠️ [Store] Подписка отклонена: ожидается функция.');
            return () => {};
        }
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const AppStore = new Store(reducer, initialState);