import { DOM, Api, Time, NumberUtils } from '../utils/helpers.js';
import { STATS_CONFIG, MESSAGES } from '../utils/constants.js';

export class StatsManager {
    constructor(containerId) {
        this.container = DOM.getElement(containerId);
        this.statsData = null;
        this.updateInterval = null;
    }

    async init() {
        if (!this.container) {
            console.error('Stats container not found:', this.container);
            return;
        }

        await this.loadStats();
        this.render();
        this.startAutoUpdate();
        
        console.log('📈 StatsManager initialized successfully');
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

        // Обновление времени последнего посещения
        if (!this.statsData.lastVisit) {
            this.statsData.lastVisit = new Date().toISOString();
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
            lastVisit: new Date().toISOString(),
            streamDuration: 0
        };
    }

    render() {
        if (!this.container || !this.statsData) return;

        DOM.setHTML(this.container, this.createStatsHTML());
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
        const lastStream = Time.formatDate(this.statsData.lastStream);
        const duration = Time.formatDuration(this.statsData.streamDuration);
        const lastVisit = Time.formatDate(this.statsData.lastVisit);
        
        return `
            <div class="stat-item stream-info">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">${lastStream}</div>
                    <div class="stat-label">Последний стрим (${duration})</div>
                    <div class="stat-sublabel">Последнее посещение: ${lastVisit}</div>
                </div>
            </div>
        `;
    }

    animateCounters() {
        const counters = this.container.querySelectorAll('[data-value]');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-value'));
            const step = target / (STATS_CONFIG.animationDuration / 16);
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current >= target) {
                    counter.textContent = NumberUtils.formatNumber(target);
                } else {
                    counter.textContent = NumberUtils.formatNumber(Math.floor(current));
                    requestAnimationFrame(updateCounter);
                }
            };

            updateCounter();
        });
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

    refresh() {
        this.loadStats().then(() => this.render());
    }

    destroy() {
        this.stopAutoUpdate();
    }
}
