/* js/data-manager.js */

// Базовый путь к данным
const DATA_BASE_URL = './data/';

// Состояние для графиков
let radarChartInstance = null;

// Инициализация загрузки данных (вызывается из app.js)
export async function initializeDataManager() {
    await Promise.all([
        loadStats(),
        loadSchedule(),
        loadSubscribers()
    ]);
    
    // Автообновление каждые 5 минут
    setInterval(() => {
        loadStats();
        loadSchedule();
    }, 300000);
}

// Универсальная функция загрузки JSON
async function loadData(endpoint, fallbackData = []) {
    const paths = [
        `${DATA_BASE_URL}${endpoint}`,
        `./data/${endpoint}`,
        `data/${endpoint}`
    ];

    for (const path of paths) {
        try {
            const response = await fetch(`${path}?t=${Date.now()}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`⚠️ Не удалось загрузить ${path}:`, error);
        }
    }
    return fallbackData;
}

// --- 1. ИГРЫ И КИНО (Используются в media-manager.js) ---
export async function loadGames() {
    return await loadData('games.json', []);
}

export async function loadMovies() {
    return await loadData('movies.json', []);
}

// --- 2. РАСПИСАНИЕ (Отрисовка) ---
export async function loadSchedule() {
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
            const displayTime = item.time ? item.time.split('+')[0] : 'TBA';
            return `
            <div class="cmd-schedule-item ${item.highlighted ? 'active' : ''}">
                <div class="cmd-sch-time">
                    <span class="sch-day">${item.day}</span>
                    <span class="sch-hour">${displayTime}</span>
                </div>
                <div class="cmd-sch-info">
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

// --- 3. СТАТИСТИКА И ГРАФИКИ (Отрисовка) ---
export async function loadStats() {
    try {
        await loadChartJS();
        const stats = await loadData('stats.json', { followers: 0, hours: 0, loyalty: 0 });
        
        // Обновляем числа
        const followersEl = document.querySelector('.followers-val');
        if (followersEl) followersEl.textContent = formatNumber(stats.followers);
        
        const hoursEl = document.querySelector('.hours-val');
        if (hoursEl) hoursEl.textContent = formatNumber(stats.hours) + '+';
        
        // Обновляем круговую диаграмму
        const circularSvg = document.querySelector('.circular-svg-compact .circle');
        const loyaltyText = document.querySelector('.loyalty-val');
        
        if (circularSvg && loyaltyText) {
            loyaltyText.textContent = `${stats.loyalty}%`;
            circularSvg.style.strokeDasharray = `${stats.loyalty}, 100`;
            if (stats.loyalty >= 90) circularSvg.style.stroke = 'var(--neon-green)';
            else if (stats.loyalty >= 70) circularSvg.style.stroke = '#ffd700';
            else circularSvg.style.stroke = '#ff6464';
        }

        // Рисуем радар
        createRadarChart(stats);
        
    } catch (error) {
        console.error('Error rendering stats:', error);
    }
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// --- 4. ПОДПИСЧИКИ (ОБНОВЛЕННАЯ ВЕРСИЯ: HEX + SVG Support) ---
export async function loadSubscribers() {
    const container = document.getElementById('subscribers-track');
    if (!container) return;

    try {
        const subscribers = await loadData('subscribers.json', []);
        
        if (subscribers.length > 0) {
            // Генерируем HTML для больших вертикальных карточек
            const cardsHtml = subscribers.map(sub => {
                // 1. Логика цвета: HEX или маппинг старых названий
                let colorVal = sub.color;
                if (!colorVal) colorVal = '#39ff14'; // Default Neon Green
                
                const colorMap = {
                    'green': '#39ff14', 'red': '#ff4444', 'orange': '#ff8c00',
                    'blue': '#007bff', 'pink': '#ff2d95', 'cyan': '#00ffff', 'purple': '#bd00ff'
                };
                if (colorMap[colorVal]) colorVal = colorMap[colorVal];

                // 2. Логика аватара: Картинка -> Кастомный HTML/SVG -> Иконка
                let avatarContent;
                if (sub.image) {
                    avatarContent = `<img src="${sub.image}" onerror="this.style.display='none'">`;
                } else if (sub.customHtml) {
                    // Поддержка SVG, нарисованного кодом
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
            
            // Дублируем контент для бесконечной прокрутки
            container.innerHTML = cardsHtml + cardsHtml;
        } else {
            container.innerHTML = '<div style="padding:20px;">Нет данных об агентах</div>';
        }
    } catch (error) {
        console.error('Error subscribers:', error);
    }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Chart.js) ---
function loadChartJS() {
    return new Promise((resolve) => {
        if (window.Chart) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = resolve; 
        document.head.appendChild(script);
    });
}

function createRadarChart(stats) {
    const ctx = document.getElementById('radarChart');
    if (!ctx || !window.Chart) return;

    if (radarChartInstance) radarChartInstance.destroy();

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Рост', 'Стримы', 'Контент', 'Чат', 'Лояльность', 'Игры'],
            datasets: [{
                data: [85, 70, 90, 80, stats.loyalty || 50, 60],
                backgroundColor: 'rgba(57, 255, 20, 0.15)',
                borderColor: '#39ff14',
                borderWidth: 2,
                pointBackgroundColor: '#39ff14',
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true, max: 100, ticks: { display: false },
                    angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    grid: { color: 'rgba(57, 255, 20, 0.1)' },
                    pointLabels: { color: '#ccc', font: { size: 10, family: "'Rajdhani'" } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}