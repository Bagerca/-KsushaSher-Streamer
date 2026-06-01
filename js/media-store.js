/* js/media-store.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';

export const GENRE_MAP = {
    'action': 'Экшен', 'adventure': 'Приключения', 'comedy': 'Комедия', 'drama': 'Драма', 'horror': 'Хоррор', 'thriller': 'Триллер', 'scifi': 'Sci-Fi', 'fantasy': 'Фэнтези', 'mystery': 'Мистика', 'detective': 'Детектив', 'crime': 'Криминал', 'historical': 'Исторический', 'romance': 'Романтика', 'biography': 'Биография', 'movie': 'Фильм', 'series': 'Сериал', 'mini-series': 'Мини-сериал', 'cartoon': 'Мультфильм', 'anime': 'Аниме', 'anime-series': 'Аниме-сериал', 'short': 'Короткометражка', 'documentary': 'Документалка', 'show': 'ТВ-Шоу', 'animation': 'Анимация', 'superhero': 'Супергероика', 'sitcom': 'Ситком', 'slasher': 'Слэшер', 'musical': 'Мюзикл', 'western': 'Вестерн', 'noir': 'Нуар', 'sport': 'Спорт', 'war': 'Военный', 'family': 'Семейный', 'kids': 'Детский', 'adaptation': 'Экранизация', 'remake': 'Ремейк', 'blockbuster': 'Блокбастер', 'arthouse': 'Артхаус', 'trash': 'Трэш / B-Movie', 'psychological': 'Психологический', 'atmospheric': 'Атмосферный', 'feel-good': 'Добрый / Уютный', 'sad': 'Грустный', 'mind-bending': 'Вынос мозга', 'epic': 'Эпик', 'weird': 'Странное', 'classic': 'Классика', 'cult': 'Культовое', 'rpg': 'РПГ', 'shooter': 'Шутер', 'strategy': 'Стратегия', 'simulation': 'Симулятор', 'puzzle': 'Головоломка', 'platformer': 'Платформер', 'fighting': 'Файтинг', 'racing': 'Гонки', 'visual-novel': 'Виз. новелла', 'interactive-movie': 'Интерактивное кино', 'survival': 'Выживание', 'stealth': 'Стелс', 'roguelike': 'Рогалик', 'metroidvania': 'Метроидвания', 'souls-like': 'Соулс-лайк', 'open-world': 'Открытый мир', 'sandbox': 'Песочница', 'battle-royale': 'Батл-рояль', 'point-click': 'Point & Click', 'rhythm': 'Ритм', 'walking-sim': 'Сим. ходьбы', 'hack-and-slash': 'Слэшер', 'mmo': 'ММО', 'cyberpunk': 'Киберпанк', 'post-apocalyptic': 'Постапокалипсис', 'space': 'Космос', 'zombies': 'Зомби', 'retro': 'Ретро/80-е', 'dystopia': 'Антиутопия', 'magic': 'Магия', 'aliens': 'Пришельцы', 'indie': 'Инди', 'aaa': 'AAA', 'singleplayer': 'Одиночная', 'coop': 'Кооператив', 'multiplayer': 'Мультиплеер', 'free': 'Бесплатно', 'early-access': 'Ранний доступ', 'story-rich': 'Сюжетная', 'funny': 'Комедия/Юмор'
};

export const STATUS_MAP = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'ПОД ВОПРОСОМ',
    'suggested': 'ПРЕДЛОЖКА'
};

export const VALID_STATUSES = ['completed', 'playing', 'watched', 'watching', 'dropped', 'on-hold', 'suggested'];

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
                
            this.processData();
            EventBus.emit('MEDIA_STORE_LOADED');
            EventBus.emit('SYS_LOG', { html: `[DB] Загружена база: ${type.toUpperCase()}` });
        } catch (error) {
            console.error("Ошибка загрузки медиа:", error);
            EventBus.emit('SYS_LOG', { html: `<span class="terminal-err">[DB] Ошибка загрузки ${type}</span>` });
        }
    }

    getAllGenres() {
        const allGenres = new Set();
        [...this.dataMain, ...this.dataSuggestions].forEach(item => { 
            if (item.genres && Array.isArray(item.genres)) {
                item.genres.forEach(g => allGenres.add(g)); 
            }
        });
        return Array.from(allGenres).sort((a, b) => (GENRE_MAP[a] || a).localeCompare(GENRE_MAP[b] || b));
    }

    toggleFilter(val) {
        if (this.activeFilters.has(val)) {
            this.activeFilters.delete(val);
        } else {
            // Если выбрали статус, очищаем другие жанры (сохраняем логику старого кода)
            if (VALID_STATUSES.includes(val)) {
                const currentGenres = [];
                this.activeFilters.forEach(f => {
                    if (!VALID_STATUSES.includes(f)) currentGenres.push(f);
                });
                this.activeFilters.clear();
                currentGenres.forEach(g => this.activeFilters.add(g));
            }
            this.activeFilters.add(val);
        }
        this.processData();
        EventBus.emit('MEDIA_STORE_UPDATED');
    }

    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase();
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
        if (query.length < 1) return [];
        const fullList = [...this.dataMain, ...this.dataSuggestions];
        
        let matches = fullList.map(item => {
            let score = 0;
            if (query.length < 3 && item.title) {
                 score = item.title.toLowerCase().includes(query) ? 1 : 0;
            } else if (item.title) {
                 score = this._calculateSimilarity(item.title, query);
            }
            return { ...item, score };
        }).filter(item => item.score > 0.25); 

        return matches.sort((a, b) => b.score - a.score).slice(0, 4);
    }

    processData() {
        const activeStatuses = new Set();
        const activeGenres = new Set();
        const isAllSelected = this.activeFilters.size === 0;

        if (!isAllSelected) {
            this.activeFilters.forEach(filter => {
                if (VALID_STATUSES.includes(filter)) activeStatuses.add(filter);
                else activeGenres.add(filter);
            });
        }

        const filterFn = (item) => {
            let matchScore = 1;
            if (this.searchQuery.length > 0 && item.title) {
                matchScore = this.searchQuery.length < 3 
                    ? (item.title.toLowerCase().includes(this.searchQuery) ? 1 : 0)
                    : this._calculateSimilarity(item.title, this.searchQuery);
            }
            item._matchScore = matchScore;

            if (matchScore < 0.25) return false;
            if (isAllSelected) return true;

            let statusMatch = activeStatuses.size > 0 ? activeStatuses.has(item.status) : true;
            let genreMatch = true;
            if (activeGenres.size > 0) {
                if (!item.genres || item.genres.length === 0) genreMatch = false;
                else genreMatch = item.genres.some(g => activeGenres.has(g));
            }
            
            return statusMatch && genreMatch;
        };

        let filteredMain = this.dataMain.filter(filterFn);
        let filteredSuggestions = this.dataSuggestions.filter(filterFn);

        const dir = this.sortDirection === 'asc' ? 1 : -1;
        const sortFn = (a, b) => {
            if (this.searchQuery.length > 0 && Math.abs(a._matchScore - b._matchScore) > 0.1) {
                return b._matchScore - a._matchScore;
            }
            if (this.sort === 'rating') return ((parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0)) * dir;
            return (a.title || "").localeCompare(b.title || "") * dir;
        };

        filteredMain.sort(sortFn);
        filteredSuggestions.sort(sortFn);

        this.combinedData = [...filteredMain];

        if (filteredSuggestions.length > 0) {
            const sugPosters = filteredSuggestions.filter(item => item.format !== 'youtube');
            const sugYoutube = filteredSuggestions.filter(item => item.format === 'youtube');

            if (isAllSelected) {
                const title = filteredMain.length > 0 ? "COMMUNITY_SUGGESTIONS // ПРЕДЛОЖКА" : "SUGGESTED";
                this.combinedData.push({ isDivider: true, title });
            }

            this.combinedData = [...this.combinedData, ...sugPosters];

            if (sugYoutube.length > 0) {
                if (sugPosters.length > 0) this.combinedData.push({ isSpacer: true });
                this.combinedData = [...this.combinedData, ...sugYoutube];
            }
        }
    }

    // --- Private Math Helpers ---
    _getTrigrams(text) {
        if (!text) return [];
        const cleanText = text.toLowerCase().replace(/[^\wа-яё0-9]/gi, '');
        if (cleanText.length < 3) return [cleanText];
        const trigrams = [];
        for (let i = 0; i < cleanText.length - 2; i++) trigrams.push(cleanText.substring(i, i + 3));
        return trigrams;
    }

    _calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        if (str1.toLowerCase().includes(str2.toLowerCase())) return 1.0;
        const set1 = this._getTrigrams(str1);
        const set2 = this._getTrigrams(str2);
        let matches = 0;
        for (const trigram of set2) { if (set1.includes(trigram)) matches++; }
        return (2.0 * matches) / (set1.length + set2.length);
    }
}