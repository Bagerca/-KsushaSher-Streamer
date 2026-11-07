/* js/media-store.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { SearchEngine } from './services/SearchEngine.js';
import { getYouTubeId } from './utils.js';
import { AppStore } from './store.js';

export const STATUS_MAP = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'ПОД ВОПРОСОМ',
    'suggested': 'ПРЕДЛОЖКА'
};

export class MediaStore {
    constructor() {
        this.dataMain = [];
        this.dataSuggestions = [];
        
        this.filteredMain = [];
        this.filteredSuggestions = [];
        this.combinedData = [];
        
        this.filteredMainStandard = [];
        this.filteredSuggStandard = [];
        this.filteredYoutube = []; // Оставляем массив пустым для обратной совместимости (чтобы ничего не крашнулось)
        
        this.currentLoadId = 0; 
        this.activeLoadedType = null; 
        
        AppStore.subscribe((state, prevState) => {
            const m1 = state.media;
            const m2 = prevState?.media || {};
            
            if (m1.type !== m2.type && m1.type) {
                this.loadType(m1.type);
            } 
            else if (
                m1.searchQuery !== m2.searchQuery ||
                JSON.stringify(m1.filters) !== JSON.stringify(m2.filters) ||
                m1.sort !== m2.sort ||
                m1.sortDirection !== m2.sortDirection
            ) {
                this.processData();
                EventBus.emit('MEDIA_STORE_UPDATED');
            }
        });

        const initialType = AppStore.getState().media.type || 'games';
        this.loadType(initialType);
    }

    async loadType(type) {
        if (this.activeLoadedType === type) return;
        this.activeLoadedType = type;

        this.currentLoadId++;
        const loadId = this.currentLoadId;
        
        EventBus.emit('MEDIA_STORE_LOADING');
        
        const endpoint = type === 'games' ? 'games.json' : 'movies.json';
        
        try {
            const rawMain = await loadData(endpoint, []);
            
            const [sugGames, sugMovies, sugYt] = await Promise.all([
                loadData('suggestions-games.json', []),
                loadData('suggestions-movies.json', []),
                loadData('suggestions-youtube.json', [])
            ]);
            
            if (this.currentLoadId !== loadId) {
                return; 
            }
            
            const injectMeta = (array, defaultType, defaultFormat, idPrefix) => {
                return (Array.isArray(array) ? array : []).map((item, index) => ({
                    ...item,
                    id: item.id || `${idPrefix}-${Date.now()}-${index}`,
                    type: item.type || defaultType,
                    format: item.format || (item.items ? 'collection' : defaultFormat)
                }));
            };

            this.dataMain = injectMeta(rawMain, type, 'standard', 'main');
            
            const pGames = injectMeta(sugGames, 'games', 'standard', 'sug-games');
            const pMovies = injectMeta(sugMovies, 'movies', 'standard', 'sug-movies');
            const pYt = injectMeta(sugYt, 'movies', 'youtube', 'sug-yt');

            const rawSuggestions = [...pGames, ...pMovies, ...pYt].map(item => ({...item, status: 'suggested'}));
            
            // Оставляем YouTube-видео в глобальном кэше всегда для новой страницы YouTube
            this.dataSuggestions = rawSuggestions.filter(item => item.type === type || item.format === 'youtube');
            
            this.fastPreprocess(this.dataMain);
            this.fastPreprocess(this.dataSuggestions);
                
            const allMedia = [...this.dataMain, ...this.dataSuggestions];
            AppStore.dispatch({ type: 'DATA_SET_MEDIA', payload: allMedia });

            this.processData();
            EventBus.emit('MEDIA_STORE_LOADED');
            
            this.fetchMissingTitles(allMedia, loadId);
            
        } catch (error) {
            console.error("Ошибка загрузки медиа:", error);
            EventBus.emit('SYS_LOG', { type: 'system', tag: 'DATABASE', action: 'ERROR', value: `LOAD_${type.toUpperCase()}_FAILED`, color: '#ff4444' });
            
            if (this.currentLoadId === loadId) {
                this.activeLoadedType = null; 
                EventBus.emit('MEDIA_STORE_LOADED'); 
            }
        }
    }

    fastPreprocess(list) {
        for (const item of list) {
            if (item.format === 'collection') {
                this._normalizeCollection(item);
            }

            if (item.format === 'youtube' && item.videos && item.videos.length > 0) {
                const firstVid = item.videos[0]; 
                const ytId = getYouTubeId(firstVid);
                
                if (ytId && !item.image) {
                    item.image = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                }
                if (!item.description) {
                    item.description = "Описание от зрителя отсутствует.";
                }
                if (!item.title) {
                    item.title = "Установка связи..."; 
                }
            }
        }
    }

    async fetchMissingTitles(list, loadId) {
        let hasChanges = false;
        
        const fetchPromises = list.filter(i => i.format === 'youtube' && i.title === "Установка связи...").map(item => {
            const firstVid = item.videos[0];
            const fetchUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(firstVid)}&format=json`;
            
            return fetch(fetchUrl)
                .then(r => { if(!r.ok) throw new Error(); return r.json(); })
                .then(d => { if (d.title) { item.title = d.title; hasChanges = true; } })
                .catch(() => {
                    return fetch(`https://noembed.com/embed?url=${encodeURIComponent(firstVid)}`)
                        .then(r => r.json())
                        .then(d => { if (d.title) { item.title = d.title; hasChanges = true; } });
                })
                .catch(() => { item.title = "Засекреченный видеофайл"; hasChanges = true; });
        });

        if (fetchPromises.length > 0) {
            await Promise.allSettled(fetchPromises);
            
            if (this.currentLoadId !== loadId) return; 
            
            if (hasChanges) {
                AppStore.dispatch({ type: 'DATA_SET_MEDIA', payload: [...list] });
                this.processData();
                EventBus.emit('MEDIA_STORE_SILENT_UPDATE'); 
            }
        }
    }

    _normalizeCollection(item) {
        if (!item.items || item.items.length === 0) return;
        const firstItem = item.items[0];

        item.title = item.title || firstItem.title;
        item.description = item.description || firstItem.description;
        item.status = item.status || firstItem.status;
        item.customColor = item.customColor || firstItem.customColor;
        item.image = item.image || firstItem.image;

        if (!item.images) {
            item.images = item.items.slice(0, 3).map(sub => sub.image).filter(Boolean);
        }
        if (item.rating === undefined) {
            item.rating = firstItem.rating || 0;
        }

        item.stackColors = [
            item.customColor || '#444455',
            (item.items[1] && item.items[1].customColor) ? item.items[1].customColor : (item.customColor || '#444455'),
            (item.items[2] && item.items[2].customColor) ? item.items[2].customColor : (item.customColor || '#444455')
        ];
    }

    processData() {
        const { searchQuery, filters, sort, sortDirection } = AppStore.getState().media;
        const isAllSelected = filters.length === 0;

        const filterFn = (item) => {
            let matchScore = 1;
            
            if (searchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => {
                        textToSearch += ` ${sub.title || ''} ${sub.description || ''}`;
                    });
                }
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, searchQuery);
            }
            
            item._matchScore = matchScore;

            if (searchQuery.length > 0 && matchScore === 0) return false;
            if (isAllSelected) return true;

            return filters.includes(item.status);
        };

        let filteredMain = this.dataMain.filter(filterFn);
        let filteredSuggestions = this.dataSuggestions.filter(filterFn);

        const dir = sortDirection === 'asc' ? 1 : -1;
        const sortFn = (a, b) => {
            if (searchQuery.length > 0 && Math.abs((a._matchScore||0) - (b._matchScore||0)) > 0.1) {
                return (b._matchScore||0) - (a._matchScore||0);
            }
            if (sort === 'rating') {
                return ((a.rating || 0) - (b.rating || 0)) * dir;
            }
            return (a.title || "").localeCompare(b.title || "") * dir;
        };

        filteredMain.sort(sortFn);
        filteredSuggestions.sort(sortFn);

        this.filteredMain = filteredMain;
        this.filteredSuggestions = filteredSuggestions;
        this.combinedData = [...filteredMain, ...filteredSuggestions];

        // Отдаем в Основной Архив только стандартные карточки (Без YouTube)
        this.filteredMainStandard = filteredMain.filter(i => i.format !== 'youtube');
        this.filteredSuggStandard = filteredSuggestions.filter(i => i.format !== 'youtube');
        this.filteredYoutube = []; // Обнуляем, YouTube больше не нужен на главной странице
    }
}