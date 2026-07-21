/* js/media-store.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { SearchEngine } from './services/SearchEngine.js';
import { getYouTubeId } from './utils.js';

export const STATUS_MAP = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'ПОД ВОПРОСОМ',
    'suggested': 'ПРЕДЛОЖКА'
};

export class MediaStore {
    constructor() {
        this.currentType = 'games';
        this.dataMain = [];
        this.dataSuggestions = [];
        
        this.filteredMain = [];
        this.filteredSuggestions = [];
        this.combinedData = [];
        
        this.activeFilters = new Set(); 
        this.searchQuery = '';
        this.sort = 'name';
        this.sortDirection = 'asc';
    }

    async loadType(type) {
        this.currentType = type;
        this.activeFilters.clear();
        this.searchQuery = '';
        
        const endpoint = type === 'games' ? 'games.json' : 'movies.json';
        
        try {
            const rawMain = await loadData(endpoint, []);
            
            const [sugGames, sugMovies, sugYt] = await Promise.all([
                loadData('suggestions-games.json', []),
                loadData('suggestions-movies.json', []),
                loadData('suggestions-youtube.json', [])
            ]);
            
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
            
            this.dataSuggestions = rawSuggestions.filter(item => item.type === type);
            
            await this.preprocessDataAsync(this.dataMain);
            await this.preprocessDataAsync(this.dataSuggestions);
                
            this.processData();
            EventBus.emit('MEDIA_STORE_LOADED');
            
        } catch (error) {
            console.error("Ошибка загрузки медиа:", error);
            EventBus.emit('SYS_LOG', { type: 'system', tag: 'DATABASE', action: 'ERROR', value: `LOAD_${type.toUpperCase()}_FAILED`, color: '#ff4444' });
        }
    }

    async preprocessDataAsync(list) {
        const fetchPromises = [];

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
                    
                    const fetchUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(firstVid)}&format=json`;
                    
                    const p = fetch(fetchUrl)
                        .then(r => {
                            if(!r.ok) throw new Error('oEmbed error');
                            return r.json();
                        })
                        .then(d => {
                            if (d.title && item.title === "Установка связи...") item.title = d.title;
                        }).catch(() => {
                            return fetch(`https://noembed.com/embed?url=${encodeURIComponent(firstVid)}`)
                                .then(r => r.json())
                                .then(d => {
                                    if (d.title && item.title === "Установка связи...") item.title = d.title;
                                });
                        }).catch(() => {
                            if (item.title === "Установка связи...") item.title = "Засекреченный видеофайл";
                        });
                        
                    fetchPromises.push(p);
                }
            }
        }

        if (fetchPromises.length > 0) {
            await Promise.allSettled(fetchPromises);
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

    toggleFilter(val) {
        if (this.activeFilters.has(val)) {
            this.activeFilters.delete(val);
        } else {
            this.activeFilters.clear();
            this.activeFilters.add(val);
        }
        this.processData();
        EventBus.emit('MEDIA_STORE_UPDATED');
    }

    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.processData();
        EventBus.emit('MEDIA_STORE_UPDATED');
    }

    setSort(sortType) {
        if (this.sort === sortType) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sort = sortType;
            this.sortDirection = sortType === 'rating' ? 'desc' : 'asc';
        }
        this.processData();
        EventBus.emit('MEDIA_STORE_UPDATED');
    }

    getItemById(id) {
        return [...this.dataMain, ...this.dataSuggestions].find(i => i.id === id);
    }

    getSearchSuggestions(query) {
        if (query.trim().length < 1) return [];

        let flattenedList = [];
        const fullList = [...this.dataMain, ...this.dataSuggestions];

        // ИСПРАВЛЕНИЕ БАГА: Не добавляем саму коллекцию в поиск, берем только её "детей"
        fullList.forEach(item => {
            if (item.format === 'collection' && item.items && item.items.length > 0) {
                // Если это коллекция, добавляем только элементы внутри неё
                item.items.forEach(sub => {
                    flattenedList.push({ ...sub, status: sub.status || item.status, isSubItem: true });
                });
            } else {
                // Если это обычная игра/фильм, добавляем как есть
                flattenedList.push(item);
            }
        });

        // Убираем полные дубликаты по ID (на всякий случай)
        const uniqueMap = new Map();
        flattenedList.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        });
        flattenedList = Array.from(uniqueMap.values());

        // Прогоняем через движок поиска
        let matches = flattenedList.map(item => {
            const score = SearchEngine.scoreItemForSuggestions(item.title, query);
            return { ...item, score };
        }).filter(item => item.score > 15);

        return matches.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    processData() {
        const isAllSelected = this.activeFilters.size === 0;

        const filterFn = (item) => {
            let matchScore = 1;
            
            if (this.searchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => {
                        textToSearch += ` ${sub.title || ''} ${sub.description || ''}`;
                    });
                }
                
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, this.searchQuery);
            }
            
            item._matchScore = matchScore;

            if (this.searchQuery.length > 0 && matchScore === 0) return false;
            if (isAllSelected) return true;

            return this.activeFilters.has(item.status);
        };

        let filteredMain = this.dataMain.filter(filterFn);
        let filteredSuggestions = this.dataSuggestions.filter(filterFn);

        const dir = this.sortDirection === 'asc' ? 1 : -1;
        const sortFn = (a, b) => {
            if (this.searchQuery.length > 0 && Math.abs(a._matchScore - b._matchScore) > 0.1) {
                return b._matchScore - a._matchScore;
            }
            
            if (this.sort === 'rating') {
                const ratingA = a.rating || 0;
                const ratingB = b.rating || 0;
                return (ratingA - ratingB) * dir;
            }
            return (a.title || "").localeCompare(b.title || "") * dir;
        };

        filteredMain.sort(sortFn);
        filteredSuggestions.sort(sortFn);

        this.filteredMain = filteredMain;
        this.filteredSuggestions = filteredSuggestions;
        this.combinedData = [...filteredMain, ...filteredSuggestions];

        this.filteredMainStandard = filteredMain.filter(i => i.format !== 'youtube');
        this.filteredSuggStandard = filteredSuggestions.filter(i => i.format !== 'youtube');
        
        this.filteredYoutube = [
            ...filteredMain.filter(i => i.format === 'youtube'), 
            ...filteredSuggestions.filter(i => i.format === 'youtube')
        ];
        this.filteredYoutube.sort(sortFn); 
    }
}