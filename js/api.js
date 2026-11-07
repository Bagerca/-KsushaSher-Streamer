/* js/api.js */
import { AppConfig } from './config.js';
import { DATA_REGISTRY } from './data-registry.js';

/**
 * Универсальная функция загрузки JSON с умным Fallback-ом.
 * Работает одинаково стабильно и на сервере (HTTP), и локально (file://).
 * 
 * @param {string} endpoint - Имя файла (напр. 'schedule.json')
 * @param {any} fallbackData - Данные по умолчанию
 */
export async function loadData(endpoint, fallbackData = []) {
    const isLocalFile = window.location.protocol === 'file:';

    // 1. Оффлайн/Локальный режим: сразу отдаем данные из встроенного реестра
    if (isLocalFile) {
        console.log(`[API] Протокол file:// обнаружен. Данные взяты из Data Registry: ${endpoint}`);
        return DATA_REGISTRY[endpoint] || fallbackData;
    }

    // 2. Web-сервер режим: пробуем загрузить свежий JSON через fetch
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
                console.log(`[API] Загружено через HTTP Fetch: ${path}`);
                return data;
            }
        } catch (error) {
            console.warn(`⚠️ [API] Не удалось загрузить ${path}:`, error.message);
        }
    }
    
    // 3. Fallback: если сервер упал, но сайт открыт по http
    console.warn(`❌ [API] Все сетевые попытки провалились для ${endpoint}. Использую Data Registry.`);
    return DATA_REGISTRY[endpoint] || fallbackData;
}