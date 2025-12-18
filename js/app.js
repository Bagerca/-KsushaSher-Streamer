// Main application entry point
import { initializeUI } from './ui-components.js';
import { initializeDataManager } from './data-manager.js';
// Импортируем новый менеджер для секции "Архив"
import { initMediaArchive } from './media-manager.js';

// Application state
const AppState = {
    initialized: false
};

// Initialize application
async function initializeApplication() {
    if (AppState.initialized) return;
    
    try {
        console.log('🚀 Starting Ksusha Sher website initialization...');
        
        // 1. Инициализация общего UI (Скролл, Копирование номера карты, Навигация)
        // Примечание: Старые фильтры игр из ui-components.js просто не найдут своих элементов и пропустят выполнение, это нормально.
        initializeUI();
        
        // 2. Загрузка данных для Hero, Command Center и About
        // (Статистика, Расписание, Подписчики)
        await initializeDataManager();
        
        // 3. Инициализация нового блока "Цифровой Архив" (Игры и Кино)
        await initMediaArchive();
        
        console.log('✅ Ksusha Sher website initialized successfully!');
        AppState.initialized = true;
        
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
    }
}

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('🚨 Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled promise rejection:', e.reason);
});

// Performance monitoring
function monitorPerformance() {
    if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            console.log('📊 Page load performance:', {
                'DOM Content Loaded': `${navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart}ms`,
                'Full Load': `${navigationTiming.loadEventEnd - navigationTiming.navigationStart}ms`
            });
        }
    }
}

// Wait for complete page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApplication();
        monitorPerformance();
    });
} else {
    initializeApplication();
    monitorPerformance();
}

// Export for debugging
window.AppState = AppState;