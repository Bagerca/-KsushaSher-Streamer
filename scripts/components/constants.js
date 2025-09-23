// Конфигурация статистики
export const STATS_CONFIG = {
    updateInterval: 300000, // 5 минут
    animationDuration: 2000
};

// Конфигурация орбитальной системы
export const ORBITAL_CONFIG = {
    baseSpeed: 0.002,
    radiusRatio: 0.8
};

// Сообщения и тексты
export const MESSAGES = {
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    noData: 'Данные отсутствуют'
};

// Классы CSS
export const CSS_CLASSES = {
    loading: 'loading',
    error: 'error',
    hidden: 'hidden',
    active: 'active'
};

// Селекторы DOM
export const SELECTORS = {
    statsContainer: '#stats-container',
    orbitalContainer: '#orbital-container',
    mainContent: '#main-content'
};
