/* js/media-store.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { calculateSimilarity } from './utils.js';

export const STATUS_MAP = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'ПОД ВОПРОСОМ',
    'suggested': 'ПРЕДЛОЖКА'
};

export const VALID_STATUSES = ['completed', 'playing', 'watched', 'watching', 'dropped', 'on-hold', 'suggested'];

const EN_TO_RU = {'q':'й', 'w':'ц', 'e':'у', 'r':'к', 't':'е', 'y':'н', 'u':'г', 'i':'ш', 'o':'щ', 'p':'з', '[':'х', ']':'ъ', 'a':'ф', 's':'ы', 'd':'в', 'f':'а', 'g':'п', 'h':'р', 'j':'о', 'k':'л', 'l':'д', ';':'ж', "'":'э', 'z':'я', 'x':'ч', 'c':'с', 'v':'м', 'b':'и', 'n':'т', 'm':'ь', ',':'б', '.':'ю'};
const RU_TO_EN = {};
for (let k in EN_TO_RU) RU_TO_EN[EN_TO_RU[k]] = k;

const RU_TO_EN_PHONETIC = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

function switchLayout(str) {
    let res = '';
    for(let char of str) {
        if(EN_TO_RU[char]) res += EN_TO_RU[char];
        else if(RU_TO_EN[char]) res += RU_TO_EN[char];
        else res += char;
    }
    return res;
}

function transliterate(str) {
    return str.toLowerCase().split('').map(char => RU_TO_EN_PHONETIC[char] || char).join('');
}

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
            // Разрешаем только один статус за раз
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
        const cleanQuery = query.toLowerCase().trim();
        const layoutSwitched = switchLayout(cleanQuery);
        const translitQuery = transliterate(cleanQuery);

        let flattenedList = [];
        const fullList = [...this.dataMain, ...this.dataSuggestions];

        fullList.forEach(item => {
            flattenedList.push(item);
            if (item.format === 'collection' && item.items) {
                item.items.forEach(sub => {
                    flattenedList.push({
                        ...sub,
                        status: sub.status || item.status,
                        isSubItem: true
                    });
                });
            }
        });

        const uniqueMap = new Map();
        flattenedList.forEach(item => {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        });
        flattenedList = Array.from(uniqueMap.values());

        let matches = flattenedList.map(item => {
            let score = 0;
            const title = item.title ? item.title.toLowerCase() : "";

            if (title === cleanQuery) score = 100;
            else if (title.startsWith(cleanQuery)) score = 80;
            else if (title.includes(` ${cleanQuery}`)) score = 65;
            else if (title.includes(cleanQuery)) score = 50;

            if (score === 0) {
                if (title === layoutSwitched) score = 90;
                else if (title.startsWith(layoutSwitched)) score = 70;
                else if (title.includes(layoutSwitched)) score = 45;
            }

            if (score === 0 && translitQuery !== cleanQuery) {
                if (title === translitQuery) score = 85;
                else if (title.startsWith(translitQuery)) score = 65;
                else if (title.includes(translitQuery)) score = 40;
            }

            if (score === 0 && cleanQuery.length > 2) {
                const fuzzyOriginal = calculateSimilarity(title, cleanQuery);
                const fuzzyTranslit = calculateSimilarity(title, translitQuery);
                const bestFuzzy = Math.max(fuzzyOriginal, fuzzyTranslit);
                if (bestFuzzy > 0.35) score = bestFuzzy * 40; 
            }

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
                
                const layoutSwitched = switchLayout(this.searchQuery);
                const translitQuery = transliterate(this.searchQuery);

                if (textToSearch.includes(this.searchQuery)) {
                    matchScore = item.title && item.title.toLowerCase().startsWith(this.searchQuery) ? 0.9 : 0.6;
                } else if (textToSearch.includes(layoutSwitched)) {
                    matchScore = 0.5;
                } else if (textToSearch.includes(translitQuery) && translitQuery !== this.searchQuery) {
                    matchScore = 0.45;
                } else {
                    const fuzzyOriginal = calculateSimilarity(item.title, this.searchQuery);
                    const fuzzyTranslit = calculateSimilarity(item.title, translitQuery);
                    const bestFuzzy = Math.max(fuzzyOriginal, fuzzyTranslit);
                    matchScore = bestFuzzy > 0.35 ? bestFuzzy : 0;
                }
            }
            item._matchScore = matchScore;

            if (this.searchQuery.length > 0 && matchScore === 0) return false;
            if (isAllSelected) return true;

            // Фильтруем только по статусу
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