/* js/event-bus.js */

/**
 * Глобальная шина событий (Event Bus).
 * Обеспечивает слабую связанность компонентов через паттерн Pub/Sub.
 */
class EventBus {
    constructor() {
        this.listeners = {};
        console.log('📡 [EventBus] Инициализирован');
    }

    /**
     * Подписаться на событие
     * @param {string} event - Название события
     * @param {function} callback - Функция-обработчик
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Отписаться от события
     * @param {string} event - Название события
     * @param {function} callback - Функция-обработчик
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Вызвать событие и передать данные всем подписчикам
     * @param {string} event - Название события
     * @param {any} payload - Данные для передачи
     */
    emit(event, payload = null) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(payload);
            } catch (error) {
                console.error(`🚨 [EventBus] Ошибка в обработчике события "${event}":`, error);
            }
        });
    }
}

// Экспортируем как Singleton (единый экземпляр для всего приложения)
export default new EventBus();