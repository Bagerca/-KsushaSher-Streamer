// Конфигурация приложения
export const APP_CONFIG = {
    version: '1.0.0',
    name: 'KsushaSher Streamer',
    author: 'Bagerca',
    defaultLanguage: 'ru'
};

// Конфигурация статистики
export const STATS_CONFIG = {
    updateInterval: 300000, // 5 минут
    animationDuration: 2000,
    maxHistoryDays: 30
};

// Конфигурация орбитальной системы
export const ORBITAL_CONFIG = {
    baseSpeed: 0.002,
    radiusRatio: 0.8,
    maxSatellites: 10,
    animationFps: 60
};

// Конфигурация игр и фильмов
export const GAMES_CONFIG = {
    itemsPerPage: 12,
    maxTitleLength: 50,
    maxDescriptionLength: 200,
    supportedPlatforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'],
    supportedGenres: {
        games: ['RPG', 'Action', 'Adventure', 'Strategy', 'Shooter', 'Sports', 'Simulation'],
        movies: ['Fantasy', 'Sci-Fi', 'Action', 'Comedy', 'Drama', 'Horror', 'Thriller']
    },
    ratingRange: {
        min: 0,
        max: 10
    }
};

// Конфигурация расписания
export const SCHEDULE_CONFIG = {
    daysOfWeek: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
    timeSlots: [
        '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', 
        '18:00-20:00', '20:00-22:00', '22:00-00:00'
    ],
    statuses: {
        planned: 'planned',
        confirmed: 'confirmed',
        cancelled: 'cancelled',
        live: 'live',
        completed: 'completed'
    }
};

// Сообщения и тексты
export const MESSAGES = {
    loading: 'Загрузка...',
    saving: 'Сохранение...',
    error: 'Произошла ошибка',
    success: 'Успешно выполнено',
    noData: 'Данные отсутствуют',
    confirm: 'Вы уверены?'
};

// Классы CSS
export const CSS_CLASSES = {
    loading: 'loading',
    error: 'error',
    success: 'success',
    hidden: 'hidden',
    visible: 'visible',
    active: 'active',
    disabled: 'disabled'
};

// Селекторы DOM
export const SELECTORS = {
    mainContainer: '#main-container',
    statsContainer: '#stats-container',
    orbitalContainer: '#orbital-container',
    gamesContainer: '#games-container',
    scheduleContainer: '#schedule-container'
};
