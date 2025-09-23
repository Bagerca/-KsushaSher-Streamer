// Управление расписанием
const ScheduleManager = {
    // Отображение расписания
    render(schedule) {
        const container = document.getElementById('schedule-list');
        if (!container) return;

        if (!schedule || schedule.length === 0) {
            container.innerHTML = '<div class="schedule-item"><div class="schedule-game">Расписание загружается...</div></div>';
            return;
        }

        container.innerHTML = schedule.map(item => {
            const isToday = Helpers.isToday(item.day);
            return `
                <div class="schedule-item ${isToday ? 'today' : ''}">
                    <div class="schedule-day">${item.day}</div>
                    <div class="schedule-game">${item.game}</div>
                    <div class="schedule-time">${item.time}</div>
                </div>
            `;
        }).join('');
    },

    // Обновление расписания
    async update() {
        UI.setLoading(true);
        try {
            const schedule = await Loader.loadSchedule();
            this.render(schedule);
        } catch (error) {
            console.error('Ошибка обновления расписания:', error);
            UI.showNotification('Ошибка загрузки расписания', 'error');
        } finally {
            UI.setLoading(false);
        }
    }
};
