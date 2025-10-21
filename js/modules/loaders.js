// Data loading functionality with Radar Chart support
import { renderSchedule, renderCards } from './renderers.js';

// State variables
export let gamesLoaded = false;
export let moviesLoaded = false;
export let currentGamesData = [];
export let currentMoviesData = [];

// Chart.js instance
let radarChartInstance = null;

// Base URL for data files - ИСПРАВЛЕННЫЙ ПУТЬ
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
    }, 500); // Увеличил задержку для стабильности
    
    // Set up periodic updates
    setInterval(() => {
        loadStats();
        loadSchedule();
    }, 300000);
}

// Load games with improved error handling
export async function loadGames() {
    const container = document.querySelector('#games-content .games-grid');
    if (!container) {
        console.error('❌ Games container not found');
        return;
    }
    
    // Show loading indicator
    container.innerHTML = '<div class="loading-state">🔄 Загрузка игр...</div>';
    
    try {
        console.log('🔄 Loading games from:', `${DATA_BASE_URL}games.json`);
        
        const response = await fetch(`${DATA_BASE_URL}games.json?t=${new Date().getTime()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const games = await response.json();
        console.log('✅ Games data loaded:', games);
        
        if (Array.isArray(games) && games.length > 0) {
            currentGamesData = games;
            gamesLoaded = true;
            
            renderCards(container, games, 'game');
            console.log('🎮 Games rendered successfully:', games.length);
            return games;
        } else {
            container.innerHTML = '<div class="empty-state">🎮 Игр пока нет</div>';
            return [];
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки игр:', error);
        
        // Try multiple alternative paths
        const alternativePaths = [
            './data/games.json',
            'data/games.json',
            '../data/games.json'
        ];
        
        for (const path of alternativePaths) {
            try {
                console.log(`🔄 Trying alternative path: ${path}`);
                const altResponse = await fetch(`${path}?t=${new Date().getTime()}`);
                if (altResponse.ok) {
                    const games = await altResponse.json();
                    currentGamesData = games;
                    renderCards(container, games, 'game');
                    console.log('✅ Games loaded via alternative path');
                    return games;
                }
            } catch (altError) {
                console.warn(`❌ Alternative path failed: ${path}`, altError);
            }
        }
        
        // Final fallback
        if (currentGamesData.length > 0) {
            renderCards(container, currentGamesData, 'game');
            return currentGamesData;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    ❌ Ошибка загрузки игр
                    <br><small>${error.message}</small>
                </div>
            `;
            return [];
        }
    }
}

// Load movies with improved error handling
export async function loadMovies() {
    const container = document.querySelector('#movies-content .games-grid');
    if (!container) {
        console.error('❌ Movies container not found');
        return;
    }
    
    container.innerHTML = '<div class="loading-state">🔄 Загрузка фильмов...</div>';
    
    try {
        console.log('🔄 Loading movies from:', `${DATA_BASE_URL}movies.json`);
        
        const response = await fetch(`${DATA_BASE_URL}movies.json?t=${new Date().getTime()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const movies = await response.json();
        console.log('✅ Movies data loaded:', movies);
        
        if (Array.isArray(movies) && movies.length > 0) {
            currentMoviesData = movies;
            moviesLoaded = true;
            
            renderCards(container, movies, 'movie');
            console.log('🎬 Movies rendered successfully:', movies.length);
            return movies;
        } else {
            container.innerHTML = '<div class="empty-state">🎬 Фильмов пока нет</div>';
            return [];
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки фильмов:', error);
        
        const alternativePaths = [
            './data/movies.json',
            'data/movies.json', 
            '../data/movies.json'
        ];
        
        for (const path of alternativePaths) {
            try {
                console.log(`🔄 Trying alternative path: ${path}`);
                const altResponse = await fetch(`${path}?t=${new Date().getTime()}`);
                if (altResponse.ok) {
                    const movies = await altResponse.json();
                    currentMoviesData = movies;
                    renderCards(container, movies, 'movie');
                    console.log('✅ Movies loaded via alternative path');
                    return movies;
                }
            } catch (altError) {
                console.warn(`❌ Alternative path failed: ${path}`, altError);
            }
        }
        
        if (currentMoviesData.length > 0) {
            renderCards(container, currentMoviesData, 'movie');
            return currentMoviesData;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    ❌ Ошибка загрузки фильмов
                    <br><small>${error.message}</small>
                </div>
            `;
            return [];
        }
    }
}

// Load statistics
export async function loadStats() {
    try {
        await loadChartJS();
        
        let stats;
        try {
            const response = await fetch(`${DATA_BASE_URL}stats.json?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            stats = await response.json();
            console.log('📈 Stats data loaded:', stats);
        } catch (error) {
            console.log('❌ Ошибка загрузки stats.json, пробуем альтернативные пути...');
            
            const alternativePaths = [
                './data/stats.json',
                'data/stats.json',
                '../data/stats.json'
            ];
            
            for (const path of alternativePaths) {
                try {
                    const altResponse = await fetch(`${path}?t=${new Date().getTime()}`);
                    if (altResponse.ok) {
                        stats = await altResponse.json();
                        console.log('✅ Stats loaded via alternative path');
                        break;
                    }
                } catch (altError) {
                    console.warn(`❌ Alternative path failed: ${path}`);
                }
            }
            
            if (!stats) {
                throw new Error('Все пути не сработали');
            }
        }
        
        createNewRadarChart(stats);
    } catch (error) {
        console.log('📊 Using default stats data');
        createNewRadarChart({
            followers: 5200,
            streams: 154,
            hours: 1000,
            years: 3,
            chatActivity: 280,
            loyalty: 95,
            gamesVariety: 25
        });
    }
}

// Load schedule with improved error handling
export async function loadSchedule() {
    try {
        let data;
        console.log('🔄 Loading schedule from:', `${DATA_BASE_URL}schedule.json`);
        
        try {
            const response = await fetch(`${DATA_BASE_URL}schedule.json?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            data = await response.json();
            console.log('✅ Schedule data loaded:', data);
        } catch (error) {
            console.log('❌ Ошибка загрузки schedule.json, пробуем альтернативные пути...');
            
            const alternativePaths = [
                './data/schedule.json',
                'data/schedule.json', 
                '../data/schedule.json'
            ];
            
            for (const path of alternativePaths) {
                try {
                    const altResponse = await fetch(`${path}?t=${new Date().getTime()}`);
                    if (altResponse.ok) {
                        data = await altResponse.json();
                        console.log('✅ Schedule loaded via alternative path');
                        break;
                    }
                } catch (altError) {
                    console.warn(`❌ Alternative path failed: ${path}`);
                }
            }
            
            if (!data) {
                throw new Error('Все пути не сработали');
            }
        }
        
        renderSchedule(data.schedule || data);
        console.log('📅 Schedule rendered successfully');
        
    } catch (error) {
        console.error('⏰ Schedule loading error:', error);
        const scheduleList = document.getElementById('schedule-list');
        if (scheduleList) {
            scheduleList.innerHTML = `
                <div class="schedule-item">
                    <div class="schedule-content">
                        <div class="schedule-game">📅 Расписание временно недоступно</div>
                        <div class="schedule-desc">Попробуйте обновить страницу или проверьте консоль для деталей</div>
                    </div>
                </div>
            `;
        }
    }
}

// NEW RADAR CHART - остальной код оставляем без изменений
function createNewRadarChart(stats) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) {
        console.error('❌ Canvas element for radar chart not found');
        return;
    }
    
    if (radarChartInstance) {
        radarChartInstance.destroy();
    }
    
    // Normalize data for radar chart
    const maxValues = {
        followers: 10000,
        streams: 500,
        hours: 2000,
        years: 10,
        chatActivity: 500,
        loyalty: 100,
        gamesVariety: 50
    };
    
    const normalizedData = {
        followers: Math.min((stats.followers / maxValues.followers) * 100, 100),
        streams: Math.min((stats.streams / maxValues.streams) * 100, 100),
        hours: Math.min((stats.hours / maxValues.hours) * 100, 100),
        years: Math.min((stats.years / maxValues.years) * 100, 100),
        chatActivity: Math.min((stats.chatActivity / maxValues.chatActivity) * 100, 100),
        loyalty: Math.min((stats.loyalty / maxValues.loyalty) * 100, 100),
        gamesVariety: Math.min((stats.gamesVariety / maxValues.gamesVariety) * 100, 100)
    };
    
    const config = {
        type: 'radar',
        data: {
            labels: [
                'Рост аудитории', 
                'Активность стримов', 
                'Объем контента', 
                'Вовлеченность чата',
                'Лояльность', 
                'Разнообразие игр'
            ],
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
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#ff2d95',
                pointHoverBorderColor: '#ffffff'
            }, {
                label: 'Целевые показатели',
                data: [100, 100, 100, 100, 100, 100],
                backgroundColor: 'rgba(255, 45, 149, 0.05)',
                borderColor: '#ff2d95',
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                pointRadius: 0
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
                        color: 'rgba(255, 255, 255, 0.15)',
                        lineWidth: 1
                    },
                    grid: {
                        color: 'rgba(255, 45, 149, 0.1)',
                        circular: true,
                        lineWidth: 1
                    },
                    pointLabels: {
                        color: '#ffffff',
                        font: {
                            size: 11,
                            weight: '600',
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        padding: 15,
                        backdropColor: 'rgba(7, 7, 17, 0.8)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 15, 25, 0.95)',
                    titleColor: '#39ff14',
                    bodyColor: '#ffffff',
                    borderColor: '#ff2d95',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const labels = [
                                `Подписчики: ${stats.followers.toLocaleString()} (+12%)`,
                                `Стримы: ${stats.streams} (3.2/нед)`,
                                `Контент: ${stats.hours}+ часов`,
                                `Чат: ${stats.chatActivity} сообщ/час`,
                                `Лояльность: ${stats.loyalty}%`,
                                `Игры: ${stats.gamesVariety}+ проектов`
                            ];
                            return labels[context.dataIndex];
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.1
                }
            },
            animation: {
                duration: 2000,
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
        console.log('✅ New spider web radar chart created successfully');
        
        ctx.style.filter = 'drop-shadow(0 0 15px rgba(57, 255, 20, 0.4))';
        
        updateCenterStats(stats);
        
    } catch (error) {
        console.error('❌ Error creating new radar chart:', error);
    }
}

function updateCenterStats(stats) {
    const centerValue = document.querySelector('.center-value');
    const centerLabel = document.querySelector('.center-label');
    
    if (centerValue && centerLabel) {
        centerValue.textContent = `${stats.years}+`;
        centerLabel.textContent = 'года опыта';
    }
}

// Utility functions
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function getRadarChartInstance() {
    return radarChartInstance;
}

export function refreshRadarChart() {
    if (radarChartInstance) {
        radarChartInstance.update();
    }
}

// Debug function to check data paths
export async function debugDataPaths() {
    console.log('🔍 Debugging data paths...');
    
    const paths = [
        './data/games.json',
        './data/movies.json', 
        './data/stats.json',
        './data/schedule.json',
        'data/games.json',
        'data/movies.json',
        'data/stats.json', 
        'data/schedule.json'
    ];
    
    for (const path of paths) {
        try {
            const response = await fetch(path);
            console.log(`${path}: ${response.ok ? '✅ OK' : '❌ Failed'}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   Data sample:`, Array.isArray(data) ? data.slice(0, 2) : data);
            }
        } catch (error) {
            console.log(`${path}: ❌ Error - ${error.message}`);
        }
    }
}
