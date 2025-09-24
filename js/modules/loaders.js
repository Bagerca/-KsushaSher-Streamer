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
                    const statNumbers = document.querySelectorAll('.stat-number');
                    if (statNumbers.length > 0 && statNumbers[0].textContent === '0') {
                        statNumbers.forEach((el, index) => {
                            const endValue = parseInt(el.getAttribute('data-value') || el.textContent);
                            animateValue(el, 0, endValue, 2000);
                        });
                    }
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });
        
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
    }
}

// Update statistics display
function updateStats(stats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        animateValue(statNumbers[0], 0, stats.followers || 5200, 2000);
        animateValue(statNumbers[1], 0, stats.streams || 150, 2000);
        animateValue(statNumbers[2], 0, stats.hours || 250, 2000);
        animateValue(statNumbers[3], 0, stats.years || 3, 2000);
    }
}

// Animate counting numbers
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
