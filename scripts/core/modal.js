// ==================== МОДУЛЬ УПРАВЛЕНИЯ МОДАЛЬНЫМИ ОКНАМИ ====================
// Отвечает за открытие, закрытие и анимацию модальных окон

const ModalManager = {
    // Состояние модальных окон
    state: {
        activeModal: null,
        modals: {},
        history: [],
        isBodyScrollLocked: false
    },

    // Конфигурация
    config: {
        animationDuration: 400,
        backdropOpacity: 0.9,
        maxHistorySize: 10,
        escapeClose: true,
        backdropClose: true
    },

    // DOM элементы
    elements: {}
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

/**
 * Инициализация менеджера модальных окон
 */
ModalManager.init = function() {
    this.initializeElements();
    this.setupEventListeners();
    this.registerModals();
    
    console.log('✅ ModalManager инициализирован');
};

/**
 * Инициализация DOM элементов
 */
ModalManager.initializeElements = function() {
    this.elements = {
        // Основные модальные окна
        gameModal: document.getElementById('gameModal'),
        historyModal: document.getElementById('historyModal'),
        
        // Кнопки закрытия
        closeButtons: document.querySelectorAll('.close-modal, .close-history-modal'),
        
        // Контент модальных окон
        modalGameTitle: document.getElementById('modalGameTitle'),
        modalGameRating: document.getElementById('modalGameRating'),
        modalGameDescription: document.getElementById('modalGameDescription'),
        modalGameVideo: document.getElementById('modalGameVideo'),
        
        // Body для блокировки скролла
        body: document.body
    };
};

/**
 * Регистрация всех модальных окон
 */
ModalManager.registerModals = function() {
    this.state.modals = {
        game: {
            element: this.elements.gameModal,
            type: 'game',
            openAnimation: 'scaleIn',
            closeAnimation: 'scaleOut',
            videoElement: this.elements.modalGameVideo
        },
        history: {
            element: this.elements.historyModal,
            type: 'history',
            openAnimation: 'slideInUp',
            closeAnimation: 'slideOutDown'
        }
    };
};

// ==================== ОСНОВНЫЕ МЕТОДЫ ====================

/**
 * Открытие модального окна
 */
ModalManager.open = function(modalName, contentData = null) {
    const modal = this.state.modals[modalName];
    
    if (!modal) {
        console.error(`❌ Модальное окно "${modalName}" не найдено`);
        return false;
    }
    
    if (this.state.activeModal) {
        this.close(this.state.activeModal);
    }
    
    // Подготовка контента если переданы данные
    if (contentData) {
        this.prepareModalContent(modal, contentData);
    }
    
    // Блокировка скролла body
    this.lockBodyScroll();
    
    // Показ модального окна
    this.showModal(modal);
    
    // Добавление в историю
    this.addToHistory(modalName);
    
    console.log(`📂 Открыто модальное окно: ${modalName}`);
    return true;
};

/**
 * Закрытие модального окна
 */
ModalManager.close = function(modalName = null) {
    const modalToClose = modalName ? this.state.modals[modalName] : this.state.activeModal;
    
    if (!modalToClose) return false;
    
    // Анимация закрытия
    this.hideModal(modalToClose);
    
    // Разблокировка скролла body
    this.unlockBodyScroll();
    
    // Очистка активного модального окна
    this.state.activeModal = null;
    
    console.log(`📂 Закрыто модальное окно: ${modalToClose.type}`);
    return true;
};

/**
 * Закрытие всех модальных окон
 */
ModalManager.closeAll = function() {
    Object.keys(this.state.modals).forEach(modalName => {
        const modal = this.state.modals[modalName];
        if (modal.element.style.display === 'block') {
            this.close(modalName);
        }
    });
};

// ==================== АНИМАЦИИ ====================

/**
 * Показ модального окна с анимацией
 */
ModalManager.showModal = function(modal) {
    const { element, openAnimation } = modal;
    
    // Показываем элемент
    element.style.display = 'block';
    element.style.opacity = '0';
    
    // Даем время для применения display: block
    requestAnimationFrame(() => {
        // Добавляем класс анимации
        element.classList.add('modal-appear');
        
        // Запускаем анимацию
        this.animateModal(element, openAnimation, true);
        
        // Устанавливаем активное модальное окно
        this.state.activeModal = modal;
    });
};

/**
 * Скрытие модального окна с анимацией
 */
ModalManager.hideModal = function(modal) {
    const { element, closeAnimation } = modal;
    
    // Анимация закрытия
    this.animateModal(element, closeAnimation, false);
    
    // Скрываем после анимации
    setTimeout(() => {
        element.style.display = 'none';
        element.classList.remove('modal-appear', 'modal-disappear');
        
        // Очищаем контент если нужно
        this.cleanupModalContent(modal);
        
    }, this.config.animationDuration);
};

/**
 * Универсальная функция анимации
 */
ModalManager.animateModal = function(element, animationType, isOpening) {
    // Удаляем предыдущие классы анимации
    element.classList.remove('modal-appear', 'modal-disappear', 'scale-in', 'scale-out', 'slide-in-up', 'slide-out-down');
    
    // Добавляем соответствующий класс анимации
    if (isOpening) {
        element.classList.add('modal-appear', animationType);
    } else {
        element.classList.add('modal-disappear', animationType);
    }
};

// ==================== УПРАВЛЕНИЕ КОНТЕНТОМ ====================

/**
 * Подготовка контента модального окна
 */
ModalManager.prepareModalContent = function(modal, contentData) {
    switch (modal.type) {
        case 'game':
            this.prepareGameModalContent(contentData);
            break;
        case 'history':
            this.prepareHistoryModalContent(contentData);
            break;
    }
};

/**
 * Подготовка контента для модального окна игры/фильма
 */
ModalManager.prepareGameModalContent = function(gameData) {
    if (!this.elements.modalGameTitle) return;
    
    // Заголовок
    this.elements.modalGameTitle.textContent = gameData.title || 'Название не указано';
    
    // Рейтинг
    if (this.elements.modalGameRating) {
        this.elements.modalGameRating.innerHTML = this.generateStars(gameData.rating) + 
            `<span>${gameData.rating || 0}/5</span>`;
    }
    
    // Описание
    if (this.elements.modalGameDescription) {
        this.elements.modalGameDescription.textContent = gameData.description || 'Описание отсутствует';
    }
    
    // Видео
    if (this.elements.modalGameVideo && gameData.videoId) {
        this.elements.modalGameVideo.src = `https://www.youtube.com/embed/${gameData.videoId}`;
    }
};

/**
 * Подготовка контента для модального окна истории
 */
ModalManager.prepareHistoryModalContent = function(historyData) {
    // Здесь можно добавить логику для динамического контента истории
    console.log('Подготовка контента истории:', historyData);
};

/**
 * Очистка контента модального окна
 */
ModalManager.cleanupModalContent = function(modal) {
    if (modal.type === 'game' && modal.videoElement) {
        // Останавливаем видео
        modal.videoElement.src = '';
    }
};

/**
 * Генерация звезд рейтинга
 */
ModalManager.generateStars = function(rating) {
    if (rating === undefined || rating === null) return '';
    
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
};

// ==================== УПРАВЛЕНИЕ SCROLL ====================

/**
 * Блокировка скролла body
 */
ModalManager.lockBodyScroll = function() {
    if (this.state.isBodyScrollLocked) return;
    
    this.state.isBodyScrollLocked = true;
    this.elements.body.style.overflow = 'hidden';
    this.elements.body.style.paddingRight = this.getScrollbarWidth() + 'px';
};

/**
 * Разблокировка скролла body
 */
ModalManager.unlockBodyScroll = function() {
    if (!this.state.isBodyScrollLocked) return;
    
    this.state.isBodyScrollLocked = false;
    this.elements.body.style.overflow = '';
    this.elements.body.style.paddingRight = '';
};

/**
 * Получение ширины скроллбара
 */
ModalManager.getScrollbarWidth = function() {
    // Создаем временный элемент для измерения
    const scrollDiv = document.createElement('div');
    scrollDiv.style.width = '100px';
    scrollDiv.style.height = '100px';
    scrollDiv.style.overflow = 'scroll';
    scrollDiv.style.position = 'absolute';
    scrollDiv.style.top = '-9999px';
    
    document.body.appendChild(scrollDiv);
    
    // Получаем ширину скроллбара
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    
    document.body.removeChild(scrollDiv);
    
    return scrollbarWidth;
};

// ==================== ИСТОРИЯ МОДАЛЬНЫХ ОКОН ====================

/**
 * Добавление в историю открытых модальных окон
 */
ModalManager.addToHistory = function(modalName) {
    this.state.history.push({
        modal: modalName,
        timestamp: Date.now()
    });
    
    // Ограничиваем размер истории
    if (this.state.history.length > this.config.maxHistorySize) {
        this.state.history.shift();
    }
};

/**
 * Получение истории модальных окон
 */
ModalManager.getHistory = function() {
    return [...this.state.history];
};

/**
 * Очистка истории
 */
ModalManager.clearHistory = function() {
    this.state.history = [];
};

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

/**
 * Настройка обработчиков событий
 */
ModalManager.setupEventListeners = function() {
    // Обработчики закрытия
    this.setupCloseHandlers();
    
    // Глобальные обработчики
    this.setupGlobalHandlers();
    
    // Обработчики для Easter Egg
    this.setupEasterEggHandlers();
};

/**
 * Настройка обработчиков закрытия
 */
ModalManager.setupCloseHandlers = function() {
    // Кнопки закрытия
    this.elements.closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeAll();
        });
    });
    
    // Клик по бэкдропу
    Object.values(this.state.modals).forEach(modal => {
        modal.element.addEventListener('click', (e) => {
            if (this.config.backdropClose && e.target === modal.element) {
                this.close(modal.type);
            }
        });
    });
};

/**
 * Настройка глобальных обработчиков
 */
ModalManager.setupGlobalHandlers = function() {
    // Закрытие по Escape
    if (this.config.escapeClose) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.activeModal) {
                this.closeAll();
            }
        });
    }
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        this.handleWindowResize();
    });
};

/**
 * Обработчик изменения размера окна
 */
ModalManager.handleWindowResize = function() {
    // Центрируем модальные окна при изменении размера
    if (this.state.activeModal) {
        this.centerModal(this.state.activeModal);
    }
};

/**
 * Центрирование модального окна
 */
ModalManager.centerModal = function(modal) {
    const element = modal.element;
    const content = element.querySelector('.modal-content, .history-modal-content');
    
    if (content) {
        content.style.marginTop = '0';
        content.style.transform = 'translateY(0)';
    }
};

/**
 * Настройка обработчиков для Easter Egg
 */
ModalManager.setupEasterEggHandlers = function() {
    // Обработчик для спутниковой системы
    this.setupOrbitalSystemHandlers();
};

/**
 * Обработчики для спутниковой системы (Easter Egg)
 */
ModalManager.setupOrbitalSystemHandlers = function() {
    const orbitalAvatars = document.querySelectorAll('.orbital-avatar');
    
    orbitalAvatars.forEach(avatar => {
        avatar.addEventListener('click', () => {
            this.handleOrbitalAvatarClick(avatar);
        });
    });
};

/**
 * Обработчик клика по орбитальной аватарке
 */
ModalManager.handleOrbitalAvatarClick = function(avatar) {
    const name = avatar.getAttribute('data-name');
    const role = avatar.getAttribute('data-role');
    
    // Можно открыть специальное модальное окно с информацией о человеке
    console.log(`👤 Клик по аватарке: ${name} - ${role}`);
    
    // В будущем можно реализовать специальное модальное окно
    this.showAvatarInfo(name, role);
};

/**
 * Показ информации об аватарке (заглушка для будущей реализации)
 */
ModalManager.showAvatarInfo = function(name, role) {
    // Временное уведомление
    this.showNotification(`👤 ${name} - ${role}`, 2000);
};

// ==================== УВЕДОМЛЕНИЯ ====================

/**
 * Показ временного уведомления
 */
ModalManager.showNotification = function(message, duration = 3000) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'modal-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
        </div>
    `;
    
    // Стилизация
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--neon-green);
        color: var(--dark-bg);
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 300px;
        font-weight: 600;
        box-shadow: 0 5px 15px rgba(57, 255, 20, 0.4);
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
};

// ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

/**
 * Открытие модального окна игры/фильма
 */
ModalManager.openGameModal = function(gameData) {
    return this.open('game', gameData);
};

/**
 * Открытие модального окна истории
 */
ModalManager.openHistoryModal = function() {
    return this.open('history');
};

/**
 * Проверка открыто ли модальное окно
 */
ModalManager.isOpen = function(modalName = null) {
    if (modalName) {
        const modal = this.state.modals[modalName];
        return modal ? modal.element.style.display === 'block' : false;
    }
    return this.state.activeModal !== null;
};

/**
 * Получение текущего активного модального окна
 */
ModalManager.getActiveModal = function() {
    return this.state.activeModal;
};

/**
 * Обновление конфигурации
 */
ModalManager.updateConfig = function(newConfig) {
    this.config = { ...this.config, ...newConfig };
};

// ==================== ДЕСТРУКТОР ====================

/**
 * Очистка ресурсов
 */
ModalManager.destroy = function() {
    this.closeAll();
    this.clearHistory();
    
    // Удаляем обработчики событий
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    console.log('🧹 ModalManager очищен');
};

// ==================== ЭКСПОРТ ====================

// Для использования в качестве модуля
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
} else {
    // Для использования в браузере
    window.ModalManager = ModalManager;
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ModalManager.init());
} else {
    ModalManager.init();
}

console.log('📂 ModalManager загружен');
