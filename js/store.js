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
    
    // Централизованное хранилище сырых данных (Справочники)
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
        isPaused: false, // ДОБАВЛЕНО В ШАГЕ 3: Глобальная пауза для GPU
        activeEngines: []        
    },
    
    modal: {
        isOpen: false,
        type: null,              
        dataId: null             
    },

    system: {
        isMobile: false,
        isLoaded: false
    }
};

/**
 * РЕДЬЮСЕР (REDUCER)
 * Чистая функция для обработки Action.
 */
function reducer(state, action) {
    const { type, payload } = action;

    switch (type) {
        case 'SET_ROUTE':
            return { ...state, route: { ...state.route, ...payload } };

        case 'DATA_SET_MEDIA':
            return { ...state, data: { ...state.data, media: payload, isMediaLoaded: true } };
            
        case 'DATA_SET_AGENTS':
            return { ...state, data: { ...state.data, agents: payload, isAgentsLoaded: true } };

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

        case 'MODAL_OPEN':
            return { ...state, modal: { isOpen: true, type: payload.type, dataId: payload.dataId } };
        case 'MODAL_CLOSE':
            return { ...state, modal: { isOpen: false, type: null, dataId: null } };

        case 'SYSTEM_SET_MOBILE':
            return { ...state, system: { ...state.system, isMobile: payload } };
        case 'SYSTEM_SET_LOADED':
            return { ...state, system: { ...state.system, isLoaded: true } };

        default:
            return state;
    }
}

/**
 * STORE CLASS
 */
class Store {
    constructor(reducerFn, initialState) {
        this.reducer = reducerFn;
        // Клонируем только при инициализации
        this.state = JSON.parse(JSON.stringify(initialState));
        this.listeners = [];
        console.log('📦 [Store] Единое хранилище инициализировано');
    }

    getState() {
        return this.state;
    }

    dispatch(action) {
        const prevState = this.state;
        this.state = this.reducer(this.state, action);
        
        // Оптимизация: Redux-подход. Если ссылка на объект состояния изменилась, значит были мутации.
        // Это избавляет нас от тяжелого JSON.stringify при каждом чихе, что повышает FPS.
        if (prevState !== this.state) {
            this.listeners.forEach(listener => {
                try {
                    listener(this.state, prevState);
                } catch (error) {
                    console.error('🚨 [Store] Ошибка в listener:', error);
                }
            });
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const AppStore = new Store(reducer, initialState);