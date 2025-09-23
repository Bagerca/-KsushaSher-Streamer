import { DOM, Api } from '../utils/helpers.js';
import { STATS_CONFIG } from '../utils/constants.js';

export class StatsManager {
    constructor(containerId) {
        this.container = DOM.getElement(containerId);
        this.statsData = null;
        this.updateInterval = null;
    }

    async init() {
        await this.loadStats();
        this.render();
        this.startAutoUpdate();
    }

    async loadStats() {
        try {
            this.statsData = await Api.fetchData('/data/stats.json');
            this.updateLocalStats();
        } catch (error) {
            console.error('Error loading stats:', error);
            this.statsData = this.getDefaultStats();
        }
    }

    updateLocalStats() {
        if (!this.statsData) return;

        // Обновление времени последнего стрима
        if (!this.statsData.lastStream) {
            this.statsData.lastStream = new Date().toISOString();
        }

        // Инкремент счетчика посещений
        this.statsData.totalVisits = (this.statsData.totalVisits || 0) + 1;
        
        this.saveStats();
    }

    getDefaultStats() {
        return {
            followers: 0,
            subscribers: 0,
            totalViews: 0,
            totalVisits: 1,
            lastStream: new Date().toISOString(),
            streamDuration: 0
        };
    }

    render() {
        if (!this.container || !this.statsData) return;

        this.container.innerHTML = this.createStatsHTML();
        this.animateCounters();
    }

    createStatsHTML() {
        return `
            <div class="stats-grid">
                ${this.createStatItem('followers', 'Подписчики', '👥')}
                ${this.createStatItem('subscribers', 'Сабскрайберы', '⭐')}
                ${this.createStatItem('totalViews', 'Просмотры', '👀')}
                ${this.createStatItem('totalVisits', 'Посещения сайта', '🌐')}
                ${this.createStreamInfo()}
            </div>
        `;
    }

    createStatItem(key, label, icon) {
        const value = this.statsData[key] || 0;
        return `
            <div class="stat-item" data-stat="${key}">
                <div class="stat-icon">${icon}</div>
                <div class="stat-content">
                    <div class="stat-value" data-value="${value}">0</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
    }

    createStreamInfo() {
        const lastStream = this.formatDate(this.statsData.lastStream);
        const duration = this.formatDuration(this.statsData.streamDuration);
        
        return `
            <div class="stat-item stream-info">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">${lastStream}</div>
                    <div class="stat-label">Последний стрим (${duration})</div>
                </div>
            </div>
        `;
    }

    animateCounters() {
        const counters = this.container.querySelectorAll('[data-value]');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-value'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current >= target) {
                    counter.textContent = this.formatNumber(target);
                } else {
                    counter.textContent = this.formatNumber(Math.floor(current));
                    requestAnimationFrame(updateCounter);
                }
            };

            updateCounter();
        });
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
    }

    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.loadStats().then(() => this.render());
        }, STATS_CONFIG.updateInterval);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    async saveStats() {
        try {
            await Api.saveData('/data/stats.json', this.statsData);
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    updateStats(newStats) {
        this.statsData = { ...this.statsData, ...newStats };
        this.render();
        this.saveStats();
    }

    destroy() {
        this.stopAutoUpdate();
    }
}
