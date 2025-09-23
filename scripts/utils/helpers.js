// Утилиты для работы с DOM
export class DOM {
    // Получить элемент по селектору
    static getElement(selector) {
        if (typeof selector === 'string') {
            return document.querySelector(selector);
        }
        return selector;
    }

    // Получить все элементы по селектору
    static getElements(selector) {
        return document.querySelectorAll(selector);
    }

    // Создать элемент с опциями
    static createElement(tag, options = {}) {
        const element = document.createElement(tag);
        Object.assign(element, options);
        return element;
    }

    // Добавить класс
    static addClass(element, className) {
        element.classList.add(className);
    }

    // Удалить класс
    static removeClass(element, className) {
        element.classList.remove(className);
    }

    // Переключить класс
    static toggleClass(element, className) {
        element.classList.toggle(className);
    }

    // Показать элемент
    static show(element) {
        element.style.display = 'block';
    }

    // Скрыть элемент
    static hide(element) {
        element.style.display = 'none';
    }

    // Установить обработчик события
    static on(element, event, handler) {
        element.addEventListener(event, handler);
    }

    // Удалить обработчик события
    static off(element, event, handler) {
        element.removeEventListener(event, handler);
    }

    // Вставить HTML
    static setHTML(element, html) {
        element.innerHTML = html;
    }
}

// Утилиты для работы с API
export class Api {
    // Получить данные JSON
    static async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Сохранить данные
    static async saveData(url, data) {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Save error:', error);
            throw error;
        }
    }
}

// Утилиты для работы со временем
export class Time {
    // Форматировать дату
    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }

    // Форматировать время
    static formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // Форматировать длительность
    static formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
    }
}

// Утилиты для работы с числами
export class NumberUtils {
    // Форматировать число с пробелами
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
}

// Главная утилита для экспорта
export default { DOM, Api, Time, NumberUtils };
