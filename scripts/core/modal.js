import { DOM } from '../utils/helpers.js';
import { CSS_CLASSES } from '../utils/constants.js';

export class ModalManager {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Закрытие по клику вне модального окна
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.close();
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.close();
            }
        });

        // Обработка кнопок закрытия
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || 
                e.target.closest('.modal-close')) {
                this.close();
            }
        });
    }

    open(modalId, options = {}) {
        // Закрываем предыдущее модальное окно
        if (this.currentModal) {
            this.close();
        }

        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with id '${modalId}' not found`);
            return;
        }

        this.currentModal = modal;
        
        // Применяем опции
        if (options.onOpen) {
            options.onOpen();
        }

        // Показываем модальное окно
        DOM.addClass(modal, 'active');
        DOM.addClass(document.body, 'modal-open');

        // Фокус на первом интерактивном элементе
        setTimeout(() => {
            const focusElement = modal.querySelector('[autofocus]') || 
                               modal.querySelector('input, button, textarea');
            if (focusElement) {
                focusElement.focus();
            }
        }, 100);
    }

    close() {
        if (!this.currentModal) return;

        DOM.removeClass(this.currentModal, 'active');
        DOM.removeClass(document.body, 'modal-open');
        
        this.currentModal = null;
    }

    // Быстрое создание модального окна
    create(options) {
        const {
            title,
            content,
            buttons = [],
            onClose = null
        } = options;

        const modalId = 'modal-' + Date.now();
        const modalHTML = `
            <div id="${modalId}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}" 
                                    onclick="${btn.onClick}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Открываем его
        this.open(modalId, { onClose });

        return modalId;
    }

    // Уведомление
    alert(message, title = 'Уведомление') {
        return this.create({
            title,
            content: `<p>${message}</p>`,
            buttons: [{
                text: 'OK',
                primary: true,
                onClick: 'window.modalManager.close()'
            }]
        });
    }

    // Подтверждение
    confirm(message, title = 'Подтверждение') {
        return new Promise((resolve) => {
            const modalId = this.create({
                title,
                content: `<p>${message}</p>`,
                buttons: [
                    {
                        text: 'Отмена',
                        primary: false,
                        onClick: `window.modalManager.close(); resolve(false);`
                    },
                    {
                        text: 'OK',
                        primary: true,
                        onClick: `window.modalManager.close(); resolve(true);`
                    }
                ]
            });

            // Сохраняем ссылку на resolve для использования в обработчиках
            window[`resolve_${modalId}`] = resolve;
        });
    }
}

// Создаем глобальный экземпляр
window.modalManager = new ModalManager();
