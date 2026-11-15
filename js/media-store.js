/* js/media-store.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { SearchEngine } from './services/SearchEngine.js';
import { getYouTubeId } from './utils.js';
import { AppStore } from './store.js';
import { createStableId } from './utils/ids.js';

export const STATUS_MAP = {
    'completed': 'ПРОЙДЕНО', 'watched': 'ПОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'ПОД ВОПРОСОМ',
    'suggested': 'ПРЕДЛОЖКА'
};

const MEDIA_TYPES = ['games', 'movies'];

/**
 * ГИБРИДНОЕ ХРАНИЛИЩЕ МЕДИА
 * Оба манифеста (games + movies) грузятся ОДИН раз.
 * Переключение типа — это дешёвый выбор среза, а не перезагрузка.
 * Благодаря этому:
 *   - ссылка #/item/{id} работает для любого типа при холодной загрузке;
 *   - ID больше не пересоздаются при переключении вкладок;
 *   - мини-тирлист агента всегда находит постеры игр.
 */
export class MediaStore {
    constructor() {
        this.rawByType = { games: [], movies: [] };
        this.suggestions = [];
        this.allMedia = [];

        this.dataMain = [];
        this.dataSuggestions = [];
        this.filteredMain = [];
        this.filteredSuggestions = [];
        this.combinedData = [];
        this.filteredMainStandard = [];
        this.filteredSuggStandard = [];
        this.filteredYoutube = [];

        this.isLoaded = false;
        this.loadPromise = null;
        this.loadToken = 0;
        this.activeType = null;

        AppStore.subscribe((state, prevState) => {
            const curr = state.media;
            const prev = (prevState && prevState.media) || {};

            if (curr.type !== prev.type) {
                this.setActiveType(curr.type);
                return;
            }

            if (
                curr.searchQuery !== prev.searchQuery ||
                JSON.stringify(curr.filters) !== JSON.stringify(prev.filters) ||
                curr.sort !== prev.sort ||
                curr.sortDirection !== prev.sortDirection
            ) {
                if (!this.isLoaded) return;
                this.processData();
                EventBus.emit('MEDIA_STORE_UPDATED');
            }
        });

        this.setActiveType(AppStore.getState().media.type || 'games');
    }

    /* ==================== ЗАГРУЗКА ==================== */

    setActiveType(type) {
        const safeType = MEDIA_TYPES.includes(type) ? type : 'games';
        if (this.activeType === safeType && this.isLoaded) return;

        this.activeType = safeType;
        console.log(`📂 [MediaStore] Активный тип: ${safeType}`);

        if (!this.isLoaded) {
            this.ensureLoaded();
            return;
        }
        this.applyActiveType();
    }

    ensureLoaded() {
        if (this.loadPromise) return this.loadPromise;
        this.loadPromise = this.loadAll();
        return this.loadPromise;
    }

    async loadAll() {
        const token = ++this.loadToken;
        EventBus.emit('MEDIA_STORE_LOADING');
        console.log('📂 [MediaStore] Загрузка всех манифестов (games + movies + suggestions)...');

        try {
            const [games, movies, sugGames, sugMovies, sugYt] = await Promise.all([
                loadData('games.json', []),
                loadData('movies.json', []),
                loadData('suggestions-games.json', []),
                loadData('suggestions-movies.json', []),
                loadData('suggestions-youtube.json', [])
            ]);

            if (token !== this.loadToken) return;

            const used = new Set();
            this.rawByType.games = this.normalizeList(games, 'games', 'main', used, false);
            this.rawByType.movies = this.normalizeList(movies, 'movies', 'main', used, false);

            const pGames = this.normalizeList(sugGames, 'games', 'sug-games', used, true);
            const pMovies = this.normalizeList(sugMovies, 'movies', 'sug-movies', used, true);
            const pYt = this.normalizeList(sugYt, 'movies', 'yt', used, true);

            this.suggestions = [...pGames, ...pMovies, ...pYt];

            this.fastPreprocess(this.rawByType.games);
            this.fastPreprocess(this.rawByType.movies);
            this.fastPreprocess(this.suggestions);

            this.allMedia = [
                ...this.rawByType.games,
                ...this.rawByType.movies,
                ...this.suggestions
            ];

            this.isLoaded = true;
            AppStore.dispatch({ type: 'DATA_SET_MEDIA', payload: this.allMedia });
            console.log(`✅ [MediaStore] База загружена. Всего объектов: ${this.allMedia.length}`);

            this.applyActiveType();
            this.fetchMissingTitles(this.allMedia, token);
        } catch (error) {
            console.error('❌ [MediaStore] Критическая ошибка загрузки базы:', error);
            EventBus.emit('SYS_LOG', {
                type: 'system', tag: 'DATABASE', action: 'ERROR',
                value: 'LOAD_FAILED', color: 'var(--color-danger-red)'
            });
            // Разблокируем ожидание, чтобы страницы не висели вечно.
            this.isLoaded = true;
            this.allMedia = [];
            AppStore.dispatch({ type: 'DATA_SET_MEDIA', payload: [] });
            this.applyActiveType();
        }
    }

    /** Проставляет стабильные ID, тип, формат и статус (рекурсивно для коллекций). */
    normalizeList(array, defaultType, prefix, used, isSuggestion) {
        if (!Array.isArray(array)) {
            console.warn(`⚠️ [MediaStore] Ожидался массив для "${prefix}", получен:`, typeof array);
            return [];
        }

        return array.map(raw => {
            const item = { ...(raw || {}) };
            const hasItems = Array.isArray(item.items) && item.items.length > 0;

            item.id = createStableId(item, prefix, used);
            item.type = item.type || defaultType;
            item.format = item.format || (hasItems ? 'collection' : (prefix === 'yt' ? 'youtube' : 'standard'));
            if (isSuggestion) item.status = 'suggested';

            if (hasItems) {
                item.items = item.items.map(subRaw => {
                    const sub = { ...(subRaw || {}) };
                    sub.id = createStableId(sub, 'sub', used);
                    sub.type = sub.type || item.type;
                    sub.format = sub.format || 'standard';
                    if (isSuggestion) sub.status = 'suggested';
                    return sub;
                });
            }
            return item;
        });
    }

    applyActiveType() {
        this.dataMain = this.rawByType[this.activeType] || [];
        // YouTube всегда доступен — у него отдельная страница.
        this.dataSuggestions = this.suggestions.filter(
            item => item.type === this.activeType || item.format === 'youtube'
        );
        this.processData();
        EventBus.emit('MEDIA_STORE_LOADED');
    }

    /* ==================== ПРЕПРОЦЕССИНГ ==================== */

    fastPreprocess(list) {
        for (const item of list) {
            if (item.format === 'collection') {
                this.normalizeCollection(item);
            }
            if (item.format === 'youtube' && Array.isArray(item.videos) && item.videos.length > 0) {
                const ytId = getYouTubeId(item.videos[0]);
                if (ytId && !item.image) {
                    item.image = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                }
                if (!item.description) item.description = 'Описание от зрителя отсутствует.';
                if (!item.title) item.title = 'Установка связи...';
            }
        }
    }

    async fetchMissingTitles(list, token) {
        let hasChanges = false;
        const targets = list.filter(i => i.format === 'youtube' && i.title === 'Установка связи...');
        if (targets.length === 0) return;

        const tasks = targets.map(item => {
            const firstVid = item.videos[0];
            const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(firstVid)}&format=json`;
            return fetch(oembed)
                .then(r => { if (!r.ok) throw new Error('oembed failed'); return r.json(); })
                .then(d => { if (d.title) { item.title = d.title; hasChanges = true; } })
                .catch(() => fetch(`https://noembed.com/embed?url=${encodeURIComponent(firstVid)}`)
                    .then(r => r.json())
                    .then(d => { if (d.title) { item.title = d.title; hasChanges = true; } }))
                .catch(() => { item.title = 'Засекреченный видеофайл'; hasChanges = true; });
        });

        await Promise.allSettled(tasks);
        if (token !== this.loadToken) return;
        if (!hasChanges) return;

        AppStore.dispatch({ type: 'DATA_SET_MEDIA', payload: [...this.allMedia] });
        this.processData();
        EventBus.emit('MEDIA_STORE_SILENT_UPDATE');
        console.log('📂 [MediaStore] Названия YouTube-роликов обновлены.');
    }

    normalizeCollection(item) {
        if (!Array.isArray(item.items) || item.items.length === 0) return;
        const first = item.items[0];

        item.title = item.title || first.title;
        item.description = item.description || first.description;
        item.status = item.status || first.status;
        item.customColor = item.customColor || first.customColor;
        item.image = item.image || first.image;

        if (!item.images) {
            item.images = item.items.slice(0, 3).map(sub => sub.image).filter(Boolean);
        }
        if (item.rating === undefined) item.rating = first.rating || 0;

        const base = item.customColor || '#444455';
        item.stackColors = [
            base,
            (item.items[1] && item.items[1].customColor) || base,
            (item.items[2] && item.items[2].customColor) || base
        ];
    }

    /* ==================== ФИЛЬТРАЦИЯ / СОРТИРОВКА ==================== */

    processData() {
        const { searchQuery, filters, sort, sortDirection } = AppStore.getState().media;
        const isAllSelected = !filters || filters.length === 0;

        const filterFn = (item) => {
            let matchScore = 1;
            if (searchQuery && searchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && Array.isArray(item.items)) {
                    item.items.forEach(sub => {
                        textToSearch += ` ${sub.title || ''} ${sub.description || ''}`;
                    });
                }
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, searchQuery);
            }
            item._matchScore = matchScore;
            if (searchQuery && searchQuery.length > 0 && matchScore === 0) return false;
            if (isAllSelected) return true;
            return filters.includes(item.status);
        };

        const filteredMain = this.dataMain.filter(filterFn);
        const filteredSuggestions = this.dataSuggestions.filter(filterFn);

        const dir = sortDirection === 'asc' ? 1 : -1;
        const sortFn = (a, b) => {
            if (searchQuery && searchQuery.length > 0 && Math.abs((a._matchScore || 0) - (b._matchScore || 0)) > 0.1) {
                return (b._matchScore || 0) - (a._matchScore || 0);
            }
            if (sort === 'rating') return ((a.rating || 0) - (b.rating || 0)) * dir;
            return (a.title || '').localeCompare(b.title || '') * dir;
        };

        filteredMain.sort(sortFn);
        filteredSuggestions.sort(sortFn);

        this.filteredMain = filteredMain;
        this.filteredSuggestions = filteredSuggestions;
        this.combinedData = [...filteredMain, ...filteredSuggestions];
        this.filteredMainStandard = filteredMain.filter(i => i.format !== 'youtube');
        this.filteredSuggStandard = filteredSuggestions.filter(i => i.format !== 'youtube');
        this.filteredYoutube = [];
    }
}