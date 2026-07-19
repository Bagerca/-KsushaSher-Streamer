/* js/schedule.js */
import { loadData } from './api.js';

export class ScheduleManager {
    constructor() {
        this.container = document.getElementById('schedule-container');
    }

    // ИСПРАВЛЕНО: Теперь 100% распознает дни независимо от того, написано полное слово или сокращение
    getDayIndex(dayStr) {
        const day = (dayStr || "").toLowerCase().trim();
        
        if (day.includes("воскресен") || day === "вс") return 0;
        if (day.includes("понедельник") || day === "пн") return 1;
        if (day.includes("вторник") || day === "вт") return 2;
        if (day.includes("сред") || day === "ср") return 3;
        if (day.includes("четверг") || day === "чт") return 4;
        if (day.includes("пятниц") || day === "пт") return 5;
        if (day.includes("суббот") || day === "сб") return 6;
        
        return 99; // Неизвестный день
    }

    async init() {
        if (!this.container) return;

        try {
            const data = await loadData('schedule.json', { schedule: [] });
            const segments = Array.isArray(data) ? data : (data.schedule || []);

            if (segments.length === 0) {
                this.container.innerHTML = `
                    <div class="schedule-empty">
                        <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 10px; color: #444;"></i>
                        <br><span>БАЗА ПУСТА</span>
                    </div>`;
                return;
            }

            // Получаем текущий день недели от системы (0 - Воскресенье, 1 - Понедельник...)
            const currentDayIndex = new Date().getDay(); 

            this.container.innerHTML = segments.map(segment => {
                const dayStr = segment.day || "ТБА";
                const timeStr = segment.time || "--:--";
                const gameName = segment.game || "Секретная миссия";
                const streamTitle = segment.description || "";
                
                // Проверяем, совпадает ли день из JSON с сегодняшним днем
                const isToday = this.getDayIndex(dayStr) === currentDayIndex;

                let cardClass = 'sched-card';
                if (isToday) cardClass += ' is-today';
                else if (segment.highlighted) cardClass += ' is-highlighted';

                return `
                <div class="${cardClass}">
                    <div class="sched-indicator"><div class="sched-dot"></div></div>
                    <div class="sched-content">
                        <div class="sched-game">${gameName}</div>
                        ${streamTitle ? `<div class="sched-desc">${streamTitle}</div>` : ''}
                    </div>
                    <div class="sched-datetime">
                        <div class="sched-day">${dayStr.toUpperCase()}</div>
                        <div class="sched-time"><i class="far fa-clock"></i> ${timeStr}</div>
                    </div>
                </div>`;
            }).join('');
            
        } catch (error) {
            this.container.innerHTML = '<div class="network-error">ОШИБКА БАЗЫ ДАННЫХ</div>';
        }
    }
}