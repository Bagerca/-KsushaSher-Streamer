import { DOM, Api, Time } from '../utils/helpers.js';
import { MESSAGES, CSS_CLASSES } from '../utils/constants.js';

export class ScheduleManager {
    constructor(containerId) {
        this.container = DOM.getElement(containerId);
        this.schedule = [];
        this.isLoading = false;
    }

    async init() {
        if (!this.container) {
            console.error('Schedule container not found:', this.container);
            return;
        }

        await this.loadSchedule();
        this.render();
        
        console.log('📅 ScheduleManager initialized successfully');
    }

    async loadSchedule() {
        this.setLoading(true);

        try {
            const data = await Api.fetchData('/data/schedule.json');
            this.schedule = data.schedule || [];
            console.log('Loaded schedule items:', this.schedule.length);
        } catch (error) {
            console.error('Error loading schedule:', error);
            this.schedule = [];
        }

        this.setLoading(false);
    }

    setLoading(loading) {
        this.isLoading = loading;
        if (this.container) {
            if (loading) {
                DOM.addClass(this.container, CSS_CLASSES.loading);
            } else {
                DOM.removeClass(this.container, CSS_CLASSES.loading);
            }
        }
    }

    render() {
        if (!this.container) return;

        if (this.isLoading) {
            DOM.setHTML(this.container, this.createLoadingHTML());
            return;
        }

        if (this.schedule.length === 0) {
            DOM.setHTML(this.container, this.createEmptyHTML());
            return;
        }

        DOM.setHTML(this.container, this.createScheduleHTML());
    }

    createLoadingHTML() {
        return `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${MESSAGES.loading}</p>
            </div>
        `;
    }

    createEmptyHTML() {
        return `
            <div class="empty-state">
                <p>${MESSAGES.noData}</p>
                <p>Расписание пока не настроено</p>
            </div>
        `;
    }

    createScheduleHTML() {
        const scheduleHTML = this.schedule.map(item => `
            <div class="schedule-item ${item.status}" data-id="${item.id}">
                <div class="schedule-day">${item.day}</div>
                <div class="schedule-time">${item.time}</div>
                <div class="schedule-content">
                    <h4 class="schedule-game">${item.game}</h4>
                    ${item.description ? `<p class="schedule-description">${item.description}</p>` : ''}
                </div>
                <div class="schedule-status ${item.status}">
                    <span class="status-indicator"></span>
                    ${this.getStatusText(item.status)}
                </div>
            </div>
        `).join('');

        return `
            <div class="schedule-grid">
                ${scheduleHTML}
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'planned': 'Запланирован',
            'confirmed': 'Подтвержден',
            'live': 'В прямом эфире',
            'cancelled': 'Отменен',
            'completed': 'Завершен'
        };
        return statusMap[status] || status;
    }

    getUpcomingStreams() {
        const now = new Date();
        return this.schedule.filter(item => {
            return item.status === 'planned' || item.status === 'confirmed';
        });
    }

    getLiveStream() {
        return this.schedule.find(item => item.status === 'live');
    }

    async refresh() {
        await this.loadSchedule();
        this.render();
    }

    destroy() {
        // Cleanup if needed
    }
}
