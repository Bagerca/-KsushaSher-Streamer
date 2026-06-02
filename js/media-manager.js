/* js/media-manager.js */
import { MediaStore } from './media-store.js';
import { CardFactory } from './archive/CardFactory.js';
import { LazyLoader } from './archive/LazyLoader.js';
import { SearchController } from './archive/SearchController.js';
import { FilterController } from './archive/FilterController.js';
import { GridManager } from './archive/GridManager.js';

export async function initMediaArchive() {
    try {
        console.log('📂 [MediaArchive] Инициализация модульной архитектуры...');
        
        const store = new MediaStore();
        
        // Создаем фасад для передачи состояния режима сетки
        const getGridMode = () => gridManager ? gridManager.gridMode : 'detailed';
        
        const factory = new CardFactory(getGridMode);
        const lazyLoader = new LazyLoader(getGridMode);
        
        const gridManager = new GridManager(store, factory, lazyLoader);
        
        new SearchController(store);
        new FilterController(store, gridManager);
        
        await store.loadType('games');
        
    } catch (error) {
        console.error("❌ [MediaArchive] Критическая ошибка при инициализации:", error);
    }
}