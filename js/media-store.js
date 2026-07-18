/* js/media-store.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { SearchEngine } from './services/SearchEngine.js';

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
            this.dataSuggestions = Array.isArray(rawSuggestions) 
                ? rawSuggestions.filter(item => item.type === type) 
                : [];
            
            this.preprocessData(this.dataMain);
            this.preprocessData(this.dataSuggestions);
                
            this.processData();
            EventBus.emit('MEDIA_STORE_LOADED');
            EventBus.emit('SYS_LOG', { html: `[DB] Загружена база: ${type.toUpperCase()}` });
        } catch (error) {
            console.error("Ошибка загрузки медиа:", error);
            EventBus.emit('SYS_LOG', { html: `<span class="terminal-err">[DB] Ошибка загрузки ${type}</span>` });
        }
    }

    preprocessData(list) {
        list.forEach(item => {
            if (item.format === 'collection' && item.items && item.items.length > 0) {
                const firstGame = item.items[0];
                item.title = firstGame.title;
                item.description = firstGame.description;
                item.image = firstGame.image;
                item.status = firstGame.status;
            }
        });
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

        // Убираем дубликаты
        const uniqueMap = new Map();
        flattenedList.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        });
        flattenedList = Array.from(uniqueMap.values());

        // Делегируем вычисление Score движку поиска
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
                
                // Делегируем вычисление Score движку поиска
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
            // Если есть поиск, сортируем по релевантности (Match Score)
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