// ==================== МОДУЛЬ ЗАГРУЗКИ ДАННЫХ ====================
// Отвечает за загрузку и кэширование данных из JSON файлов

const DataLoader = {
    // Кэш загруженных данных
    cache: {
        games: null,
        movies: null,
        schedule: null,
        stats: null,
        lastUpdated: {}
    },

    // Конфигурация загрузки
    config: {
        cacheTimeout: 5 * 60 * 1000, // 5 минут
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 10000 // 10 секунд
    },

    // Состояние загрузки
    state: {
        isLoading: false,
        pendingRequests: new Set(),
        activeRetries: {}
    }
};

// ==================== ОСНОВНЫЕ МЕТОДЫ ЗАГРУЗКИ ====================

/**
 * Загрузка данных игр с кэшированием и повторными попытками
 */
DataLoader.loadGames = async function() {
    return this.loadData('games', 'data/games.json');
};

/**
 * Загрузка данных фильмов с кэшированием и повторными попытками
 */
DataLoader.loadMovies = async function() {
    return this.loadData('movies', 'data/movies.json');
};

/**
 * Загрузка данных расписания с кэшированием и повторными попытками
 */
DataLoader.loadSchedule = async function() {
    return this.loadData('schedule', 'data/schedule.json');
};

/**
 * Загрузка данных статистики с кэшированием и повторными попытками
 */
DataLoader.loadStats = async function() {
    return this.loadData('stats', 'data/stats.json');
};

/**
 * Универсальный метод загрузки данных
 */
DataLoader.loadData = async function(dataType, url) {
    const cacheKey = dataType;
    
    // Проверяем кэш
    if (this.isCacheValid(cacheKey)) {
        console.log(`📀 [${dataType}] Данные из кэша`);
        return this.cache[cacheKey];
    }

    // Проверяем, не выполняется ли уже запрос
    if (this.state.pendingRequests.has(cacheKey)) {
        console.log(`⏳ [${dataType}] Ожидание завершения текущего запроса`);
        return await this.waitForPendingRequest(cacheKey);
    }

    try {
        this.state.pendingRequests.add(cacheKey);
        this.state.isLoading = true;

        console.log(`📥 [${dataType}] Начинаем загрузку...`);
        
        const data = await this.fetchWithRetry(url, dataType);
        
        // Сохраняем в кэш
        this.cache[cacheKey] = data;
        this.cache.lastUpdated[cacheKey] = Date.now();
        
        console.log(`✅ [${dataType}] Успешно загружено:`, this.getDataStats(data));
        
        return data;
        
    } catch (error) {
        console.error(`❌ [${dataType}] Ошибка загрузки:`, error.message);
        
        // Пробуем вернуть данные из кэша, даже если они устарели
        if (this.cache[cacheKey]) {
            console.warn(`🔄 [${dataType}] Используем устаревшие данные из кэша`);
            return this.cache[cacheKey];
        }
        
        // Возвращаем демо-данные если ничего нет
        return this.getFallbackData(dataType);
        
    } finally {
        this.state.pendingRequests.delete(cacheKey);
        this.state.isLoading = this.state.pendingRequests.size > 0;
    }
};

// ==================== МЕТОДЫ ДЛЯ РАБОТЫ С КЭШЕМ ====================

/**
 * Проверка валидности кэша
 */
DataLoader.isCacheValid = function(cacheKey) {
    if (!this.cache[cacheKey]) return false;
    
    const lastUpdated = this.cache.lastUpdated[cacheKey];
    if (!lastUpdated) return false;
    
    const cacheAge = Date.now() - lastUpdated;
    return cacheAge < this.config.cacheTimeout;
};

/**
 * Очистка кэша
 */
DataLoader.clearCache = function(dataType = null) {
    if (dataType) {
        this.cache[dataType] = null;
        this.cache.lastUpdated[dataType] = null;
        console.log(`🧹 Кэш [${dataType}] очищен`);
    } else {
        this.cache = {
            games: null,
            movies: null,
            schedule: null,
            stats: null,
            lastUpdated: {}
        };
        console.log('🧹 Весь кэш очищен');
    }
};

/**
 * Принудительное обновление данных (игнорируя кэш)
 */
DataLoader.forceReload = async function(dataType) {
    this.clearCache(dataType);
    return await this.loadData(dataType, this.getUrlForDataType(dataType));
};

/**
 * Получение статистики кэша
 */
DataLoader.getCacheStats = function() {
    const stats = {};
    const now = Date.now();
    
    Object.keys(this.cache.lastUpdated).forEach(key => {
        if (this.cache[key]) {
            const age = now - this.cache.lastUpdated[key];
            stats[key] = {
                hasData: true,
                age: Math.round(age / 1000),
                isValid: age < this.config.cacheTimeout,
                size: this.getDataSize(this.cache[key])
            };
        }
    });
    
    return stats;
};

// ==================== МЕТОДЫ ДЛЯ РАБОТЫ С СЕТЬЮ ====================

/**
 * Загрузка с повторными попытками
 */
DataLoader.fetchWithRetry = async function(url, dataType, attempt = 1) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url + '?t=' + Date.now(), {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Валидация данных
        this.validateData(data, dataType);
        
        return data;
        
    } catch (error) {
        if (attempt >= this.config.retryAttempts) {
            throw error;
        }
        
        console.warn(`🔄 [${dataType}] Попытка ${attempt}/${this.config.retryAttempts}: ${error.message}`);
        
        // Увеличиваем задержку между попытками
        const delay = this.config.retryDelay * attempt;
        await this.delay(delay);
        
        return this.fetchWithRetry(url, dataType, attempt + 1);
    }
};

/**
 * Валидация загруженных данных
 */
DataLoader.validateData = function(data, dataType) {
    switch (dataType) {
        case 'games':
        case 'movies':
            if (!Array.isArray(data)) {
                throw new Error(`Ожидался массив для ${dataType}`);
            }
            break;
            
        case 'schedule':
            if (!data || typeof data !== 'object') {
                throw new Error('Некорректный формат расписания');
            }
            if (data.schedule && !Array.isArray(data.schedule)) {
                throw new Error('Расписание должно быть массивом');
            }
            break;
            
        case 'stats':
            if (!data || typeof data !== 'object') {
                throw new Error('Некорректный формат статистики');
            }
            break;
    }
};

/**
 * Ожидание завершения pending запроса
 */
DataLoader.waitForPendingRequest = function(cacheKey) {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (!this.state.pendingRequests.has(cacheKey)) {
                clearInterval(checkInterval);
                
                if (this.cache[cacheKey]) {
                    resolve(this.cache[cacheKey]);
                } else {
                    reject(new Error(`Запрос для ${cacheKey} завершился неудачно`));
                }
            }
        }, 100);
        
        // Таймаут ожидания
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error(`Таймаут ожидания для ${cacheKey}`));
        }, this.config.timeout);
    });
};

// ==================== РЕЗЕРВНЫЕ ДАННЫЕ ====================

/**
 * Получение резервных данных
 */
DataLoader.getFallbackData = function(dataType) {
    console.warn(`🛟 [${dataType}] Используем резервные данные`);
    
    switch (dataType) {
        case 'games':
            return this.getFallbackGames();
            
        case 'movies':
            return this.getFallbackMovies();
            
        case 'schedule':
            return this.getFallbackSchedule();
            
        case 'stats':
            return this.getFallbackStats();
            
        default:
            return null;
    }
};

/**
 * Резервные данные для игр
 */
DataLoader.getFallbackGames = function() {
    return [
        {
            id: 'fallback-portal',
            title: 'Portal 2',
            rating: 5,
            description: 'Культовая головоломка от Valve. Данные загружаются...',
            image: 'https://cdn2.steamgriddb.com/grid/24be7c4485d63a3d70e038692172adce.png',
            genres: ['puzzle', 'adventure'],
            status: 'completed',
            videoId: 'dQw4w9WgXcQ',
            customColor: '#39ff14'
        }
    ];
};

/**
 * Резервные данные для фильмов
 */
DataLoader.getFallbackMovies = function() {
    return [
        {
            id: 'fallback-arcane',
            title: 'Arcane',
            rating: 5,
            description: 'Анимационный сериал по League of Legends. Данные загружаются...',
            image: 'https://images-s.kinorium.com/movie/poster/2754301/w1500_50222111.jpg',
            genres: ['animation', 'fantasy'],
            status: 'watched',
            videoId: 'dQw4w9WgXcQ',
            customColor: '#39ff14'
        }
    ];
};

/**
 * Резервные данные для расписания
 */
DataLoader.getFallbackSchedule = function() {
    return {
        schedule: [
            {
                day: 'Понедельник',
                time: '16:00 - 19:00+',
                game: 'Загрузка расписания...',
                description: 'Данные временно недоступны',
                highlighted: false
            }
        ]
    };
};

/**
 * Резервные данные для статистики
 */
DataLoader.getFallbackStats = function() {
    return {
        followers: 5200,
        streams: 150,
        hours: 250,
        years: 3
    };
};

// ==================== СЛУЖЕБНЫЕ МЕТОДЫ ====================

/**
 * Задержка выполнения
 */
DataLoader.delay = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Получение URL для типа данных
 */
DataLoader.getUrlForDataType = function(dataType) {
    const urls = {
        games: 'data/games.json',
        movies: 'data/movies.json',
        schedule: 'data/schedule.json',
        stats: 'data/stats.json'
    };
    
    return urls[dataType];
};

/**
 * Получение статистики данных
 */
DataLoader.getDataStats = function(data) {
    if (Array.isArray(data)) {
        return `элементов: ${data.length}`;
    } else if (data && typeof data === 'object') {
        if (data.schedule && Array.isArray(data.schedule)) {
            return `дней в расписании: ${data.schedule.length}`;
        }
        return `полей: ${Object.keys(data).length}`;
    }
    return 'неизвестный формат';
};

/**
 * Получение размера данных в KB
 */
DataLoader.getDataSize = function(data) {
    try {
        const jsonString = JSON.stringify(data);
        return Math.round((new Blob([jsonString]).size) / 1024 * 100) / 100;
    } catch {
        return 0;
    }
};

/**
 * Проверка доступности сети
 */
DataLoader.isOnline = function() {
    return navigator.onLine;
};

/**
 * Настройка обработчиков онлайн/офлайн статуса
 */
DataLoader.setupNetworkListeners = function() {
    window.addEventListener('online', () => {
        console.log('🌐 Соединение восстановлено');
        this.clearCache(); // Очищаем кэш при восстановлении связи
    });
    
    window.addEventListener('offline', () => {
        console.warn('📴 Отсутствует интернет-соединение');
    });
};

// ==================== ПАКЕТНАЯ ЗАГРУЗКА ====================

/**
 * Загрузка всех данных одновременно
 */
DataLoader.loadAllData = async function() {
    console.log('📦 Начинаем пакетную загрузку всех данных...');
    
    try {
        const [games, movies, schedule, stats] = await Promise.allSettled([
            this.loadGames(),
            this.loadMovies(),
            this.loadSchedule(),
            this.loadStats()
        ]);
        
        const results = {
            games: games.status === 'fulfilled' ? games.value : this.getFallbackGames(),
            movies: movies.status === 'fulfilled' ? movies.value : this.getFallbackMovies(),
            schedule: schedule.status === 'fulfilled' ? schedule.value : this.getFallbackSchedule(),
            stats: stats.status === 'fulfilled' ? stats.value : this.getFallbackStats(),
            errors: {
                games: games.status === 'rejected' ? games.reason : null,
                movies: movies.status === 'rejected' ? movies.reason : null,
                schedule: schedule.status === 'rejected' ? schedule.reason : null,
                stats: stats.status === 'rejected' ? stats.reason : null
            }
        };
        
        console.log('📦 Пакетная загрузка завершена:', {
            games: results.games.length,
            movies: results.movies.length,
            schedule: results.schedule.schedule?.length || 0,
            hasErrors: Object.values(results.errors).some(error => error !== null)
        });
        
        return results;
        
    } catch (error) {
        console.error('❌ Ошибка пакетной загрузки:', error);
        throw error;
    }
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

/**
 * Инициализация модуля загрузки данных
 */
DataLoader.init = function() {
    this.setupNetworkListeners();
    console.log('✅ Модуль DataLoader инициализирован');
    
    // Предзагрузка данных при инициализации
    if (this.isOnline()) {
        setTimeout(() => {
            this.loadAllData().catch(error => {
                console.warn('⚠️ Предзагрузка данных не удалась:', error.message);
            });
        }, 1000);
    }
};

// ==================== ЭКСПОРТ ====================

// Для использования в качестве модуля
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
} else {
    // Для использования в браузере
    window.DataLoader = DataLoader;
}

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DataLoader.init());
} else {
    DataLoader.init();
}

console.log('📥 Модуль DataLoader загружен');
