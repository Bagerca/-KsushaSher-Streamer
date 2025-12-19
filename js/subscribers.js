/* js/subscribers.js */
import { loadData } from './api.js';

export async function initSubscribers() {
    const container = document.getElementById('subscribers-track');
    if (!container) return;

    try {
        const subscribers = await loadData('subscribers.json', []);
        
        if (subscribers.length > 0) {
            const cardsHtml = subscribers.map(sub => {
                let colorVal = sub.color || '#39ff14';
                
                // Маппинг цветов для совместимости
                const colorMap = {
                    'green': '#39ff14', 'red': '#ff4444', 'orange': '#ff8c00',
                    'blue': '#007bff', 'pink': '#ff2d95', 'cyan': '#00ffff', 'purple': '#bd00ff'
                };
                if (colorMap[colorVal]) colorVal = colorMap[colorVal];

                let avatarContent;
                if (sub.image) {
                    avatarContent = `<img src="${sub.image}" onerror="this.style.display='none'">`;
                } else if (sub.customHtml) {
                    avatarContent = sub.customHtml;
                } else {
                    avatarContent = `<i class="${sub.mainIcon}"></i>`;
                }

                return `
                <div class="holo-card" style="--sub-color: ${colorVal}">
                    <div class="card-top-deco"><span>LVL.${sub.level}</span> <i class="${sub.typeIcon}"></i></div>
                    <div class="holo-avatar-container">
                        <div class="holo-avatar">
                            ${avatarContent}
                        </div>
                        <div class="avatar-ring"></div>
                    </div>
                    <div class="holo-info">
                        <div class="holo-name">${sub.name}</div>
                        <div class="holo-role">${sub.role}</div>
                    </div>
                    <div class="card-stat-bar"><div class="fill" style="width: ${sub.stats}%"></div></div>
                </div>
            `}).join('');
            
            container.innerHTML = cardsHtml + cardsHtml;
        } else {
            container.innerHTML = '<div style="padding:20px;">Нет данных об агентах</div>';
        }
    } catch (error) {
        console.error('Error subscribers:', error);
    }
}