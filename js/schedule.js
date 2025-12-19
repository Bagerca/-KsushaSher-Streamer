/* js/schedule.js */
import { loadData } from './api.js';

export async function initSchedule() {
    const container = document.getElementById('schedule-container');
    if (!container) return;

    try {
        const data = await loadData('schedule.json', { schedule: [] });
        const scheduleData = data.schedule || data;
        
        if (!scheduleData || scheduleData.length === 0) {
            container.innerHTML = '<div style="padding:20px; color:rgba(255,255,255,0.5);">ДАННЫЕ ОТСУТСТВУЮТ</div>';
            return;
        }

        container.innerHTML = scheduleData.map(item => {
            const displayTime = item.time ? item.time.replace('+', '') : 'TBA';
            
            return `
            <div class="cmd-schedule-item ${item.highlighted ? 'active' : ''}">
                <div class="cmd-sch-info">
                    <div class="sch-meta-row">
                        <span class="sch-day">[ ${item.day} ]</span>
                        <span class="sch-time-badge">${displayTime}</span>
                    </div>
                    <div class="sch-game">${item.game}</div>
                    <div class="sch-desc">${item.description}</div>
                </div>
            </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error rendering schedule:', error);
        container.innerHTML = '<div style="padding:20px; color:#ff6464;">ОШИБКА ДАННЫХ</div>';
    }
}