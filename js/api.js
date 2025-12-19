/* js/api.js */

const DATA_BASE_URL = './data/';

/**
 * Универсальная функция загрузки JSON
 * @param {string} endpoint - Имя файла (напр. 'schedule.json')
 * @param {any} fallbackData - Данные по умолчанию, если загрузка упала
 */
export async function loadData(endpoint, fallbackData = []) {
    const paths = [
        `${DATA_BASE_URL}${endpoint}`,
        `./data/${endpoint}`,
        `data/${endpoint}`
    ];

    for (const path of paths) {
        try {
            const response = await fetch(`${path}?t=${Date.now()}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`⚠️ Не удалось загрузить ${path}:`, error);
        }
    }
    return fallbackData;
}