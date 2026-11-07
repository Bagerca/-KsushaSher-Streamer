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
        
        // Лямбда для получения текущего режима сетки (detailed/compact)
        const getGridMode = () => gridManager ? gridManager.gridMode : 'detailed';
        
        const factory = new CardFactory(getGridMode);
        const lazyLoader = new LazyLoader(getGridMode);
        
        // GridManager теперь инициализирует внутри себя новый ArchivePagination
        const gridManager = new GridManager(store, factory, lazyLoader);
        
        new SearchController();
        new FilterController(gridManager);
        
    } catch (error) {
        console.error("❌ [MediaArchive] Критическая ошибка при инициализации:", error);
    }
}