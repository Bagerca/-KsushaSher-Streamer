import { AppInitializer } from './core/initializer.js';

// Инициализация приложения
console.log('🚀 Initializing KsushaSher Streamer App...');

// Экспортируем глобальные методы для доступа из консоли
window.App = {
    version: '1.0.0',
    refresh: () => {
        if (window.gamesManager) window.gamesManager.refresh();
        if (window.statsManager) window.statsManager.refresh();
    },
    debug: () => {
        console.log('🏗️ App Debug Info:');
        console.log('- Games Manager:', window.gamesManager);
        console.log('- Stats Manager:', window.statsManager);
        console.log('- Orbital System:', window.orbitalSystem);
    }
};

// Глобальные методы для пагинации (альтернативный вариант)
window.nextPage = () => {
    if (window.gamesManager) window.gamesManager.nextPage();
};

window.previousPage = () => {
    if (window.gamesManager) window.gamesManager.previousPage();
};

console.log('✅ App initialized successfully');
