/* js/api.js */
import { AppConfig } from './config.js';

/**
 * Универсальная функция загрузки JSON с защитой от ошибок
 * @param {string} endpoint - Имя файла (напр. 'schedule.json')
 * @param {any} fallbackData - Данные по умолчанию, если загрузка упала
 */
export async function loadData(endpoint, fallbackData = []) {
    const paths = [
        `${AppConfig.api.dataBaseUrl}${endpoint}`,
        `./data/${endpoint}`,
        `data/${endpoint}`
    ];

    for (const path of paths) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${path}?t=${Date.now()}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.warn(`⚠️ [API] Не удалось загрузить или распарсить ${path}:`, error.message);
        }
    }
    
    console.error(`❌ [API] Все попытки загрузить ${endpoint} провалились. Использую Fallback.`);
    return fallbackData;
}