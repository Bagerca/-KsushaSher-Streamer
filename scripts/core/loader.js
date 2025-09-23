// Загрузчик данных
const Loader = {
    // Загрузка JSON данных
    async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Ошибка загрузки ${url}:`, error);
            return null;
        }
    },

    // Загрузка расписания
    async loadSchedule() {
        const data = await this.loadJSON(CONSTANTS.API.SCHEDULE);
        return data ? data.schedule : [];
    },

    // Загрузка игр
    async loadGames() {
        return await this.loadJSON(CONSTANTS.API.GAMES) || [];
    },

    // Загрузка статистики
    async loadStats() {
        return await this.loadJSON(CONSTANTS.API.STATS) || {};
    }
};
