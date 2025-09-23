// ==================== МОДУЛЬ УПРАВЛЕНИЯ РАСПИСАНИЕМ ====================
// Отвечает за отображение и управление расписанием стримов

const ScheduleManager = {
    // Состояние расписания
    state: {
        schedule: [],
        currentDayIndex: -1,
        lastUpdate: null,
        isLoading: false
    },

    // Конфигурация
    config: {
        updateInterval: 5 * 60 * 1000, // 5 минут
        daysOrder: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
        currentTimeZone: 'Europe/Moscow',
        highlightCurrentDay: true
    },

    // DOM элементы
    elements: {},

    // Кэш
    cache: {
    }
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

/**
 * Инициализация менеджера расписания
 */
ScheduleManager.init = function() {
    this.initializeElements();
    this.setupEventListeners();
    this.loadSchedule();
    this.startAutoUpdate();
    
    console.log('✅ ScheduleManager инициализирован');
};

/**
 * Инициализация DOM элементов
 */
ScheduleManager.initializeElements = function() {
    this.elements = {
        scheduleList: document.getElementById('schedule-list'),
        scheduleSection: document.getElementById('schedule'),
        currentDayIndicator: document.querySelector('.current-day-indicator')
    };
};

// ==================== ЗАГРУЗКА ДАННЫХ ====================

/**
 * Загрузка расписания
 */
ScheduleManager.loadSchedule = async function() {
    if (this.state.isLoading) return;
    
    this.state.isLoading = true;
    
    try {
        console.log('📅 Загрузка расписания...');
        
        // Пробуем загрузить из DataLoader если доступен
        if (window.DataLoader) {
            const scheduleData = await DataLoader.loadSchedule();
            this.processScheduleData(scheduleData);
        } else {
            // Резервная загрузка
            await this.loadScheduleFallback();
        }
        
        this.state.lastUpdate = new Date();
        this.state.isLoading = false;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки расписания:', error);
        this.showErrorState();
        this.state.isLoading = false;
    }
};

/**
 * Обработка данных расписания
 */
ScheduleManager.processScheduleData = function(scheduleData) {
    if (!scheduleData || !scheduleData.schedule) {
        throw new Error('Некорректный формат данных расписания');
    }
    
    // Сортируем дни согласно порядку в конфиге
    const sortedSchedule = this.sortScheduleByDays(scheduleData.schedule);
    
    this.state.schedule = sortedSchedule;
    this.state.currentDayIndex = this.getCurrentDayIndex();
    
    this.renderSchedule();
    this.highlightCurrentDay();
    
    console.log(`📅 Расписание загружено: ${sortedSchedule.length} дней`);
};

/**
 * Сортировка расписания по дням недели
 */
ScheduleManager.sortScheduleByDays = function(schedule) {
    return schedule.sort((a, b) => {
        const indexA = this.config.daysOrder.indexOf(a.day);
        const indexB = this.config.daysOrder.indexOf(b.day);
        
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
    });
};

/**
 * Резервная загрузка расписания
 */
ScheduleManager.loadScheduleFallback = async function() {
    try {
        const response = await fetch('data/schedule.json?' + new Date().getTime());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const scheduleData = await response.json();
        this.processScheduleData(scheduleData);
        
    } catch (error) {
        // Используем демо-расписание
        this.useDemoSchedule();
    }
};

/**
 * Демо-расписание при отсутствии данных
 */
ScheduleManager.useDemoSchedule = function() {
    console.warn('🔄 Используем демо-расписание');
    
    const demoSchedule = {
        schedule: [
            {
                day: 'Понедельник',
                time: '16:00 - 19:00+',
                game: 'Mouthwashing',
                description: 'Расслабляющий симулятор мойки под давлением',
                highlighted: false
            },
            {
                day: 'Вторник',
                time: '16:00 - 19:00+',
                game: 'Portal 2',
                description: 'Культовая головоломка от Valve',
                highlighted: false
            },
            {
                day: 'Среда',
                time: '16:00 - 19:00+', 
                game: 'Чикатило',
                description: 'Лабубу',
                highlighted: true
            },
            {
                day: 'Четверг',
                time: '16:00 - 19:00+',
                game: 'Тест 5',
                description: 'RPG в открытом мире',
                highlighted: false
            },
            {
                day: 'Пятница',
                time: '16:00 - 19:00+',
                game: 'Свободный стрим',
                description: 'Выбор игры по желанию комьюнити',
                highlighted: true
            }
        ]
    };
    
    this.processScheduleData(demoSchedule);
};

// ==================== ОТОБРАЖЕНИЕ РАСПИСАНИЯ ====================

/**
 * Отрисовка расписания
 */
ScheduleManager.renderSchedule = function() {
    if (!this.elements.scheduleList) return;
    
    if (this.state.schedule.length === 0) {
        this.showEmptyState();
        return;
    }
    
    const scheduleHTML = this.state.schedule.map((day, index) => 
        this.createScheduleItemHTML(day, index)
    ).join('');
    
    this.elements.scheduleList.innerHTML = scheduleHTML;
    
    // Добавляем обработчики событий
    this.attachScheduleEventHandlers();
};

/**
 * Создание HTML для элемента расписания
 */
ScheduleManager.createScheduleItemHTML = function(day, index) {
    const isCurrentDay = index === this.state.currentDayIndex;
    const isHighlighted = day.highlighted || false;
    const isWeekend = this.isWeekend(day.day);
    
    const classes = [
        'schedule-item',
        isCurrentDay ? 'current-day' : '',
        isHighlighted ? 'highlighted' : '',
        isWeekend ? 'weekend' : ''
    ].filter(Boolean).join(' ');
    
    return `
        <div class="${classes}" data-day-index="${index}">
            <div class="schedule-day-wrapper">
                <div class="schedule-day">
                    ${day.day}
                    ${isCurrentDay ? '<span class="live-indicator">🔴 LIVE</span>' : ''}
                </div>
                <div class="schedule-time">${day.time}</div>
            </div>
            <div class="schedule-content">
                <div class="schedule-game">${day.game}</div>
                <div class="schedule-desc">${day.description || 'Описание отсутствует'}</div>
            </div>
            <div class="schedule-status ${isCurrentDay ? 'active' : ''}">
                ${this.getStatusIcon(day, isCurrentDay)}
            </div>
            ${this.createScheduleBadges(day)}
        </div>
    `;
};

/**
 * Создание бейджей для элемента расписания
 */
ScheduleManager.createScheduleBadges = function(day) {
    const badges = [];
    
    if (day.highlighted) {
        badges.push('<span class="schedule-badge highlight">✨ Особый день</span>');
    }
    
    if (this.isUpcomingStream(day)) {
        badges.push('<span class="schedule-badge upcoming">🕓 Скоро</span>');
    }
    
    if (badges.length > 0) {
        return `<div class="schedule-badges">${badges.join('')}</div>`;
    }
    
    return '';
};

/**
 * Получение иконки статуса
 */
ScheduleManager.getStatusIcon = function(day, isCurrentDay) {
    if (isCurrentDay) {
        return '<i class="fas fa-broadcast-tower"></i>';
    }
    
    if (this.isStreamLive(day)) {
        return '<i class="fas fa-circle live-pulse"></i>';
    }
    
    return '<i class="far fa-clock"></i>';
};

// ==================== ЛОГИКА ОПРЕДЕЛЕНИЯ ДНЕЙ ====================

/**
 * Получение индекса текущего дня
 */
ScheduleManager.getCurrentDayIndex = function() {
    const today = new Date();
    const currentDayName = this.getCurrentDayName();
    
    return this.state.schedule.findIndex(day => 
        day.day.toLowerCase() === currentDayName.toLowerCase()
    );
};

/**
 * Получение названия текущего дня недели
 */
ScheduleManager.getCurrentDayName = function() {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const today = new Date().getDay();
    return days[today];
};

/**
 * Проверка является ли день выходным
 */
ScheduleManager.isWeekend = function(dayName) {
    const weekendDays = ['Суббота', 'Воскресенье'];
    return weekendDays.includes(dayName);
};

/**
 * Проверка идет ли сейчас стрим
 */
ScheduleManager.isStreamLive = function(day) {
    if (!this.isCurrentDay(day.day)) return false;
    
    const streamTime = this.parseStreamTime(day.time);
    if (!streamTime) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return currentTime >= streamTime.start && currentTime <= streamTime.end;
};

/**
 * Проверка является ли стрим предстоящим
 */
ScheduleManager.isUpcomingStream = function(day) {
    if (!this.isCurrentDay(day.day)) return false;
    
    const streamTime = this.parseStreamTime(day.time);
    if (!streamTime) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return currentTime < streamTime.start;
};

/**
 * Проверка является ли день текущим
 */
ScheduleManager.isCurrentDay = function(dayName) {
    return dayName.toLowerCase() === this.getCurrentDayName().toLowerCase();
};

/**
 * Парсинг времени стрима
 */
ScheduleManager.parseStreamTime = function(timeString) {
    // Формат: "16:00 - 19:00+"
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    
    if (!match) return null;
    
    const startHours = parseInt(match[1]);
    const startMinutes = parseInt(match[2]);
    const endHours = parseInt(match[3]);
    const endMinutes = parseInt(match[4]);
    
    return {
        start: startHours * 60 + startMinutes,
        end: endHours * 60 + endMinutes,
        duration: (endHours - startHours) * 60 + (endMinutes - startMinutes)
    };
};

// ==================== ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ====================

/**
 * Подсветка текущего дня
 */
ScheduleManager.highlightCurrentDay = function() {
    if (!this.config.highlightCurrentDay) return;
    
    const currentItems = document.querySelectorAll('.schedule-item.current-day');
    
    currentItems.forEach(item => {
        item.classList.add('pulse-glow');
        
        // Добавляем анимацию пульсации для статуса
        const statusElement = item.querySelector('.schedule-status');
        if (statusElement) {
            statusElement.classList.add('status-pulse');
        }
    });
};

/**
 * Показ состояния загрузки
 */
ScheduleManager.showLoadingState = function() {
    if (!this.elements.scheduleList) return;
    
    this.elements.scheduleList.innerHTML = `
        <div class="schedule-loading">
            <div class="loading-spinner"></div>
            <p>Загрузка расписания...</p>
        </div>
    `;
};

/**
 * Показ состояния ошибки
 */
ScheduleManager.showErrorState = function() {
    if (!this.elements.scheduleList) return;
    
    this.elements.scheduleList.innerHTML = `
        <div class="schedule-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки расписания</p>
            <button class="retry-button">Повторить попытку</button>
        </div>
    `;
    
    // Добавляем обработчик для кнопки повтора
    const retryButton = this.elements.scheduleList.querySelector('.retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', () => this.loadSchedule());
    }
};

/**
 * Показ пустого состояния
 */
ScheduleManager.showEmptyState = function() {
    if (!this.elements.scheduleList) return;
    
    this.elements.scheduleList.innerHTML = `
        <div class="schedule-empty">
            <i class="fas fa-calendar-plus"></i>
            <p>Расписание пока не составлено</p>
            <small>Следите за обновлениями в Telegram канале</small>
        </div>
    `;
};

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

/**
 * Настройка обработчиков событий
 */
ScheduleManager.setupEventListeners = function() {
    this.setupScheduleInteractions();
    this.setupAutoUpdate();
};

/**
 * Настройка взаимодействий с расписанием
 */
ScheduleManager.setupScheduleInteractions = function() {
    // Обработчики будут добавлены после рендера
};

/**
 * Добавление обработчиков событий для элементов расписания
 */
ScheduleManager.attachScheduleEventHandlers = function() {
    const scheduleItems = document.querySelectorAll('.schedule-item');
    
    scheduleItems.forEach(item => {
        // Клик по элементу расписания
        item.addEventListener('click', () => {
            this.handleScheduleItemClick(item);
        });
        
        // Наведение на элемент
        item.addEventListener('mouseenter', () => {
            this.handleScheduleItemHover(item, true);
        });
        
        item.addEventListener('mouseleave', () => {
            this.handleScheduleItemHover(item, false);
        });
    });
};

/**
 * Обработчик клика по элементу расписания
 */
ScheduleManager.handleScheduleItemClick = function(item) {
    const dayIndex = parseInt(item.getAttribute('data-day-index'));
    const dayData = this.state.schedule[dayIndex];
    
    if (!dayData) return;
    
    // Анимация клика
    item.classList.add('click-feedback');
    setTimeout(() => {
        item.classList.remove('click-feedback');
    }, 300);
    
    // Можно открыть детальную информацию о стриме
    this.showStreamDetails(dayData);
};

/**
 * Обработчик наведения на элемент расписания
 */
ScheduleManager.handleScheduleItemHover = function(item, isHovering) {
    if (isHovering) {
        item.classList.add('hover-effect');
    } else {
        item.classList.remove('hover-effect');
    }
};

/**
 * Показ детальной информации о стриме
 */
ScheduleManager.showStreamDetails = function(dayData) {
    // В будущем можно реализовать модальное окно с деталями
    console.log('📺 Детали стрима:', dayData);
    
    // Временное уведомление
    this.showStreamNotification(dayData);
};

/**
 * Показ уведомления о стриме
 */
ScheduleManager.showStreamNotification = function(dayData) {
    const notification = document.createElement('div');
    notification.className = 'stream-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h4>${dayData.game}</h4>
            <p>${dayData.day} ${dayData.time}</p>
            <p>${dayData.description || ''}</p>
        </div>
    `;
    
    // Стилизация и анимация уведомления
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--neon-green);
        color: var(--dark-bg);
        padding: 15px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 300px;
        animation: slideInUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.remove();
    }, 3000);
};

// ==================== АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ====================

/**
 * Запуск автоматического обновления
 */
ScheduleManager.startAutoUpdate = function() {
    setInterval(() => {
        this.checkForUpdates();
    }, this.config.updateInterval);
};

/**
 * Проверка обновлений
 */
ScheduleManager.checkForUpdates = function() {
    if (document.visibilityState !== 'visible') return;
    
    console.log('🔄 Проверка обновлений расписания...');
    this.loadSchedule();
};

/**
 * Настройка автообновления при изменении видимости страницы
 */
ScheduleManager.setupAutoUpdate = function() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // При возвращении на страницу проверяем обновления
            this.checkForUpdates();
        }
    });
};

// ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

/**
 * Получение текущего расписания
 */
ScheduleManager.getSchedule = function() {
    return [...this.state.schedule];
};

/**
 * Получение расписания на конкретный день
 */
ScheduleManager.getDaySchedule = function(dayName) {
    return this.state.schedule.find(day => 
        day.day.toLowerCase() === dayName.toLowerCase()
    );
};

/**
 * Получение текущего стрима
 */
ScheduleManager.getCurrentStream = function() {
    if (this.state.currentDayIndex === -1) return null;
    
    const currentDay = this.state.schedule[this.state.currentDayIndex];
    if (!currentDay) return null;
    
    return this.isStreamLive(currentDay) ? currentDay : null;
};

/**
 * Получение следующего стрима
 */
ScheduleManager.getNextStream = function() {
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 - воскресенье, 1 - понедельник и т.д.
    
    // Ищем следующий стрим начиная с сегодняшнего дня
    for (let i = 0; i < this.state.schedule.length; i++) {
        const day = this.state.schedule[i];
        const dayIndex = this.config.daysOrder.indexOf(day.day);
        
        if (dayIndex >= currentDayIndex) {
            return day;
        }
    }
    
    // Если не нашли, возвращаем первый день следующей недели
    return this.state.schedule[0] || null;
};

/**
 * Обновление конфигурации
 */
ScheduleManager.updateConfig = function(newConfig) {
    this.config = { ...this.config, ...newConfig };
};

/**
 * Принудительное обновление расписания
 */
ScheduleManager.refresh = function() {
    this.loadSchedule();
};

// ==================== УТИЛИТЫ ====================

/**
 * Форматирование времени
 */
ScheduleManager.formatTime = function(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Получение времени до следующего стрима
 */
ScheduleManager.getTimeUntilNextStream = function() {
    const nextStream = this.getNextStream();
    if (!nextStream) return null;
    
    const streamTime = this.parseStreamTime(nextStream.time);
    if (!streamTime) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Если стрим сегодня и еще не начался
    if (this.isCurrentDay(nextStream.day) && currentTime < streamTime.start) {
        return streamTime.start - currentTime;
    }
    
    // Если стрим в другой день, вычисляем разницу в минутах до начала дня стрима
    const daysUntilStream = this.getDaysUntil(nextStream.day);
    return (daysUntilStream * 24 * 60) + streamTime.start - currentTime;
};

/**
 * Получение количества дней до указанного дня недели
 */
ScheduleManager.getDaysUntil = function(dayName) {
    const targetDayIndex = this.config.daysOrder.indexOf(dayName);
    const currentDayIndex = new Date().getDay();
    
    if (targetDayIndex === -1) return 0;
    
    let daysUntil = targetDayIndex - currentDayIndex;
    if (daysUntil <= 0) {
        daysUntil += 7;
    }
    
    return daysUntil;
};

// ==================== ЭКСПОРТ ====================

// Для использования в качестве модуля
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScheduleManager;
} else {
    // Для использования в браузере
    window.ScheduleManager = ScheduleManager;
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ScheduleManager.init());
} else {
    ScheduleManager.init();
}

console.log('📅 ScheduleManager загружен');
