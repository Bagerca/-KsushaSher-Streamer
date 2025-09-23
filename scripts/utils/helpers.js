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
        
        // Обрабатываем class и className
        if (options.class) {
            element.className = options.class;
            delete options.class;
        }
        if (options.className) {
            element.className = options.className;
            delete options.className;
        }
        
        // Обрабатываем остальные свойства
        Object.assign(element, options);
        return element;
    }

    // Добавить класс
    static addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    }

    // Удалить класс
    static removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    }

    // Переключить класс
    static toggleClass(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    }

    // Показать элемент
    static show(element) {
        if (element) {
            element.style.display = 'block';
        }
    }

    // Скрыть элемент
    static hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    // Установить обработчик события
    static on(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    // Удалить обработчик события
    static off(element, event, handler) {
        if (element) {
            element.removeEventListener(event, handler);
        }
    }

    // Вставить HTML
    static setHTML(element, html) {
        if (element) {
            element.innerHTML = html;
        }
    }

    // Получить данные атрибута
    static getData(element, key) {
        return element ? element.dataset[key] : null;
    }

    // Установить данные атрибута
    static setData(element, key, value) {
        if (element) {
            element.dataset[key] = value;
        }
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
}

// Утилиты для работы со временем
export class Time {
    // Форматировать дату
    static formatDate(dateString) {
        if (!dateString) return 'Не указано';
        try {
            return new Date(dateString).toLocaleDateString('ru-RU');
        } catch {
            return 'Неверная дата';
        }
    }

    // Форматировать время
    static formatTime(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch {
            return '';
        }
    }

    // Форматировать длительность
    static formatDuration(minutes) {
        if (!minutes) return '0м';
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
        if (!num && num !== 0) return '0';
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
}

// Главная утилита для экспорта
export default {
    DOM,
    Api,
    Time,
    NumberUtils,
    Storage
};
