/* js/router.js */
import { AppStore } from './store.js';

class Router {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        window.addEventListener('hashchange', () => this.handleHashChange());
        
        if (!window.location.hash || window.location.hash === '#') {
            window.location.hash = '#/';
        } else {
            this.handleHashChange();
        }

        this.isInitialized = true;
        console.log('🧭 [Router] Инициализирован и перехватывает маршруты');
    }

    handleHashChange() {
        try {
            const rawHash = window.location.hash.slice(1) || '/';
            const { path, query, params } = this.parseHash(rawHash);

            AppStore.dispatch({
                type: 'SET_ROUTE',
                payload: { path, params, query, raw: rawHash }
            });

            const mediaState = {
                searchQuery: query.search || '',
                filters: query.filters ? query.filters.split(',') : [],
                sort: query.sort || 'name',
                sortDirection: query.sortDir || 'asc',
                gridMode: query.mode || 'detailed'
            };
            
            if ((path === '/archive' || path === '/tierlist' || path === '/library') && params.type) {
                mediaState.type = params.type;
            }

            AppStore.dispatch({ type: 'MEDIA_SYNC_STATE', payload: mediaState });

            // Мы убрали логику модалки (query.modal === 'agent'), так как теперь это отдельная страница
            AppStore.dispatch({ type: 'MODAL_CLOSE' });

        } catch (error) {
            console.error('🚨 [Router] Ошибка при обработке маршрута:', error);
        }
    }

    parseHash(hash) {
        const [pathPart, queryPart] = hash.split('?');
        const query = {};
        
        if (queryPart) {
            const searchParams = new URLSearchParams(queryPart);
            for (let [key, value] of searchParams.entries()) {
                query[key] = value;
            }
        }

        const segments = pathPart.split('/').filter(Boolean);
        let path = '/';
        let params = {};

        if (segments.length > 0) {
            const base = segments[0];
            path = `/${base}`;
            
            if ((base === 'archive' || base === 'tierlist' || base === 'library') && segments[1]) {
                params.type = segments[1];
            } else if ((base === 'item' || base === 'agents') && segments[1]) {
                params.id = segments[1]; 
            }
        }

        return { path, query, params };
    }

    navigate(path, params = {}, query = {}) {
        let newHash = path;
        
        if ((path === '/archive' || path === '/tierlist' || path === '/library') && params.type) {
            newHash += `/${params.type}`;
        } else if ((path === '/item' || path === '/agents') && params.id) {
            newHash += `/${params.id}`; 
        }

        const queryKeys = Object.keys(query);
        if (queryKeys.length > 0) {
            const searchParams = new URLSearchParams();
            queryKeys.forEach(key => {
                if (query[key] !== null && query[key] !== undefined && query[key] !== '') {
                    searchParams.append(key, query[key]);
                }
            });
            const queryString = searchParams.toString();
            if (queryString) newHash += `?${queryString}`;
        }

        window.location.hash = newHash;
    }

    updateQuery(newQueryParams) {
        const currentHash = window.location.hash.slice(1) || '/';
        const { path, query, params } = this.parseHash(currentHash);
        
        const mergedQuery = { ...query, ...newQueryParams };
        
        Object.keys(mergedQuery).forEach(key => {
            if (mergedQuery[key] === null || mergedQuery[key] === undefined || mergedQuery[key] === '') {
                delete mergedQuery[key];
            }
        });

        this.navigate(path, params, mergedQuery);
    }
}

export const AppRouter = new Router();