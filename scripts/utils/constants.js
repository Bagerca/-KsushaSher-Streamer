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

// Конфигурация UI
export const UI_CONFIG = {
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
    },
    animationDurations: {
        fast: 200,
        normal: 300,
        slow: 500
    },
    zIndex: {
        modal: 1000,
        dropdown: 900,
        tooltip: 800,
        header: 700
    }
};

// Сообщения и тексты
export const MESSAGES = {
    // Общие сообщения
    loading: 'Загрузка...',
    saving: 'Сохранение...',
    error: 'Произошла ошибка',
    success: 'Успешно выполнено',
    noData: 'Данные отсутствуют',
    confirm: 'Вы уверены?',
    
    // Сообщения для игр/фильмов
    games: {
        addSuccess: 'Игра успешно добавлена',
        addError: 'Ошибка при добавлении игры',
        deleteSuccess: 'Игра удалена',
        deleteError: 'Ошибка при удалении игры',
        searchPlaceholder: 'Поиск игр...',
        noGames: 'Игры не найдены'
    },
    
    movies: {
        addSuccess: 'Фильм успешно добавлен',
        addError: 'Ошибка при добавлении фильма', 
        deleteSuccess: 'Фильм удален',
        deleteError: 'Ошибка при удалении фильма',
        searchPlaceholder: 'Поиск фильмов...',
        noMovies: 'Фильмы не найдены'
    },
    
    // Сообщения для статистики
    stats: {
        followers: 'Подписчики',
        subscribers: 'Сабскрайберы',
        views: 'Просмотры',
        visits: 'Посещения сайта',
        lastStream: 'Последний стрим'
    },
    
    // Сообщения для расписания
    schedule: {
        addSuccess: 'Стрим добавлен в расписание',
        addError: 'Ошибка при добавлении стрима',
        deleteSuccess: 'Стрим удален из расписания',
        deleteError: 'Ошибка при удалении стрима',
        noSchedule: 'Расписание пустое'
    }
};

// Классы CSS
export const CSS_CLASSES = {
    // Состояния
    loading: 'loading',
    error: 'error',
    success: 'success',
    hidden: 'hidden',
    visible: 'visible',
    active: 'active',
    disabled: 'disabled',
    
    // Компоненты
    modal: 'modal',
    modalOpen: 'modal-open',
    modalClose: 'modal-close',
    button: 'btn',
    buttonPrimary: 'btn-primary',
    buttonSecondary: 'btn-secondary',
    buttonDanger: 'btn-danger',
    
    // Анимации
    fadeIn: 'fade-in',
    fadeOut: 'fade-out',
    slideIn: 'slide-in',
    slideOut: 'slide-out',
    
    // Grid
    grid: 'grid',
    gridItem: 'grid-item',
    gridCols1: 'grid-cols-1',
    gridCols2: 'grid-cols-2',
    gridCols3: 'grid-cols-3',
    gridCols4: 'grid-cols-4'
};

// Селекторы DOM
export const SELECTORS = {
    // Основные контейнеры
    mainContainer: '#main-container',
    statsContainer: '#stats-container',
    orbitalContainer: '#orbital-container',
    gamesContainer: '#games-container',
    scheduleContainer: '#schedule-container',
    
    // Элементы UI
    modal: '.modal',
    modalContent: '.modal-content',
    modalClose: '.modal-close',
    button: '.btn',
    input: 'input, select, textarea',
    
    // Компоненты
    statItem: '.stat-item',
    satellite: '.satellite',
    gameCard: '.game-card',
    movieCard: '.movie-card',
    scheduleItem: '.schedule-item'
};

// Коды ошибок
export const ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    SERVER_ERROR: 'SERVER_ERROR'
};

// Цветовая схема
export const COLORS = {
    primary: '#6c5ce7',
    secondary: '#a29bfe',
    success: '#00b894',
    warning: '#fdcb6e',
    error: '#d63031',
    info: '#0984e3',
    
    // Градиенты
    gradientPrimary: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
    gradientSuccess: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
    gradientWarning: 'linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)',
    
    // Текст
    textPrimary: '#2d3436',
    textSecondary: '#636e72',
    textLight: '#ffffff',
    
    // Фон
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f6fa',
    bgDark: '#2d3436'
};

// Локализация
export const LOCALE = {
    ru: {
        days: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
        months: [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ],
        timeFormat: '24h'
    },
    en: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ],
        timeFormat: '12h'
    }
};

// API endpoints
export const API_ENDPOINTS = {
    games: '/api/games',
    movies: '/api/movies',
    stats: '/api/stats',
    schedule: '/api/schedule',
    users: '/api/users'
};

// Настройки валидации
export const VALIDATION_RULES = {
    title: {
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Zа-яА-Я0-9\s\-_!?()]+$/i
    },
    description: {
        minLength: 10,
        maxLength: 1000
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    url: {
        pattern: /^https?:\/\/.+\..+$/
    }
};

// Экспорт по умолчанию для удобства
export default {
    APP_CONFIG,
    STATS_CONFIG,
    ORBITAL_CONFIG,
    GAMES_CONFIG,
    SCHEDULE_CONFIG,
    UI_CONFIG,
    MESSAGES,
    CSS_CLASSES,
    SELECTORS,
    ERROR_CODES,
    COLORS,
    LOCALE,
    API_ENDPOINTS,
    VALIDATION_RULES
};
