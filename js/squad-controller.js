/* js/squad-controller.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { Typewriter } from './utils/Typewriter.js'; // Подключаем наш новый модуль

export class SquadController {
    constructor() {
        this.squadPanel = document.getElementById('squad-panel');
        if (!this.squadPanel) return;

        this.els = {
            listContainer: this.squadPanel.querySelector('.squad-list'),
            closeDetailBtn: this.squadPanel.querySelector('.close-detail-btn'),
            detailView: this.squadPanel.querySelector('.squad-detail-view'),
            detailName: this.squadPanel.querySelector('.detail-name'),
            detailDescription: this.squadPanel.querySelector('.detail-description')
        };
        
        this.detailAvatarContainer = this.setupAvatarContainer();
        
        // Инициализируем печатную машинку
        this.typewriter = new Typewriter(this.els.detailDescription);
        
        this.squadData = {};
        this.init();
    }

    async init() {
        try {
            const rawData = await loadData('squad.json', []);
            
            rawData.forEach(member => {
                this.squadData[member.id] = member;
            });

            this.renderSquadList(rawData);
            this.bindEvents();
            
        } catch (e) {
            console.error('❌ [SquadController] Ошибка рендера отряда', e);
        }
    }

    renderSquadList(members) {
        if (!this.els.listContainer) return;
        
        // Маппинг ролей для чистоты кода
        const roleIcons = {
            'bagerka': { class: 'tech', icon: 'fa-code' },
            'angel': { class: 'support', icon: 'fa-star' },
            'kiriki': { class: 'fun', icon: 'fa-music' },
            'default': { class: '', icon: 'fa-user' }
        };

        this.els.listContainer.innerHTML = members.map(m => {
            const role = roleIcons[m.id] || roleIcons['default'];
            const avatarContent = m.type === 'image' 
                ? `<img src="${m.content}" alt="${m.name}">` 
                : `<i class="${m.content}"></i>`;

            return `
                <div class="squad-member" data-member="${m.id}">
                    <div class="avatar-wrapper">
                        <div class="squad-avatar" style="border-color: ${m.color}; box-shadow: 0 0 10px ${m.color}">
                            ${avatarContent}
                        </div>
                        <div class="role-badge ${role.class}"><i class="fas ${role.icon}"></i></div>
                    </div>
                    <span class="squad-name">${m.name}</span>
                </div>
            `;
        }).join('');
    }

    setupAvatarContainer() {
        if (!this.els.detailView) return null;
        let container = this.els.detailView.querySelector('.detail-avatar-container');
        
        // Миграция старой верстки, если она осталась в HTML
        if (!container) {
            const oldImg = this.els.detailView.querySelector('.detail-avatar');
            if (oldImg) {
                container = document.createElement('div');
                container.className = 'detail-avatar-container';
                oldImg.parentNode.insertBefore(container, oldImg);
                oldImg.remove();
            }
        }
        return container;
    }

    bindEvents() {
        if (!this.els.listContainer) return;

        this.els.listContainer.addEventListener('click', (e) => {
            const memberEl = e.target.closest('.squad-member');
            if (memberEl) {
                EventBus.emit('PLAY_SOUND', 'click');
                const data = this.squadData[memberEl.dataset.member];
                if (data) this.openDetail(data);
            }
        });

        if (this.els.closeDetailBtn) {
            this.els.closeDetailBtn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.closeDetail();
            });
        }
    }

    openDetail(data) {
        if (!this.detailAvatarContainer) return;

        this.detailAvatarContainer.style.borderColor = data.color;
        this.detailAvatarContainer.style.boxShadow = `0 0 15px ${data.color}`;
        this.detailAvatarContainer.style.color = data.color;

        this.detailAvatarContainer.innerHTML = data.type === 'image' 
            ? `<img src="${data.content}" alt="${data.name}">`
            : `<i class="${data.content}" style="text-shadow: 0 0 10px ${data.color}"></i>`;

        if (this.els.detailName) {
            this.els.detailName.textContent = data.name;
            this.els.detailName.style.color = data.color;
        }

        // Запускаем нашу новую печатную машинку
        this.typewriter.type(data.description);
        
        this.squadPanel.classList.add('expanded');
    }

    closeDetail() {
        this.squadPanel.classList.remove('expanded');
        this.typewriter.stop(); // Останавливаем машинку, если она не допечатала
    }
}