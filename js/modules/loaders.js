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

// Load statistics with NEW Radar Chart
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
            streams: 154,
            hours: 1000,
            years: 3,
            chatActivity: 280,
            loyalty: 95,
            gamesVariety: 25
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

// NEW RADAR CHART - COMPLETELY REBUILT FOR SPIDER WEB STYLE
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
    
    console.log('📊 Creating new spider web radar chart with data:', normalizedData);
    
    // NEW SPIDER WEB RADAR CHART CONFIGURATION
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
        
        // Add glow effect to canvas
        ctx.style.filter = 'drop-shadow(0 0 15px rgba(57, 255, 20, 0.4))';
        
        // Update center stats
        updateCenterStats(stats);
        
    } catch (error) {
        console.error('❌ Error creating new radar chart:', error);
        
        // Fallback to simple bar chart if radar fails
        createFallbackBarChart(stats, maxValues);
    }
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

// Update stats cards with actual data
function updateStatsCards(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    if (statCards.length === 6) {
        // Followers card
        statCards[0].querySelector('h3').textContent = `${(stats.followers / 1000).toFixed(1)}K+`;
        statCards[0].querySelector('p').textContent = 'Подписчиков на Twitch';
        
        // Streams card
        statCards[1].querySelector('h3').textContent = stats.streams.toLocaleString();
        statCards[1].querySelector('p').textContent = 'Проведенных стримов';
        
        // Hours card
        statCards[2].querySelector('h3').textContent = `${stats.hours.toLocaleString()}+`;
        statCards[2].querySelector('p').textContent = 'Часов контента';
        
        // Chat activity card
        statCards[3].querySelector('h3').textContent = `${stats.chatActivity}/ч`;
        statCards[3].querySelector('p').textContent = 'Активность в чате';
        
        // Loyalty card
        statCards[4].querySelector('h3').textContent = `${stats.loyalty}%`;
        statCards[4].querySelector('p').textContent = 'Лояльность аудитории';
        
        // Games variety card
        statCards[5].querySelector('h3').textContent = `${stats.gamesVariety}+`;
        statCards[5].querySelector('p').textContent = 'Разных игр показано';
    }
}

// FALLBACK BAR CHART if radar fails
function createFallbackBarChart(stats, maxValues) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    
    const percentages = {
        followers: Math.round((stats.followers / maxValues.followers) * 100),
        streams: Math.round((stats.streams / maxValues.streams) * 100),
        hours: Math.round((stats.hours / maxValues.hours) * 100),
        chatActivity: Math.round((stats.chatActivity / maxValues.chatActivity) * 100),
        loyalty: Math.round((stats.loyalty / maxValues.loyalty) * 100),
        gamesVariety: Math.round((stats.gamesVariety / maxValues.gamesVariety) * 100)
    };
    
    const config = {
        type: 'bar',
        data: {
            labels: ['Подписчики', 'Стримы', 'Часы', 'Чат', 'Лояльность', 'Игры'],
            datasets: [{
                label: 'Прогресс (%)',
                data: [
                    percentages.followers,
                    percentages.streams,
                    percentages.hours,
                    percentages.chatActivity,
                    percentages.loyalty,
                    percentages.gamesVariety
                ],
                backgroundColor: [
                    'rgba(57, 255, 20, 0.8)',
                    'rgba(255, 45, 149, 0.8)',
                    'rgba(64, 181, 246, 0.8)',
                    'rgba(255, 215, 0, 0.8)',
                    'rgba(156, 39, 176, 0.8)',
                    'rgba(33, 150, 243, 0.8)'
                ],
                borderColor: [
                    '#39ff14',
                    '#ff2d95',
                    '#64b5f6',
                    '#ffd700',
                    '#9c27b0',
                    '#2196f3'
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

// Add animation to stats cards
function animateStatsCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Initialize stats section animations
function initStatsAnimations() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatsCards();
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(statsSection);
}

// Enhanced error handling with retry mechanism
async function loadDataWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${url}?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Attempt ${attempt} failed for ${url}:`, error);
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
    }
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

// Initialize stats animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initStatsAnimations();
    }, 1000);
});

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

// Performance monitoring
export function monitorPerformance() {
    if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            console.log('🚀 Page load performance:', {
                'DOM Content Loaded': `${navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart}ms`,
                'Full Load': `${navigationTiming.loadEventEnd - navigationTiming.navigationStart}ms`
            });
        }
    }
}
