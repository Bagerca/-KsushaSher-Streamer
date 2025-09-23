// Вспомогательные функции
const Helpers = {
    // Анимация чисел
    animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    // Плавная прокрутка
    smoothScroll(target) {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    // Копирование текста в буфер обмена
    copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    },

    // Получение текста статуса
    getStatusText(status) {
        return CONSTANTS.STATUS_TEXTS[status] || status;
    },

    // Проверка, является ли сегодняшним днем
    isToday(dayName) {
        const today = new Date().getDay();
        const todayName = CONSTANTS.DAYS[today];
        return dayName.toLowerCase() === todayName;
    }
};
