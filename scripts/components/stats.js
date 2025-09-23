// Управление статистикой
const StatsManager = {
    // Анимация счетчиков
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-value'));
            const duration = 2000;
            
            Helpers.animateValue(counter, 0, target, duration);
        });
    },

    // Обновление статистики
    async update() {
        try {
            const stats = await Loader.loadStats();
            if (stats) {
                // Можно обновить значения из JSON, если они отличаются от data-value
                console.log('Статистика загружена:', stats);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    },

    // Инициализация наблюдателя для анимации при прокрутке
    initScrollObserver() {
        const statsSection = document.getElementById('stats');
        if (!statsSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounters();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(statsSection);
    }
};
