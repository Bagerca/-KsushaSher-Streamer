/* js/media-manager.js */
import { MediaStore } from './media-store.js';
import { MediaRenderer } from './media-renderer.js';

export async function initMediaArchive() {
    try {
        console.log('📂 [MediaArchive] Инициализация модуля...');
        
        // 1. Создаем Model (Управление данными и фильтрацией)
        const store = new MediaStore();
        
        // 2. Создаем View (Управление DOM и скроллом), передаем ему Model
        const renderer = new MediaRenderer(store);
        
        // 3. Запускаем первичную загрузку данных
        await store.loadType('games');
        
    } catch (error) {
        console.error("❌ [MediaArchive] Критическая ошибка при инициализации:", error);
    }
}