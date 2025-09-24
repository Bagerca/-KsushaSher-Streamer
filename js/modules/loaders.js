// Data loading functionality with Radar Chart support
import { renderSchedule } from './renderers.js';

// State variables
export let gamesLoaded = false;
export let moviesLoaded = false;
export let currentGamesData = [];
export let currentMoviesData = [];

// Chart.js instance
let radarChartInstance = null;

// Base URL for data files
const DATA_BASE_URL = './data/';

// Load Chart.js dynamically
function loadChartJS() {
    return new Promise((resolve, reject) => {
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
            console.error('❌ Failed to load Chart.js');
            reject(new Error('Failed to load Chart.js'));
        };
        document.head.appendChild(script);
    });
}

export function initializeLoaders() {
    // Wait a bit more for DOM to be fully ready
    setTimeout(() => {
        // Load initial data
        loadStats();
        loadSchedule();
        loadGames();
        
        console.log('📊 Loaders initialized');
    }, 200);
    
    // Set up periodic updates
    setInterval(() => {
        loadStats();
        loadSchedule();
    }, 300000); // Every 5 minutes
    
    // Set up intersection observer for radar chart
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log('🎯 Stats section is visible, loading radar chart...');
                    loadStats();
                    observer.disconnect();
                }
            });
        }, { 
            threshold: 0.3,
            rootMargin: '0px 0px -50px 0px'
        });
        
        observer.observe(statsSection);
    }
}

// Load games with container verification
export async function loadGames() {
    // Verify container exists with retry mechanism
    const container = await ensureContainerExists('#games-content .games-grid', 'games');
    if (!container) {
        console.error('❌ Games container not found after retries');
        return;
    }
    
    // Show loading indicator
    container.innerHTML = '<div class="loading-state">🔄 Загрузка игр...</div>';
    
    try {
        const response = await fetch(`${DATA_BASE_URL}games.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const games = await response.json();
        currentGamesData = games;
        
        if (Array.isArray(games) && games.length > 0) {
            gamesLoaded = true;
            
            // Use renderers to display games
            const renderers = await import('./renderers.js');
            renderers.renderCards(container, games, 'game');
            
            console.log('🎮 Games loaded successfully:', games.length);
            return games;
        } else {
            container.innerHTML = '<div class="empty-state">🎮 Игр пока нет</div>';
            return [];
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки игр:', error);
        
        // Try alternative path
        try {
            const altResponse = await fetch('data/games.json?t=' + new Date().getTime());
            if (altResponse.ok) {
                const games = await altResponse.json();
                currentGamesData = games;
                const renderers = await import('./renderers.js');
                renderers.renderCards(container, games, 'game');
                return games;
            }
        } catch (altError) {
            console.error('❌ Альтернативный путь тоже не сработал:', altError);
        }
        
        if (currentGamesData.length > 0) {
            const renderers = await import('./renderers.js');
            renderers.renderCards(container, currentGamesData, 'game');
            return currentGamesData;
        } else {
            container.innerHTML = '<div class="empty-state">❌ Ошибка загрузки игр</div>';
            return [];
        }
    }
}

// Load movies with container verification
export async function loadMovies() {
    // Verify container exists with retry mechanism
    const container = await ensureContainerExists('#movies-content .games-grid', 'movies');
    if (!container) {
        console.error('❌ Movies container not found after retries');
        return;
    }
    
    // Show loading indicator
    container.innerHTML = '<div class="loading-state">🔄 Загрузка фильмов...</div>';
    
    try {
        const response = await fetch(`${DATA_BASE_URL}movies.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const movies = await response.json();
        currentMoviesData = movies;
        
        if (Array.isArray(movies) && movies.length > 0) {
            moviesLoaded = true;
            
            // Use renderers to display movies
            const renderers = await import('./renderers.js');
            renderers.renderCards(container, movies, 'movie');
            
            console.log('🎬 Movies loaded successfully:', movies.length);
            return movies;
        } else {
            container.innerHTML = '<div class="empty-state">🎬 Фильмов пока нет</div>';
            return [];
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки фильмов:', error);
        
        // Try alternative path
        try {
            const altResponse = await fetch('data/movies.json?t=' + new Date().getTime());
            if (altResponse.ok) {
                const movies = await altResponse.json();
                currentMoviesData = movies;
                const renderers = await import('./renderers.js');
                renderers.renderCards(container, movies, 'movie');
                return movies;
            }
        } catch (altError) {
            console.error('❌ Альтернативный путь тоже не сработал:', altError);
        }
        
        if (currentMoviesData.length > 0) {
            const renderers = await import('./renderers.js');
            renderers.renderCards(container, currentMoviesData, 'movie');
            return currentMoviesData;
        } else {
            container.innerHTML = '<div class="empty-state">❌ Ошибка загрузки фильмов</div>';
            return [];
        }
    }
}

// Load statistics with Radar Chart
export async function loadStats() {
    try {
        // Wait for Chart.js to load
        await loadChartJS();
        
        let stats;
        try {
            const response = await fetch(`${DATA_BASE_URL}stats.json?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            stats = await response.json();
            console.log('📈 Stats data loaded:', stats);
        } catch (error) {
            console.log('❌ Ошибка загрузки stats.json, пробуем альтернативный путь...');
            const altResponse = await fetch('data/stats.json?t=' + new Date().getTime());
            if (altResponse.ok) {
                stats = await altResponse.json();
            } else {
                throw new Error('Оба пути не сработали');
            }
        }
        
        createNewRadarChart(stats);
    } catch (error) {
        console.log('📊 Using default stats data');
        createNewRadarChart({
            followers: 5200,
            streams: 150,
            hours: 250,
            years: 3
        });
    }
}

// Load schedule
export async function loadSchedule() {
    try {
        let data;
        try {
            const response = await fetch(`${DATA_BASE_URL}schedule.json?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            data = await response.json();
        } catch (error) {
            console.log('❌ Ошибка загрузки schedule.json, пробуем альтернативный путь...');
            const altResponse = await fetch('data/schedule.json?t=' + new Date().getTime());
            if (altResponse.ok) {
                data = await altResponse.json();
            } else {
                throw new Error('Оба пути не сработали');
            }
        }
        
        // Use renderers to display schedule
        const renderers = await import('./renderers.js');
        renderers.renderSchedule(data.schedule || data);
        
        console.log('📅 Schedule loaded successfully');
    } catch (error) {
        console.error('⏰ Schedule loading error:', error);
        const scheduleList = document.getElementById('schedule-list');
        if (scheduleList) {
            scheduleList.innerHTML = `
                <div class="schedule-item">
                    <div class="schedule-content">
                        <div class="schedule-game">📅 Расписание временно недоступно</div>
                        <div class="schedule-desc">Обновляем данные... ${error.message}</div>
                    </div>
                </div>
            `;
        }
    }
}

// Helper function to ensure container exists with retries
async function ensureContainerExists(selector, type) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 10;
        
        function checkContainer() {
            attempts++;
            const container = document.querySelector(selector);
            
            if (container) {
                console.log(`✅ ${type} container found after ${attempts} attempts`);
                resolve(container);
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkContainer, 100); // Retry every 100ms
            } else {
                console.error(`❌ ${type} container not found after ${maxAttempts} attempts`);
                resolve(null);
            }
        }
        
        checkContainer();
    });
}

// NEW RADAR CHART - COMPLETELY REBUILT
function createNewRadarChart(stats) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) {
        console.error('❌ Canvas element for radar chart not found');
        return;
    }
    
    // Destroy previous chart instance if exists
    if (radarChartInstance) {
        radarChartInstance.destroy();
        console.log('🗑️ Previous radar chart destroyed');
    }
    
    // Normalize data for radar chart (convert to scale 0-100)
    const maxValues = {
        followers: 10000,
        streams: 500,
        hours: 1000,
        years: 10
    };
    
    const normalizedData = {
        followers: Math.min((stats.followers / maxValues.followers) * 100, 100),
        streams: Math.min((stats.streams / maxValues.streams) * 100, 100),
        hours: Math.min((stats.hours / maxValues.hours) * 100, 100),
        years: Math.min((stats.years / maxValues.years) * 100, 100)
    };
    
    console.log('📊 Creating new radar chart with data:', normalizedData);
    
    // SIMPLE RADAR CHART CONFIGURATION - ONLY ONE DATASET
    const config = {
        type: 'radar',
        data: {
            labels: ['Подписчики', 'Кол-во стримов', 'Часы контента', 'Опыт в годах'],
            datasets: [{
                label: 'Прогресс %',
                data: [
                    Math.round(normalizedData.followers),
                    Math.round(normalizedData.streams),
                    Math.round(normalizedData.hours),
                    Math.round(normalizedData.years)
                ],
                backgroundColor: 'rgba(57, 255, 20, 0.2)',
                borderColor: '#39ff14',
                borderWidth: 3,
                pointBackgroundColor: '#39ff14',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    ticks: {
                        display: false,
                        stepSize: 20
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        lineWidth: 1
                    },
                    grid: {
                        color: 'rgba(255, 45, 149, 0.2)',
                        circular: true
                    },
                    pointLabels: {
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        padding: 15
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 15, 25, 0.9)',
                    titleColor: '#39ff14',
                    bodyColor: '#ffffff',
                    borderColor: '#ff2d95',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const actualValues = [stats.followers, stats.streams, stats.hours, stats.years];
                            const labels = ['Подписчики', 'Стримы', 'Часы контента', 'Года в стриминге'];
                            return `${labels[index]}: ${actualValues[index]} (${context.parsed.r}%)`;
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.1,
                    fill: true
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    };
    
    try {
        radarChartInstance = new Chart(ctx, config);
        console.log('✅ New radar chart created successfully - SINGLE CIRCLE');
        
        // Add glow effect to canvas
        ctx.style.filter = 'drop-shadow(0 0 10px rgba(57, 255, 20, 0.3))';
        
        createNewLegend(stats, maxValues);
        
    } catch (error) {
        console.error('❌ Error creating new radar chart:', error);
        
        // Fallback to simple bar chart if radar fails
        createFallbackBarChart(stats, maxValues);
    }
}

// NEW LEGEND CREATION
function createNewLegend(stats, maxValues) {
    const legendContainer = document.getElementById('radarLegend');
    if (!legendContainer) {
        console.error('❌ Legend container not found');
        return;
    }
    
    const legendItems = [
        { 
            label: 'Подписчики', 
            value: stats.followers, 
            max: maxValues.followers, 
            color: '#39ff14',
            icon: '👥',
            emoji: '📈'
        },
        { 
            label: 'Стримы', 
            value: stats.streams, 
            max: maxValues.streams, 
            color: '#ff2d95',
            icon: '📡',
            emoji: '🎮'
        },
        { 
            label: 'Часы контента', 
            value: stats.hours, 
            max: maxValues.hours, 
            color: '#64b5f6',
            icon: '⏰',
            emoji: '⏱️'
        },
        { 
            label: 'Опыт', 
            value: stats.years, 
            max: maxValues.years, 
            color: '#ffd700',
            icon: '⭐',
            emoji: '🎯'
        }
    ];
    
    const progressPercentages = legendItems.map(item => Math.round((item.value / item.max) * 100));
    
    legendContainer.innerHTML = legendItems.map((item, index) => {
        const percentage = progressPercentages[index];
        const progressBarWidth = Math.max(10, percentage); // Minimum 10% width for visibility
        
        return `
            <div class="legend-item" data-progress="${percentage}">
                <div class="legend-header">
                    <span class="legend-emoji">${item.emoji}</span>
                    <span class="legend-label">${item.label}</span>
                    <span class="legend-percentage">${percentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressBarWidth}%; background: ${item.color};"></div>
                </div>
                <div class="legend-values">
                    <span class="legend-current">${item.value.toLocaleString()}</span>
                    <span class="legend-separator">/</span>
                    <span class="legend-max">${item.max.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add CSS for new legend
    addLegendStyles();
    
    console.log('📋 New legend created with progress bars');
}

// FALLBACK BAR CHART if radar fails
function createFallbackBarChart(stats, maxValues) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    
    const percentages = {
        followers: Math.round((stats.followers / maxValues.followers) * 100),
        streams: Math.round((stats.streams / maxValues.streams) * 100),
        hours: Math.round((stats.hours / maxValues.hours) * 100),
        years: Math.round((stats.years / maxValues.years) * 100)
    };
    
    const config = {
        type: 'bar',
        data: {
            labels: ['Подписчики', 'Стримы', 'Часы', 'Опыт'],
            datasets: [{
                label: 'Прогресс (%)',
                data: [
                    percentages.followers,
                    percentages.streams,
                    percentages.hours,
                    percentages.years
                ],
                backgroundColor: [
                    'rgba(57, 255, 20, 0.8)',
                    'rgba(255, 45, 149, 0.8)',
                    'rgba(64, 181, 246, 0.8)',
                    'rgba(255, 215, 0, 0.8)'
                ],
                borderColor: [
                    '#39ff14',
                    '#ff2d95',
                    '#64b5f6',
                    '#ffd700'
                ],
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Статистика канала',
                    color: '#ffffff',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#ffffff',
                        stepSize: 20
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    };
    
    radarChartInstance = new Chart(ctx, config);
    console.log('📊 Fallback bar chart created');
}

// ADD STYLES FOR NEW LEGEND
function addLegendStyles() {
    if (document.getElementById('legend-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'legend-styles';
    style.textContent = `
        .legend-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .legend-emoji {
            font-size: 1.2rem;
            margin-right: 8px;
        }
        
        .legend-label {
            flex: 1;
            font-weight: 600;
            color: #ffffff;
        }
        
        .legend-percentage {
            font-weight: bold;
            color: #39ff14;
            min-width: 40px;
            text-align: right;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 6px;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.5s ease;
            box-shadow: 0 0 5px currentColor;
        }
        
        .legend-values {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: #cccccc;
        }
        
        .legend-current {
            color: #39ff14;
            font-weight: 600;
        }
        
        .legend-max {
            color: #ff2d95;
        }
        
        .legend-separator {
            margin: 0 5px;
            color: #666;
        }
        
        .legend-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 12px;
            border-radius: 8px;
            border-left: 3px solid;
            margin-bottom: 10px;
            transition: transform 0.3s ease;
        }
        
        .legend-item:hover {
            transform: translateX(5px);
            background: rgba(255, 255, 255, 0.08);
        }
    `;
    
    document.head.appendChild(style);
}

// Utility function to format numbers
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Export chart instance for external access if needed
export function getRadarChartInstance() {
    return radarChartInstance;
}

// Force refresh radar chart
export function refreshRadarChart() {
    if (radarChartInstance) {
        radarChartInstance.update();
        console.log('🔄 Radar chart refreshed');
    }
}

// Debug function to check data paths
export async function debugDataPaths() {
    console.log('🔍 Debugging data paths...');
    
    const paths = [
        './data/games.json',
        './data/movies.json', 
        './data/stats.json',
        './data/schedule.json'
    ];
    
    for (const path of paths) {
        try {
            const response = await fetch(path);
            console.log(`${path}: ${response.ok ? '✅ OK' : '❌ Failed'}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   Data:`, data);
            }
        } catch (error) {
            console.log(`${path}: ❌ Error - ${error.message}`);
        }
    }
}
