// Основной файл инициализации
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация приложения Ksusha Sher...');

    // Инициализация UI компонентов
    UI.initNavigation();
    UI.initCardCopy();

    // Загрузка данных
    Promise.all([
        ScheduleManager.update(),
        GamesManager.update(),
        StatsManager.update()
    ]).then(() => {
        console.log('✅ Все данные успешно загружены');
        
        // Инициализация анимации статистики
        StatsManager.initScrollObserver();
        
    }).catch(error => {
        console.error('❌ Ошибка загрузки данных:', error);
        UI.showNotification('Ошибка загрузки данных', 'error');
    });

    // Периодическое обновление данных (каждые 5 минут)
    setInterval(() => {
        ScheduleManager.update();
        StatsManager.update();
    }, 300000);

    // Обработка ошибок
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        UI.showNotification('Произошла ошибка в приложении', 'error');
    });

    console.log('🎯 Приложение успешно инициализировано');
});
