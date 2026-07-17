/* js/schedule.js */
import { loadData } from './api.js';

export class ScheduleManager {
    constructor() {
        this.container = document.getElementById('schedule-container');
    }

    getDayIndex(dayStr) {
        const d = dayStr.toLowerCase();
        if (d.includes('пон') || d === 'пн') return 1;
        if (d.includes('вто') || d === 'вт') return 2;
        if (d.includes('сре') || d === 'ср') return 3;
        if (d.includes('чет') || d === 'чт') return 4;
        if (d.includes('пят') || d === 'пт') return 5;
        if (d.includes('суб') || d === 'сб') return 6;
        if (d.includes('вос') || d === 'вс') return 0;
        return -1;
    }

    async init() {
        if (!this.container) return;

        try {
            console.log(`📅 [Schedule] Загрузка локального расписания из базы данных...`);
            
            const rawData = await loadData('schedule.json', { schedule: [] });
            const segments = Array.isArray(rawData) ? rawData : (rawData.schedule || []);

            if (segments.length === 0) {
                this.container.innerHTML = `
                    <div class="schedule-empty">
                        <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 10px; color: #444;"></i>
                        <br>
                        <span>БАЗА ПУСТА.<br>Трансляции не запланированы.</span>
                    </div>`;
                return;
            }

            const currentDayIndex = new Date().getDay(); 

            this.container.innerHTML = segments.map(segment => {
                const dayStr = segment.day || "ТБА";
                const timeStr = segment.time || "Время неизвестно";
                const gameName = segment.game || "Секретная трансляция";
                const streamTitle = segment.description || "";
                
                const segmentDayIdx = this.getDayIndex(dayStr);
                const isToday = segmentDayIdx === currentDayIndex;

                let cardClass = 'sched-card';
                if (isToday) cardClass += ' is-today';
                else if (segment.highlighted) cardClass += ' is-highlighted';

                // НОВАЯ РАЗМЕТКА:
                // sched-indicator (слева) -> sched-content (центр) -> sched-datetime (справа)
                return `
                <div class="${cardClass}">
                    <div class="sched-indicator">
                        <div class="sched-dot"></div>
                    </div>
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
            console.error('❌ [Schedule] Ошибка рендера локального расписания:', error);
            this.container.innerHTML = '<div class="network-loading" style="color:#ff4444;">ОШИБКА ЧТЕНИЯ БАЗЫ ДАННЫХ</div>';
        }
    }
}