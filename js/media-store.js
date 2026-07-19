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
            const rawSuggestions = await loadData('suggestions.json', []);
            
            this.dataMain = Array.isArray(rawMain) ? rawMain : [];
            
            // ИСПРАВЛЕНИЕ: Автоматически назначаем статус 'suggested' всему, что пришло из предложки
            this.dataSuggestions = Array.isArray(rawSuggestions) 
                ? rawSuggestions.map(item => ({ ...item, status: 'suggested' })).filter(item => item.type === type) 
                : [];
            
            await this.preprocessDataAsync(this.dataMain);
            await this.preprocessDataAsync(this.dataSuggestions);
                
            this.processData();
            EventBus.emit('MEDIA_STORE_LOADED');
            EventBus.emit('SYS_LOG', { html: `[DB] Загружена база: ${type.toUpperCase()}` });
        } catch (error) {
            console.error("Ошибка загрузки медиа:", error);
            EventBus.emit('SYS_LOG', { html: `<span class="terminal-err">[DB] Ошибка загрузки ${type}</span>` });
        }
    }

    async preprocessDataAsync(list) {
        const fetchPromises = [];

        for (const item of list) {
            // Логика для коллекций
            if (item.format === 'collection' && item.items && item.items.length > 0) {
                const firstGame = item.items[0];
                item.title = item.title || firstGame.title;
                item.description = item.description || firstGame.description;
                item.image = item.image || firstGame.image;
                item.status = item.status || firstGame.status;
            }

            // АВТОМАТИЗАЦИЯ YOUTUBE
            if (item.format === 'youtube' && item.videos && item.videos.length > 0) {
                const firstVid = typeof item.videos[0] === 'string' ? item.videos[0] : item.videos[0].url;
                const ytId = getYouTubeId(firstVid);
                
                if (ytId && !item.image) {
                    item.image = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
                }
                
                // Если пользователь не написал описание, ставим заглушку
                if (!item.description) {
                    item.description = "Описание от зрителя отсутствует.";
                }

                if (!item.title) {
                    item.title = "Установка связи..."; 
                    
                    const p = fetch(`https://noembed.com/embed?url=${firstVid}`)
                        .then(r => r.json())
                        .then(d => {
                            if (d.title) item.title = d.title;
                        }).catch(() => {
                            item.title = "Засекреченный видеофайл";
                        });
                        
                    fetchPromises.push(p);
                }
            }
        }

        if (fetchPromises.length > 0) {
            await Promise.allSettled(fetchPromises);
        }
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

        fullList.forEach(item => {
            flattenedList.push(item);
            if (item.format === 'collection' && item.items) {
                item.items.forEach(sub => {
                    flattenedList.push({ ...sub, status: sub.status || item.status, isSubItem: true });
                });
            }
        });

        const uniqueMap = new Map();
        flattenedList.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        });
        flattenedList = Array.from(uniqueMap.values());

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
                let ratingA = a.rating || 0;
                let ratingB = b.rating || 0;
                
                if (a.format === 'collection' && a.items) {
                    let sum = 0, count = 0;
                    a.items.forEach(i => { if (i.rating > 0) { sum += i.rating; count++; } });
                    if (count > 0) ratingA = sum / count;
                }
                if (b.format === 'collection' && b.items) {
                    let sum = 0, count = 0;
                    b.items.forEach(i => { if (i.rating > 0) { sum += i.rating; count++; } });
                    if (count > 0) ratingB = sum / count;
                }
                
                return (ratingA - ratingB) * dir;
            }
            return (a.title || "").localeCompare(b.title || "") * dir;
        };

        filteredMain.sort(sortFn);
        filteredSuggestions.sort(sortFn);

        this.combinedData = [...filteredMain, ...filteredSuggestions];
    }
}