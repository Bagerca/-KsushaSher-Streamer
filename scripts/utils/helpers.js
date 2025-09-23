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

    // Получить данные атрибута
    static getData(element, key) {
        return element.dataset[key];
    }

    // Установить данные атрибута
    static setData(element, key, value) {
        element.dataset[key] = value;
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

    // Отправить POST запрос
    static async postData(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('POST error:', error);
            throw error;
        }
    }

    // Проверить статус соединения
    static async checkConnection() {
        try {
            const response = await fetch('/api/health', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Утилиты для работы со временем
export class Time {
    // Форматировать дату
    static formatDate(date, options = {}) {
        const defaultOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(date).toLocaleDateString('ru-RU', { ...defaultOptions, ...options });
    }

    // Форматировать время
    static formatTime(date) {
        return new Date(date).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // Получить разницу во времени
    static getTimeDiff(start, end) {
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return { hours, minutes };
    }

    // Форматировать длительность
    static formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
    }

    // Создать задержку
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Утилиты для работы с числами
export class NumberUtils {
    // Форматировать число с пробелами
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Ограничить число в диапазоне
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Случайное число в диапазоне
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Интерполяция
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
}

// Утилиты для работы с localStorage
export class Storage {
    // Получить данные
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    // Сохранить данные
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    // Удалить данные
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }

    // Очистить все данные
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch {
            return false;
        }
    }
}

// Утилиты для валидации
export class Validator {
    // Проверить email
    static isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Проверить URL
    static isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Проверить пустую строку
    static isEmpty(str) {
        return !str || str.trim().length === 0;
    }

    // Проверить число
    static isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
}

// Главная утилита для экспорта всех классов
export default {
    DOM,
    Api,
    Time,
    NumberUtils,
    Storage,
    Validator
};
