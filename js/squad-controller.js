/* js/squad-controller.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';

export class SquadController {
    constructor() {
        this.squadPanel = document.getElementById('squad-panel');
        if (!this.squadPanel) return;

        this.squadListContainer = this.squadPanel.querySelector('.squad-list');
        this.closeDetailBtn = this.squadPanel.querySelector('.close-detail-btn');
        this.detailView = this.squadPanel.querySelector('.squad-detail-view');
        this.detailName = this.detailView?.querySelector('.detail-name');
        this.detailDescription = this.detailView?.querySelector('.detail-description');
        
        this.detailAvatarContainer = this.setupAvatarContainer();
        this.typewriterTimeout = null;
        this.squadData = {};

        this.init();
    }

    async init() {
        try {
            // Загружаем данные из JSON
            const rawData = await loadData('squad.json', []);
            
            // Преобразуем массив в объект и генерируем HTML
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
        if (!this.squadListContainer) return;
        
        // Автоматически строим иконки ролей (по цветам)
        const getRoleIcon = (id) => {
            if (id === 'bagerka') return '<div class="role-badge tech"><i class="fas fa-code"></i></div>';
            if (id === 'angel') return '<div class="role-badge support"><i class="fas fa-star"></i></div>';
            if (id === 'kiriki') return '<div class="role-badge fun"><i class="fas fa-music"></i></div>';
            return '<div class="role-badge"><i class="fas fa-user"></i></div>';
        };

        this.squadListContainer.innerHTML = members.map(m => `
            <div class="squad-member" data-member="${m.id}">
                <div class="avatar-wrapper">
                    <div class="squad-avatar" style="border-color: ${m.color}; box-shadow: 0 0 10px ${m.color}">
                        ${m.type === 'image' ? `<img src="${m.content}" alt="${m.name}">` : `<i class="${m.content}"></i>`}
                    </div>
                    ${getRoleIcon(m.id)}
                </div>
                <span class="squad-name">${m.name}</span>
            </div>
        `).join('');
    }

    setupAvatarContainer() {
        if (!this.detailView) return null;
        let container = this.detailView.querySelector('.detail-avatar-container');
        
        if (!container) {
            const oldImg = this.detailView.querySelector('.detail-avatar');
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
        if (!this.squadListContainer) return;

        // Делегирование событий (один слушатель на весь контейнер)
        this.squadListContainer.addEventListener('click', (e) => {
            const memberEl = e.target.closest('.squad-member');
            if (memberEl) {
                EventBus.emit('PLAY_SOUND', 'click');
                const memberId = memberEl.dataset.member;
                const data = this.squadData[memberId];
                if (data) this.openDetail(data);
            }
        });

        if (this.closeDetailBtn) {
            this.closeDetailBtn.addEventListener('click', () => {
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

        if (data.type === 'image') {
            this.detailAvatarContainer.innerHTML = `<img src="${data.content}" alt="${data.name}">`;
        } else {
            this.detailAvatarContainer.innerHTML = `<i class="${data.content}" style="text-shadow: 0 0 10px ${data.color}"></i>`;
        }

        if (this.detailName) {
            this.detailName.textContent = data.name;
            this.detailName.style.color = data.color;
        }

        this.runTypewriter(data.description);
        this.squadPanel.classList.add('expanded');
    }

    closeDetail() {
        this.squadPanel.classList.remove('expanded');
        clearTimeout(this.typewriterTimeout);
    }

    runTypewriter(text, speed = 40) {
        if (!this.detailDescription) return;
        clearTimeout(this.typewriterTimeout);
        
        this.detailDescription.innerHTML = "";
        let i = 0;
        
        const type = () => {
            if (i < text.length) {
                this.detailDescription.innerHTML += text.charAt(i);
                i++;
                this.typewriterTimeout = setTimeout(type, speed);
            } else {
                this.detailDescription.innerHTML = this.detailDescription.innerHTML.replace('|', ''); 
            }
        };
        type();
    }
}