/* js/squad-controller.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';
import { AgentCard } from './components/AgentCard.js';
import { AppRouter } from './router.js';
import { AppStore } from './store.js';

export class SquadController {
    constructor() {
        this.squadPanel = document.getElementById('squad-panel');
        if (!this.squadPanel) return;

        this.els = {
            listContainer: this.squadPanel.querySelector('.squad-list')
            // Убрали ссылки на старые detailView, так как они нам больше не нужны
        };
        
        this.squadData = {};
        this.init();
    }

    async init() {
        try {
            const allSubs = await loadData('subscribers.json', []);
            const targetIds = AppConfig.identity.squadMembers || [];

            const squadMembers = targetIds
                .map(id => allSubs.find(sub => sub.id === id))
                .filter(Boolean); 

            squadMembers.forEach(member => {
                this.squadData[member.id] = member;
            });

            this.renderSquadList(squadMembers);
            this.bindEvents();
            
            AppStore.dispatch({ type: 'DATA_SET_AGENTS', payload: allSubs });
            
        } catch (e) {
            console.error('❌ [SquadController] Ошибка рендера отряда', e);
        }
    }

    renderSquadList(members) {
        if (!this.els.listContainer) return;
        
        this.els.listContainer.dataset.count = members.length;
        
        let html = members.map(m => {
            const safeColor = AgentCard.getRoleColor(m.color);
            
            const avatarContent = m.avatarPath 
                ? `<img src="${m.avatarPath}" alt="${m.name}" onerror="this.outerHTML='<i class=\\'${m.mainIcon || 'fas fa-user'}\\'></i>'">` 
                : `<i class="${m.mainIcon || 'fas fa-user'}"></i>`;

            const displayName = m.squadName || m.name;
            const { level } = AgentCard.calculateLevelData(m.createdAt);

            return `
                <div class="squad-member" data-member="${m.id}" style="--m-color: ${safeColor};">
                    <div class="avatar-wrapper">
                        <div class="squad-avatar">
                            ${avatarContent}
                        </div>
                        <div class="role-badge"><i class="${m.typeIcon || 'fas fa-star'}"></i></div>
                    </div>
                    <div class="squad-info-hud">
                        <span class="squad-name" title="${displayName}">${displayName}</span>
                        <div class="squad-tags">
                            <span class="squad-lvl">LVL.${level}</span>
                            <span class="squad-subrole">${m.role || 'АГЕНТ'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.els.listContainer.innerHTML = html;
    }

    bindEvents() {
        if (!this.els.listContainer) return;

        this.els.listContainer.addEventListener('click', (e) => {
            const memberEl = e.target.closest('.squad-member');
            if (memberEl) {
                EventBus.emit('PLAY_SOUND', 'expand');
                // Перенаправляем на новую полноэкранную страницу Агентов
                AppRouter.navigate('/agents', { id: memberEl.dataset.member });
            }
        });
    }
}