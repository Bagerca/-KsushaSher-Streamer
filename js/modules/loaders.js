// Data loading functionality
import { renderSchedule } from './renderers.js';

// State variables
export let gamesLoaded = false;
export let moviesLoaded = false;
export let currentGamesData = [];
export let currentMoviesData = [];

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
    
    // Set up intersection observer for stats
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadStats();
                    
                    // Animate cards when they become visible
                    const statNumbers = document.querySelectorAll('.stat-number');
                    if (statNumbers.length > 0 && statNumbers[0].textContent === '0') {
                        setTimeout(() => {
                            statNumbers.forEach((el, index) => {
                                const card = el.closest('.stat-card');
                                const endValue = parseInt(card.getAttribute('data-value') || el.textContent);
                                animateModernValue(el, 0, endValue, 2000);
                            });
                        }, 500);
                    }
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

// Load statistics
export async function loadStats() {
    try {
        const response = await fetch('data/stats.json?' + new Date().getTime());
        const stats = await response.json();
        updateStats(stats);
    } catch (error) {
        console.log('Статистика будет загружена позже');
        // Use default values if stats file is not available
        updateStats({
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
        const response = await fetch('data/schedule.json?' + new Date().getTime());
        const data = await response.json();
        
        // Use renderers to display schedule
        const renderers = await import('./renderers.js');
        renderers.renderSchedule(data.schedule);
    } catch (error) {
        console.log('Расписание будет загружено позже');
        // Show default schedule message
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

// Update statistics display with modern cards
function updateStats(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    // Stats values in correct order
    const values = [
        stats.followers || 5200,
        stats.streams || 150, 
        stats.hours || 250,
        stats.years || 3
    ];
    
    statCards.forEach((card, index) => {
        const value = values[index];
        const numberElement = card.querySelector('.stat-number');
        
        // Add data attribute for animation
        card.setAttribute('data-value', value);
        
        // Delay for sequential animation
        setTimeout(() => {
            animateModernValue(numberElement, 0, value, 1800);
            numberElement.classList.add('animating');
            
            setTimeout(() => {
                numberElement.classList.remove('animating');
            }, 600);
        }, index * 400); // Increased delay for better visual effect
    });
}

// Enhanced number animation with formatting
function animateModernValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const value = Math.floor(easeOutQuart * (end - start) + start);
        
        // Format large numbers
        element.textContent = formatNumber(value);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Format numbers with spaces for thousands
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Also update the existing animateValue function for consistency (if used elsewhere)
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = formatNumber(value);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Export the new animation function for use in other modules
export { animateModernValue, formatNumber };
