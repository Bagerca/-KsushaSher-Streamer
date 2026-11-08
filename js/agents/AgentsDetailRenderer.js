/* js/agents/AgentsDetailRenderer.js */
import { AgentCard } from '../components/AgentCard.js';
import { loadData } from '../api.js';
import { AppStore } from '../store.js';
import { optimizeImageUrl } from '../utils.js';
import EventBus from '../event-bus.js';
import { AppRouter } from '../router.js';

export class AgentsDetailRenderer {
    constructor() {
        this.els = {
            page: document.getElementById('agents-page'),
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
            dynamicContent: document.getElementById('agent-dynamic-content')
        };
    }

    render(agent) {
        if (!agent) return;

        // Анимация Глитча
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

            // Обновляем кнопку Twitch
            const oldTwitchBtn = this.els.statsRow.querySelector('.agent-twitch-btn');
            if (oldTwitchBtn) oldTwitchBtn.remove();
            
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

            // Мини-тирлист
            if (agent.hasTierlist) {
                this.els.dynamicContent.innerHTML = `
                    <div class="agent-tierlist-block">
                        <div class="agent-tierlist-title"><i class="fas fa-list-ul"></i> БАЗА ДАННЫХ АГЕНТА</div>
                        <div id="mini-tierlist-root" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin" style="color: var(--agent-color);"></i> СИНХРОНИЗАЦИЯ...
                        </div>
                    </div>
                `;
                this.renderMiniTierlist();
            } else {
                this.renderSecretPlaceholder();
            }
        }, 150);
    }

    async renderMiniTierlist() {
        const root = document.getElementById('mini-tierlist-root');
        if (!root) return;

        try {
            const staticData = await loadData('tierlist-static-games.json');
            const mediaDb = AppStore.getState().data.media || [];

            if (!staticData || !staticData.tiers) {
                root.innerHTML = '<div style="color: #666;">Данные тирлиста повреждены</div>';
                return;
            }

            let html = `<div class="agent-tierlist-preview" id="btn-open-agent-tierlist"><div class="mini-tl-container">`;

            staticData.tiers.forEach(tier => {
                if (tier.items.length === 0) return; 
                
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