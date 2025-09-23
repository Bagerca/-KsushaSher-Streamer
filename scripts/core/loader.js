import { DOM, Api } from '../utils/helpers.js';
import { MESSAGES, CSS_CLASSES } from '../utils/constants.js';

export class DataLoader {
    static async loadAllData() {
        console.log('📦 Loading all application data...');
        
        try {
            const [games, movies, stats, schedule] = await Promise.all([
                this.loadGames(),
                this.loadMovies(),
                this.loadStats(),
                this.loadSchedule()
            ]);

            console.log('✅ All data loaded successfully');
            return { games, movies, stats, schedule };

        } catch (error) {
            console.error('❌ Error loading application data:', error);
            throw error;
        }
    }

    static async loadGames() {
        try {
            const games = await Api.fetchData('/data/games.json');
            console.log('🎮 Loaded games:', games.length);
            return games || [];
        } catch (error) {
            console.warn('Could not load games, using empty array');
            return [];
        }
    }

    static async loadMovies() {
        try {
            const movies = await Api.fetchData('/data/movies.json');
            console.log('🎬 Loaded movies:', movies.length);
            return movies || [];
        } catch (error) {
            console.warn('Could not load movies, using empty array');
            return [];
        }
    }

    static async loadStats() {
        try {
            const stats = await Api.fetchData('/data/stats.json');
            console.log('📊 Loaded stats');
            return stats || {};
        } catch (error) {
            console.warn('Could not load stats, using default');
            return this.getDefaultStats();
        }
    }

    static async loadSchedule() {
        try {
            const schedule = await Api.fetchData('/data/schedule.json');
            console.log('📅 Loaded schedule');
            return schedule || {};
        } catch (error) {
            console.warn('Could not load schedule, using default');
            return { schedule: [] };
        }
    }

    static getDefaultStats() {
        return {
            followers: 0,
            subscribers: 0,
            totalViews: 0,
            totalVisits: 1,
            lastStream: new Date().toISOString(),
            streamDuration: 0
        };
    }

    static showLoading(container) {
        if (container) {
            DOM.setHTML(container, `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>${MESSAGES.loading}</p>
                </div>
            `);
            DOM.addClass(container, CSS_CLASSES.loading);
        }
    }

    static hideLoading(container) {
        if (container) {
            DOM.removeClass(container, CSS_CLASSES.loading);
        }
    }

    static showError(container, message = MESSAGES.error) {
        if (container) {
            DOM.setHTML(container, `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <p>${message}</p>
                    <button class="retry-btn">Попробовать снова</button>
                </div>
            `);
        }
    }
}
