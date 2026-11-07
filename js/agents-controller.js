/* js/agents-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { AgentCard } from './components/AgentCard.js';
import { loadData } from './api.js';
import { optimizeImageUrl } from './utils.js';

export class AgentsController {
    constructor() {
        this.container = document.getElementById('route-agents');
        if (!this.container) return;

        this.els = {
            page: document.getElementById('agents-page'),
            backBtn: document.getElementById('btn-agents-back'),
            bg: document.getElementById('agents-cinematic-bg'),
            detailZone: document.getElementById('agent-detail-zone'),
            
            avatar: document.getElementById('agent-big-avatar'),
            name: document.getElementById('agent-name'),
            role: document.getElementById('agent-role'),
            statsRow: document.getElementById('agent-stats-row'),
            lvlBadge: document.getElementById('agent-lvl-badge').querySelector('span'),
            timeBadge: document.getElementById('agent-time-badge').querySelector('span'),
            
            expText: document.getElementById('agent-exp-text'),
            levelFill: document.getElementById('agent-level-fill'),
            expHint: document.getElementById('agent-exp-hint'),
            
            desc: document.getElementById('agent-desc'),
            dynamicContent: document.getElementById('agent-dynamic-content'),
            
            listContainer: document.getElementById('agents-scroll-list'),
            totalCount: document.getElementById('agents-total-count')
        };

        this.agentsData = [];
        this.currentAgentId = null;
        this.isListRendered = false; 

        this.bindEvents();
        this.subscribeToStore();
    }

    mount(targetId) {
        console.log('👤 [Agents] Компонент смонтирован');
        this.loadDataAndRender(targetId);
    }

    unmount() {
        console.log('👤 [Agents] Компонент размонтирован');
    }

    subscribeToStore() {
        AppStore.subscribe((state, prevState) => {
            const currentPath = state.route.path;
            const currentId = state.route.params.id;
            const prevId = prevState?.route?.params?.id;
            
            if (currentPath === '/agents' && currentId && currentId !== prevId) {
                if (this.agentsData.length > 0) {
                    this.switchAgent(currentId);
                }
            }
        });
    }

    bindEvents() {
        this.els.backBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            AppRouter.navigate('/');
        });
    }

    loadDataAndRender(targetId) {
        const state = AppStore.getState();
        
        // Нам нужна и база агентов, и медиа (для картинок тирлиста)
        if (!state.data.isAgentsLoaded || !state.data.isMediaLoaded) {
            const unsubscribe = AppStore.subscribe((newState) => {
                if (newState.data.isAgentsLoaded && newState.data.isMediaLoaded) {
                    unsubscribe();
                    this.loadDataAndRender(targetId);
                }
            });
            return;
        }

        this.agentsData = state.data.agents;
        
        if (!this.agentsData || this.agentsData.length === 0) {
            console.warn('[Agents] База агентов пуста.');
            return;
        }

        if (!this.isListRendered) {
            this.renderList();
            this.isListRendered = true;
        }

        let agent = this.agentsData.find(a => a.id === targetId || a.name === targetId);
        if (!agent) {
            agent = this.agentsData[0];
            AppRouter.navigate('/agents', { id: agent.id });
        } else {
            this.renderDetail(agent);
        }
    }
    
    switchAgent(targetId) {
        const agent = this.agentsData.find(a => a.id === targetId || a.name === targetId);
        if (agent) {
            this.renderDetail(agent);
        }
    }

    renderList() {
        this.els.totalCount.textContent = this.agentsData.length;
        
        this.els.listContainer.innerHTML = this.agentsData.map(agent => {
            const colorVal = AgentCard.getRoleColor(agent.color);
            const { level } = AgentCard.calculateLevelData(agent.createdAt);
            
            const avatarContent = agent.avatarPath || agent.image 
                ? `<img src="${agent.avatarPath || agent.image}" onerror="this.style.display='none'">` 
                : (agent.customHtml || `<i class="${agent.mainIcon || 'fas fa-user'}"></i>`);

            const displayName = agent.squadName || agent.name;

            return `
                <div class="agent-list-card" data-id="${agent.id}" style="--card-color: ${colorVal}">
                    <div class="alc-avatar">${avatarContent}</div>
                    <div class="alc-info">
                        <div class="alc-name">${displayName}</div>
                        <div class="alc-role">${agent.role || 'Агент'}</div>
                    </div>
                    <div class="alc-lvl">LVL.${level}</div>
                </div>
            `;
        }).join('');

        this.els.listContainer.querySelectorAll('.agent-list-card').forEach(card => {
            card.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                AppRouter.navigate('/agents', { id: card.dataset.id });
            });
        });
    }

    renderDetail(agent) {
        if (!agent) return;
        this.currentAgentId = agent.id;

        // 1. Обновляем классы активности
        this.els.listContainer.querySelectorAll('.agent-list-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === agent.id);
        });

        // 2. Анимация Глитча
        this.els.detailZone.classList.remove('is-glitching');
        void this.els.detailZone.offsetWidth; // Reflow
        this.els.detailZone.classList.add('is-glitching');

        setTimeout(() => {
            const colorVal = AgentCard.getRoleColor(agent.color);
            const { level, progress, daysActive, currentExp, nextLevelExp, daysLeft } = AgentCard.calculateLevelData(agent.createdAt);

            this.els.page.style.setProperty('--agent-color', colorVal);

            // Тексты
            this.els.name.textContent = agent.squadName || agent.name;
            this.els.role.textContent = agent.role || 'Агент';
            this.els.lvlBadge.textContent = `LVL.${level}`;
            this.els.timeBadge.textContent = agent.createdAt ? `${daysActive} дн. в сети` : `ДАННЫЕ ЗАСЕКРЕЧЕНЫ`;
            this.els.desc.innerHTML = agent.description || 'Информация о данном агенте отсутствует в базе.';

            // Удаляем старую кнопку твича, если была
            const oldTwitchBtn = this.els.statsRow.querySelector('.agent-twitch-btn');
            if (oldTwitchBtn) oldTwitchBtn.remove();
            
            // Добавляем новую, если логин известен
            if (agent.twitch) {
                const btn = document.createElement('a');
                btn.className = 'agent-twitch-btn';
                btn.href = `https://twitch.tv/${agent.twitch}`;
                btn.target = '_blank';
                btn.innerHTML = `<i class="fab fa-twitch"></i> TWITCH`;
                this.els.statsRow.appendChild(btn);
            }

            // Прогресс бар
            if (agent.createdAt) {
                this.els.expText.textContent = `${currentExp} / ${nextLevelExp} XP`;
                this.els.expHint.textContent = `До следующего уровня (LVL.${level + 1}): ${daysLeft} дн.`;
            } else {
                this.els.expText.textContent = `ДАННЫЕ СКРЫТЫ`;
                this.els.expHint.textContent = `Прогресс неизвестен`;
            }
            this.els.levelFill.style.width = `${progress}%`;

            // Аватарка
            const avatarContent = agent.avatarPath || agent.image 
                ? `<img src="${agent.avatarPath || agent.image}" onerror="this.style.display='none'">` 
                : (agent.customHtml || `<i class="${agent.mainIcon || 'fas fa-user'}"></i>`);
            this.els.avatar.innerHTML = avatarContent;

            // РЕНДЕР МИНИ-ТИРЛИСТА
            if (agent.hasTierlist) {
                this.els.dynamicContent.innerHTML = `
                    <div class="agent-tierlist-block">
                        <div class="agent-tierlist-title"><i class="fas fa-list-ul"></i> БАЗА ДАННЫХ АГЕНТА</div>
                        <div id="mini-tierlist-root" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin" style="color: var(--agent-color);"></i> СИНХРОНИЗАЦИЯ...
                        </div>
                    </div>
                `;
                this.renderMiniTierlist(agent.id);
            } else {
                this.renderSecretPlaceholder();
            }

        }, 150);
    }

    async renderMiniTierlist(agentId) {
        const root = document.getElementById('mini-tierlist-root');
        if (!root) return;

        try {
            // Для демо подгружаем статический тирлист игр (в будущем можно грузить по agentId)
            const staticData = await loadData('tierlist-static-games.json');
            const mediaDb = AppStore.getState().data.media || [];

            if (!staticData || !staticData.tiers) {
                root.innerHTML = '<div style="color: #666;">Данные тирлиста повреждены</div>';
                return;
            }

            let html = `<div class="agent-tierlist-preview" id="btn-open-agent-tierlist"><div class="mini-tl-container">`;

            staticData.tiers.forEach(tier => {
                if (tier.items.length === 0) return; // Пропускаем пустые тиры для компактности
                
                let cardsHtml = tier.items.map(itemTitle => {
                    const mediaItem = mediaDb.find(m => m.title === itemTitle);
                    let imgUrl = 'https://via.placeholder.com/22x32?text=NO';
                    if (mediaItem) {
                        imgUrl = mediaItem.image || (mediaItem.images && mediaItem.images[0]) || imgUrl;
                    }
                    return `<div class="mini-tl-card"><img src="${optimizeImageUrl(imgUrl, 50, 60)}" alt="${itemTitle}"></div>`;
                }).join('');

                html += `
                    <div class="mini-tl-row">
                        <div class="mini-tl-label" style="background-color: ${tier.color}">${tier.name}</div>
                        <div class="mini-tl-content">${cardsHtml}</div>
                    </div>
                `;
            });

            html += `</div></div>`;
            root.innerHTML = html;

            document.getElementById('btn-open-agent-tierlist').addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'expand');
                AppRouter.navigate('/tierlist');
            });

        } catch (e) {
            console.error("Ошибка при генерации мини-тирлиста:", e);
            root.innerHTML = '<div style="color: #ff4444;">Ошибка синхронизации</div>';
        }
    }

    renderSecretPlaceholder() {
        this.els.dynamicContent.innerHTML = `
            <div class="agent-secret-data">
                <i class="fas fa-lock"></i><br>
                ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ ЗАСЕКРЕЧЕНЫ<br>
                <span style="font-size: 0.8rem; color: #555;">(Личная база данных пуста)</span>
            </div>
        `;
    }
}