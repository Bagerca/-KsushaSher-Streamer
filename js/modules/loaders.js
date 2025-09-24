// Data loading functionality with Radar Chart support
import { renderSchedule } from './renderers.js';

// State variables
export let gamesLoaded = false;
export let moviesLoaded = false;
export let currentGamesData = [];
export let currentMoviesData = [];

// Chart.js instance
let radarChartInstance = null;

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
        const response = await fetch('data/games.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Ошибка загрузки');
        
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
        console.error('Ошибка загрузки игр:', error);
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
        const response = await fetch('data/movies.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Ошибка загрузки');
        
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
        console.error('Ошибка загрузки фильмов:', error);
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

// Load statistics with Radar Chart
export async function loadStats() {
    try {
        // Wait for Chart.js to load
        await loadChartJS();
        
        const response = await fetch('data/stats.json?' + new Date().getTime());
        const stats = await response.json();
        
        console.log('📈 Stats data loaded:', stats);
        createRadarChart(stats);
    } catch (error) {
        console.log('📊 Using default stats data');
        createRadarChart({
            followers: 5200,
            streams: 150,
            hours: 250,
            years: 3
        });
    }
}

// Create beautiful radar chart
function createRadarChart(stats) {
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
    
    console.log('📊 Normalized data:', normalizedData);
    
    const chartData = {
        labels: ['Подписчики', 'Кол-во стримов', 'Часы контента', 'Года в стриминге'],
        datasets: [{
            label: 'Текущие показатели',
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
            pointBorderColor: '#070711',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 10,
            pointHoverBackgroundColor: '#ff2d95',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3
        }, {
            label: 'Целевые показатели',
            data: [80, 80, 80, 80], // Target line at 80%
            backgroundColor: 'rgba(255, 45, 149, 0.1)',
            borderColor: 'rgba(255, 45, 149, 0.6)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: 'transparent',
            pointBorderColor: 'transparent',
            pointRadius: 0,
            fill: false
        }]
    };
    
    const config = {
        type: 'radar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.15)',
                        lineWidth: 1
                    },
                    grid: {
                        color: 'rgba(255, 45, 149, 0.2)',
                        circular: true
                    },
                    pointLabels: {
                        color: '#ccc',
                        font: {
                            size: 14,
                            weight: '600',
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        callback: function(value, index) {
                            const labels = ['Подписчики', 'Стримы', 'Часы', 'Опыт'];
                            return labels[index];
                        }
                    },
                    ticks: {
                        display: false,
                        backdropColor: 'transparent',
                        maxTicksLimit: 5
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(7, 7, 17, 0.9)',
                    titleColor: '#39ff14',
                    bodyColor: '#ccc',
                    borderColor: '#ff2d95',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const index = context.dataIndex;
                            const actualValues = [stats.followers, stats.streams, stats.hours, stats.years];
                            const maxValuesArr = [maxValues.followers, maxValues.streams, maxValues.hours, maxValues.years];
                            const labels = ['Подписчики', 'Стримы', 'Часы контента', 'Года в стриминге'];
                            
                            if (context.datasetIndex === 0) {
                                return [
                                    `${labels[index]}: ${actualValues[index].toLocaleString()}`,
                                    `Прогресс: ${Math.round(context.parsed.r)}% от цели`,
                                    `Цель: ${maxValuesArr[index].toLocaleString()}`
                                ];
                            }
                            return `Целевой уровень: ${context.parsed.r}%`;
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
                duration: 2000,
                easing: 'easeOutQuart',
                onProgress: function(animation) {
                    // Add glow effect during animation
                    if (animation.currentStep <= animation.numSteps) {
                        const progress = animation.currentStep / animation.numSteps;
                        ctx.style.filter = `drop-shadow(0 0 ${10 + progress * 10}px rgba(57, 255, 20, ${0.3 + progress * 0.3}))`;
                    }
                },
                onComplete: function() {
                    // Final glow effect
                    ctx.style.filter = 'drop-shadow(0 0 15px rgba(57, 255, 20, 0.4))';
                    console.log('🎉 Radar chart animation completed');
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            hover: {
                animationDuration: 300
            }
        }
    };
    
    try {
        // Create new chart
        radarChartInstance = new Chart(ctx, config);
        console.log('✅ Radar chart created successfully');
        
        // Create custom legend
        createLegend(stats, maxValues);
        
        // Add resize observer for responsive behavior
        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                if (radarChartInstance) {
                    radarChartInstance.resize();
                    console.log('📏 Radar chart resized');
                }
            });
        });
        
        resizeObserver.observe(ctx.parentElement);
        
    } catch (error) {
        console.error('❌ Error creating radar chart:', error);
    }
}

// Create custom legend
function createLegend(stats, maxValues) {
    const legendContainer = document.getElementById('radarLegend');
    if (!legendContainer) {
        console.error('❌ Legend container not found');
        return;
    }
    
    const legendItems = [
        { 
            label: 'Подписчиков', 
            value: stats.followers, 
            max: maxValues.followers, 
            color: '#39ff14',
            icon: '👥'
        },
        { 
            label: 'Стримов', 
            value: stats.streams, 
            max: maxValues.streams, 
            color: '#ff2d95',
            icon: '📡'
        },
        { 
            label: 'Часов контента', 
            value: stats.hours, 
            max: maxValues.hours, 
            color: '#64B5F6',
            icon: '⏰'
        },
        { 
            label: 'Лет в стриминге', 
            value: stats.years, 
            max: maxValues.years, 
            color: '#FFD700',
            icon: '⭐'
        }
    ];
    
    const progressPercentages = legendItems.map(item => Math.round((item.value / item.max) * 100));
    
    legendContainer.innerHTML = legendItems.map((item, index) => `
        <div class="legend-item" data-progress="${progressPercentages[index]}">
            <span class="legend-color" style="color: ${item.color}"></span>
            <span class="legend-icon">${item.icon}</span>
            <span class="legend-text">
                ${item.label}: 
                <strong>${item.value.toLocaleString()}</strong> 
                <span class="legend-progress">(${progressPercentages[index]}%)</span>
            </span>
        </div>
    `).join('');
    
    console.log('📋 Legend created with', legendItems.length, 'items');
}

// Load schedule
export async function loadSchedule() {
    try {
        const response = await fetch('data/schedule.json?' + new Date().getTime());
        const data = await response.json();
        
        // Use renderers to display schedule
        const renderers = await import('./renderers.js');
        renderers.renderSchedule(data.schedule);
        
        console.log('📅 Schedule loaded successfully');
    } catch (error) {
        console.log('⏰ Schedule will be loaded later');
        const scheduleList = document.getElementById('schedule-list');
        if (scheduleList) {
            scheduleList.innerHTML = `
                <div class="schedule-item">
                    <div class="schedule-content">
                        <div class="schedule-game">📅 Расписание временно недоступно</div>
                        <div class="schedule-desc">Обновляем данные...</div>
                    </div>
                </div>
            `;
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

// Function to update radar chart with new data
export function updateRadarChart(newStats) {
    if (radarChartInstance) {
        // Update the data
        const maxValues = {
            followers: 10000,
            streams: 500,
            hours: 1000,
            years: 10
        };
        
        const normalizedData = {
            followers: Math.min((newStats.followers / maxValues.followers) * 100, 100),
            streams: Math.min((newStats.streams / maxValues.streams) * 100, 100),
            hours: Math.min((newStats.hours / maxValues.hours) * 100, 100),
            years: Math.min((newStats.years / maxValues.years) * 100, 100)
        };
        
        radarChartInstance.data.datasets[0].data = [
            Math.round(normalizedData.followers),
            Math.round(normalizedData.streams),
            Math.round(normalizedData.hours),
            Math.round(normalizedData.years)
        ];
        
        radarChartInstance.update('active');
        createLegend(newStats, maxValues);
        
        console.log('🔄 Radar chart updated with new data');
    }
}
