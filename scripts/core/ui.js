import { DOM } from '../utils/helpers.js';
import { CSS_CLASSES } from '../utils/constants.js';

export class UIManager {
    static init() {
        this.setupGlobalEventListeners();
        this.setupResizeHandler();
        console.log('🎨 UI Manager initialized');
    }

    static setupGlobalEventListeners() {
        // Закрытие модальных окон по клику вне области
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Закрытие модальных окон по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Обработка всех кнопок закрытия
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn') || 
                e.target.closest('.close-btn')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            }
        });
    }

    static setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    static handleResize() {
        // Уведомляем все компоненты о изменении размера
        if (window.orbitalSystem) {
            window.orbitalSystem.onResize();
        }

        // Обновляем адаптивную верстку
        this.updateResponsiveClasses();
    }

    static updateResponsiveClasses() {
        const width = window.innerWidth;
        const body = document.body;

        // Удаляем старые классы
        DOM.removeClass(body, 'mobile-view');
        DOM.removeClass(body, 'tablet-view');
        DOM.removeClass(body, 'desktop-view');

        // Добавляем новые классы
        if (width < 768) {
            DOM.addClass(body, 'mobile-view');
        } else if (width < 1024) {
            DOM.addClass(body, 'tablet-view');
        } else {
            DOM.addClass(body, 'desktop-view');
        }
    }

    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            DOM.addClass(modal, 'active');
            DOM.addClass(document.body, 'modal-open');
        }
    }

    static closeModal(modal) {
        if (modal) {
            DOM.removeClass(modal, 'active');
            DOM.removeClass(document.body, 'modal-open');
        }
    }

    static closeAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            DOM.removeClass(modal, 'active');
        });
        DOM.removeClass(document.body, 'modal-open');
    }

    static showNotification(message, type = 'info', duration = 3000) {
        const notification = DOM.createElement('div', {
            className: `notification notification-${type}`,
            innerHTML: `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close">×</button>
                </div>
            `
        });

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => DOM.addClass(notification, 'show'), 100);

        // Закрытие по кнопке
        const closeBtn = notification.querySelector('.notification-close');
        DOM.on(closeBtn, 'click', () => this.hideNotification(notification));

        // Автоматическое закрытие
        if (duration > 0) {
            setTimeout(() => this.hideNotification(notification), duration);
        }

        return notification;
    }

    static hideNotification(notification) {
        if (notification) {
            DOM.removeClass(notification, 'show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    static toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        return isDark;
    }

    static initDarkMode() {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            DOM.addClass(document.body, 'dark-mode');
        }
    }

    static showTab(tabId) {
        // Скрываем все табы
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => DOM.removeClass(tab, 'active'));

        // Деактивируем все кнопки табов
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => DOM.removeClass(btn, 'active'));

        // Показываем выбранный таб
        const activeTab = document.getElementById(tabId);
        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);

        if (activeTab) DOM.addClass(activeTab, 'active');
        if (activeButton) DOM.addClass(activeButton, 'active');
    }
}
