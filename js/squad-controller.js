/* js/squad-controller.js */
import { loadData } from './api.js';

export class SquadController {
    constructor() {
        this.squadPanel = document.getElementById('squad-panel');
        if (!this.squadPanel) return;

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
        // Загружаем данные из JSON
        const rawData = await loadData('squad.json', []);
        
        // Преобразуем массив в объект для быстрого доступа по ID
        rawData.forEach(member => {
            this.squadData[member.id] = member;
        });

        this.bindEvents();
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
        const squadMembers = this.squadPanel.querySelectorAll('.squad-member');
        
        squadMembers.forEach(member => {
            member.addEventListener('click', () => {
                const memberId = member.dataset.member;
                const data = this.squadData[memberId];
                if (data) this.openDetail(data);
            });
        });

        if (this.closeDetailBtn) {
            this.closeDetailBtn.addEventListener('click', () => this.closeDetail());
        }
    }

    openDetail(data) {
        if (!this.detailAvatarContainer) return;

        // 1. Настройка стилей контейнера
        this.detailAvatarContainer.style.borderColor = data.color;
        this.detailAvatarContainer.style.boxShadow = `0 0 15px ${data.color}`;
        this.detailAvatarContainer.style.color = data.color;

        // 2. Вставка картинки/иконки
        if (data.type === 'image') {
            this.detailAvatarContainer.innerHTML = `<img src="${data.content}" alt="${data.name}">`;
        } else {
            this.detailAvatarContainer.innerHTML = `<i class="${data.content}" style="text-shadow: 0 0 10px ${data.color}"></i>`;
        }

        // 3. Текст
        if (this.detailName) {
            this.detailName.textContent = data.name;
            this.detailName.style.color = data.color;
        }

        // 4. Анимация печати
        this.runTypewriter(data.description);

        // 5. Показ панели
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