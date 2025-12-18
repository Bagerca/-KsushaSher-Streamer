// Data loading and rendering functionality
const DATA_BASE_URL = './data/';

// Application state
let radarChartInstance = null;
let currentGamesData = [];
let currentMoviesData = [];

// Genre translations
const genreTranslations = {
    'puzzle': 'Головоломка',
    'adventure': 'Приключения', 
    'simulator': 'Симулятор',
    'horror': 'Хоррор',
    'coop': 'Кооператив',
    'shooter': 'Шутер',
    'platformer': 'Платформер',
    'rpg': 'RPG',
    'animation': 'Анимация',
    'fantasy': 'Фэнтези',
    'crossover': 'Кроссовер',
    'family': 'Семейный',
    'action': 'Экшен'
};

// Initialize data manager
export async function initializeDataManager() {
    await loadAllData();
    setupPeriodicUpdates();
}

// Load all initial data
async function loadAllData() {
    await Promise.all([
        loadStats(),
        loadSchedule(),
        loadGames(),
        loadMovies(),
        loadSubscribers() // <-- Загрузка подписчиков
    ]);
}

// Setup periodic data updates
function setupPeriodicUpdates() {
    setInterval(() => {
        loadStats();
        loadSchedule();
    }, 300000); // 5 minutes
}

// Generic data loader with error handling
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
                const data = await response.json();
                console.log(`✅ ${endpoint} loaded successfully`);
                return data;
            }
        } catch (error) {
            console.warn(`❌ Failed to load from ${path}:`, error);
        }
    }
    
    console.log(`📋 Using fallback data for ${endpoint}`);
    return fallbackData;
}

// --- GAMES & MOVIES ---

export async function loadGames() {
    const container = document.querySelector('#games-content .games-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">🔄 Загрузка игр...</div>';
    
    try {
        const games = await loadData('games.json', []);
        currentGamesData = Array.isArray(games) ? games : [];
        
        if (currentGamesData.length > 0) {
            renderCards(container, currentGamesData, 'game');
        } else {
            container.innerHTML = '<div class="empty-state">🎮 Игр пока нет</div>';
        }
        
        return currentGamesData;
    } catch (error) {
        console.error('❌ Error loading games:', error);
        container.innerHTML = '<div class="empty-state">❌ Ошибка загрузки игр</div>';
        return [];
    }
}

export async function loadMovies() {
    const container = document.querySelector('#movies-content .games-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">🔄 Загрузка фильмов...</div>';
    
    try {
        const movies = await loadData('movies.json', []);
        currentMoviesData = Array.isArray(movies) ? movies : [];
        
        if (currentMoviesData.length > 0) {
            renderCards(container, currentMoviesData, 'movie');
        } else {
            container.innerHTML = '<div class="empty-state">🎬 Фильмов пока нет</div>';
        }
        
        return currentMoviesData;
    } catch (error) {
        console.error('❌ Error loading movies:', error);
        container.innerHTML = '<div class="empty-state">❌ Ошибка загрузки фильмов</div>';
        return [];
    }
}

export function renderCards(container, data, type) {
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="empty-state">${type === 'game' ? '🎮 Игр пока нет' : '🎬 Фильмов пока нет'}</div>`;
        return;
    }

    container.innerHTML = data.map(item => createCard(item, type)).join('');
    
    // Attach click events
    container.querySelectorAll(`.game-card`).forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.getAttribute(`data-${type}`);
            const item = data.find(i => i.id === itemId);
            if (item) {
                document.dispatchEvent(new CustomEvent('cardClick', { detail: { item, type } }));
            }
        });
    });
}

function createCard(item, type) {
    const statusClass = type === 'game' ? item.status : 
                       item.status === 'watched' ? 'watched' : 
                       item.status === 'watching' ? 'watching' : item.status;

    return `
        <div class="game-card ${statusClass}" data-${type}="${item.id}" ${item.customColor ? `style="--custom-hover-color: ${item.customColor}"` : ''}>
            <div class="game-image-container">
                <img src="${item.image}" alt="${item.title}" class="game-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/0f0f1b/39ff14?text=No+Image'">
            </div>
            <div class="game-info">
                <h3 class="game-title">${item.title}</h3>
                <div class="game-genres">${renderGenres(item.genres)}</div>
                <div class="game-rating">${generateStars(item.rating)}<span>${item.rating}/5</span></div>
                <p class="game-description">${item.description}</p>
            </div>
        </div>
    `;
}

function renderGenres(genres) {
    if (!genres || !Array.isArray(genres)) return '';
    return genres.map(genre => 
        `<span class="game-genre">${genreTranslations[genre] || genre}</span>`
    ).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return [
        ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
        ...(hasHalfStar ? ['<i class="fas fa-star-half-alt"></i>'] : []),
        ...Array(emptyStars).fill('<i class="far fa-star"></i>')
    ].join('');
}


// --- SCHEDULE ---

export async function loadSchedule() {
    try {
        const data = await loadData('schedule.json', { schedule: [] });
        renderSchedule(data.schedule || data);
    } catch (error) {
        console.error('❌ Error loading schedule:', error);
        renderSchedule([]);
    }
}

function renderSchedule(scheduleData) {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;

    if (!scheduleData || scheduleData.length === 0) {
        scheduleList.innerHTML = `
            <div class="schedule-item">
                <div class="schedule-content">
                    <div class="schedule-game">📅 Расписание загружается...</div>
                    <div class="schedule-desc">Данные будут доступны скоро</div>
                </div>
            </div>
        `;
        return;
    }

    scheduleList.innerHTML = scheduleData.map(item => `
        <div class="schedule-item ${item.highlighted ? 'highlighted' : ''}">
            <div class="schedule-day-wrapper">
                <div class="schedule-day">${item.day || 'День'}</div>
                <div class="schedule-time">${item.time || 'Время'}</div>
            </div>
            <div class="schedule-content">
                <div class="schedule-game">${item.game || 'Игра'}</div>
                <div class="schedule-desc">${item.description || 'Описание'}</div>
            </div>
            <div class="schedule-status"></div>
        </div>
    `).join('');

    highlightCurrentDay();
}

function highlightCurrentDay() {
    const today = new Date().getDay(); // 0 is Sunday
    if (today === 0 || today === 6) return; // Optional: skip weekends

    const scheduleItems = document.querySelectorAll('.schedule-item');
    const scheduleIndex = today - 1;
    
    if (scheduleItems[scheduleIndex]) {
        const currentStatus = scheduleItems[scheduleIndex].querySelector('.schedule-status');
        if (currentStatus) {
            currentStatus.classList.add('active');
        }
    }
}


// --- STATS & CHARTS ---

export async function loadStats() {
    try {
        await loadChartJS();
        const stats = await loadData('stats.json', getDefaultStats());
        
        createRadarChart(stats);
        updateBentoGrid(stats);
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        const defaults = getDefaultStats();
        createRadarChart(defaults);
        updateBentoGrid(defaults);
    }
}

function getDefaultStats() {
    return {
        followers: 5200,
        streams: 154,
        hours: 1000,
        years: 3,
        chatActivity: 280,
        loyalty: 95,
        gamesVariety: 25
    };
}

function updateBentoGrid(stats) {
    const followersEl = document.querySelector('.followers-item .stat-main-value');
    if (followersEl) followersEl.textContent = formatNumber(stats.followers);
    
    const streamsItem = document.querySelector('.streams-item');
    if (streamsItem) {
        const values = streamsItem.querySelectorAll('.stat-value-medium');
        if (values.length >= 2) {
            values[0].textContent = stats.streams;
            values[1].textContent = formatNumber(stats.hours) + '+';
        }
    }
    
    const chatEl = document.querySelector('.chat-item .stat-value-large');
    if (chatEl) chatEl.textContent = stats.chatActivity;
    
    const loyaltyChart = document.querySelector('.circular-chart');
    if (loyaltyChart) {
        loyaltyChart.style.setProperty('--percentage', stats.loyalty);
        const textEl = loyaltyChart.querySelector('.percentage-text');
        if (textEl) textEl.innerHTML = `${stats.loyalty}%<span>Лояльность</span>`;
    }
    
    const gamesEl = document.querySelector('.games-item .stat-value-medium');
    if (gamesEl) gamesEl.textContent = stats.gamesVariety + '+';
    
    const chartCenterVal = document.querySelector('.chart-overlay-value span');
    if (chartCenterVal) chartCenterVal.textContent = stats.years + '+';
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function loadChartJS() {
    return new Promise((resolve) => {
        if (window.Chart) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            console.log('📊 Chart.js loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.warn('❌ Failed to load Chart.js, using fallback');
            resolve();
        };
        document.head.appendChild(script);
    });
}

function createRadarChart(stats) {
    const ctx = document.getElementById('radarChart');
    if (!ctx || !window.Chart) return;

    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    const normalizedData = normalizeStats(stats);
    
    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Рост', 'Стримы', 'Контент', 'Чат', 'Лояльность', 'Игры'],
            datasets: [{
                label: 'Показатели',
                data: [
                    normalizedData.followers,
                    normalizedData.streams,
                    normalizedData.hours,
                    normalizedData.chatActivity,
                    normalizedData.loyalty,
                    normalizedData.gamesVariety
                ],
                backgroundColor: 'rgba(57, 255, 20, 0.15)',
                borderColor: '#39ff14',
                borderWidth: 2,
                pointBackgroundColor: '#39ff14',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#39ff14',
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { display: false },
                    angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    grid: { color: 'rgba(57, 255, 20, 0.1)', circular: true },
                    pointLabels: {
                        color: '#ccc',
                        font: { size: 10, family: "'Rajdhani', sans-serif", weight: '600' },
                        backdropColor: 'transparent'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 15, 27, 0.9)',
                    titleColor: '#39ff14',
                    bodyColor: '#fff',
                    borderColor: '#39ff14',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: { label: function(context) { return context.raw + '%'; } }
                }
            },
            animation: { duration: 2000, easing: 'easeOutQuart' }
        }
    });
}

function normalizeStats(stats) {
    const maxValues = {
        followers: 10000, streams: 500, hours: 2000, years: 10,
        chatActivity: 500, loyalty: 100, gamesVariety: 50
    };

    return {
        followers: Math.min((stats.followers / maxValues.followers) * 100, 100),
        streams: Math.min((stats.streams / maxValues.streams) * 100, 100),
        hours: Math.min((stats.hours / maxValues.hours) * 100, 100),
        years: Math.min((stats.years / maxValues.years) * 100, 100),
        chatActivity: Math.min((stats.chatActivity / maxValues.chatActivity) * 100, 100),
        loyalty: Math.min((stats.loyalty / maxValues.loyalty) * 100, 100),
        gamesVariety: Math.min((stats.gamesVariety / maxValues.gamesVariety) * 100, 100)
    };
}


// --- SUBSCRIBERS (NEW) ---

export async function loadSubscribers() {
    const container = document.getElementById('subscribers-track');
    if (!container) return;

    try {
        const subscribers = await loadData('subscribers.json', []);
        
        if (subscribers.length > 0) {
            const cardsHtml = subscribers.map(sub => createSubscriberCard(sub)).join('');
            
            // ВАЖНО: Дублируем контент для бесшовной анимации
            container.innerHTML = cardsHtml + cardsHtml;
        } else {
            container.innerHTML = '<div style="color: rgba(255,255,255,0.5); padding: 20px; font-family: \'Exo 2\';">Нет данных об агентах</div>';
        }
    } catch (error) {
        console.error('❌ Error loading subscribers:', error);
        container.innerHTML = '<div style="color: rgba(255,68,68,0.7); padding: 20px; font-family: \'Exo 2\';">Ошибка связи с базой данных</div>';
    }
}

function createSubscriberCard(sub) {
    // Если есть картинка - используем её с фоллбэком на иконку
    let avatarHtml;
    if (sub.image) {
        avatarHtml = `<img src="${sub.image}" alt="${sub.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><i class="${sub.mainIcon}" style="display:none"></i>`;
    } else {
        avatarHtml = `<i class="${sub.mainIcon}"></i>`;
    }

    return `
        <div class="holo-card ${sub.color}">
            <div class="card-top-deco"><span>LVL.${sub.level}</span> <i class="${sub.typeIcon}"></i></div>
            <div class="holo-avatar-container">
                <div class="holo-avatar">${avatarHtml}</div>
                <div class="avatar-ring"></div>
            </div>
            <div class="holo-info">
                <div class="holo-name">${sub.name}</div>
                <div class="holo-role">${sub.role}</div>
            </div>
            <div class="card-stat-bar"><div class="fill" style="width: ${sub.stats}%"></div></div>
        </div>
    `;
}

export { currentGamesData, currentMoviesData };