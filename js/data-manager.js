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
    'family': 'Семейный'
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
        loadMovies()
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

// Load and render games
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

// Load and render movies
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

// Load and render schedule
export async function loadSchedule() {
    try {
        const data = await loadData('schedule.json', { schedule: [] });
        renderSchedule(data.schedule || data);
    } catch (error) {
        console.error('❌ Error loading schedule:', error);
        renderSchedule([]);
    }
}

// Load and render statistics
export async function loadStats() {
    try {
        await loadChartJS();
        const stats = await loadData('stats.json', getDefaultStats());
        createRadarChart(stats);
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        createRadarChart(getDefaultStats());
    }
}

// Default statistics fallback
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

// Render schedule data
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

// Render game/movie cards
export function renderCards(container, data, type) {
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="empty-state">${type === 'game' ? '🎮 Игр пока нет' : '🎬 Фильмов пока нет'}</div>`;
        return;
    }

    container.innerHTML = data.map(item => createCard(item, type)).join('');
    attachCardListeners(type, data);
}

// Create individual card
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

// Render genres as tags
function renderGenres(genres) {
    if (!genres || !Array.isArray(genres)) return '';
    return genres.map(genre => 
        `<span class="game-genre">${genreTranslations[genre] || genre}</span>`
    ).join('');
}

// Generate stars for rating
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

// Attach event listeners to cards
function attachCardListeners(type, data) {
    document.querySelectorAll(`[data-${type}]`).forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.getAttribute(`data-${type}`);
            const item = data.find(i => i.id === itemId);
            if (item) {
                // Dispatch custom event for UI components to handle
                document.dispatchEvent(new CustomEvent('cardClick', { 
                    detail: { item, type } 
                }));
            }
        });

        const image = card.querySelector('.game-image');
        if (image) {
            card.addEventListener('mouseenter', () => image.style.transform = 'scale(1.05)');
            card.addEventListener('mouseleave', () => image.style.transform = 'scale(1)');
        }
    });
}

// Highlight current day in schedule
function highlightCurrentDay() {
    const today = new Date().getDay();
    if (today === 0 || today === 6) return; // Don't highlight weekends

    const scheduleItems = document.querySelectorAll('.schedule-item');
    const scheduleIndex = today - 1;
    
    if (scheduleIndex < scheduleItems.length) {
        const currentStatus = scheduleItems[scheduleIndex].querySelector('.schedule-status');
        if (currentStatus) {
            currentStatus.classList.add('active');
        }
    }
}

// Load Chart.js dynamically
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

// Create radar chart
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
            labels: ['Рост аудитории', 'Активность стримов', 'Объем контента', 'Вовлеченность чата', 'Лояльность', 'Разнообразие игр'],
            datasets: [{
                label: 'Текущие показатели',
                data: [
                    Math.round(normalizedData.followers),
                    Math.round(normalizedData.streams),
                    Math.round(normalizedData.hours),
                    Math.round(normalizedData.chatActivity),
                    Math.round(normalizedData.loyalty),
                    Math.round(normalizedData.gamesVariety)
                ],
                backgroundColor: 'rgba(57, 255, 20, 0.1)',
                borderColor: '#39ff14',
                borderWidth: 3,
                pointBackgroundColor: '#39ff14',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { display: false },
                    angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                    grid: { color: 'rgba(255, 45, 149, 0.1)' },
                    pointLabels: {
                        color: '#ffffff',
                        font: { size: 11, weight: '600' },
                        backdropColor: 'rgba(7, 7, 17, 0.8)'
                    }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    updateCenterStats(stats);
}

// Normalize statistics for radar chart
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

// Update center statistics display
function updateCenterStats(stats) {
    const centerValue = document.querySelector('.center-value');
    const centerLabel = document.querySelector('.center-label');
    
    if (centerValue && centerLabel) {
        centerValue.textContent = `${stats.years}+`;
        centerLabel.textContent = 'года опыта';
    }
}

// Export data for external use
export { currentGamesData, currentMoviesData };
