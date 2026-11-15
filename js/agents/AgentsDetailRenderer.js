/* js/agents/AgentsDetailRenderer.js */
import { AgentCard } from '../components/AgentCard.js';
import { loadData } from '../api.js';
import { AppStore } from '../store.js';
import { optimizeImageUrl } from '../utils.js';
import EventBus from '../event-bus.js';
import { AppRouter } from '../router.js';

const SWAP_DURATION = 180;
const MEDIA_WAIT_TIMEOUT = 8000;

function escapeAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export class AgentsDetailRenderer {
    constructor() {
        this.els = {
            page: document.getElementById('agents-page'),
            detailZone: document.getElementById('agent-detail-zone'),
            avatar: document.getElementById('agent-big-avatar'),
            name: document.getElementById('agent-name'),
            role: document.getElementById('agent-role'),
            statsRow: document.getElementById('agent-stats-row'),
            lvlBadge: document.querySelector('#agent-lvl-badge span'),
            timeBadge: document.querySelector('#agent-time-badge span'),
            expText: document.getElementById('agent-exp-text'),
            levelFill: document.getElementById('agent-level-fill'),
            expHint: document.getElementById('agent-exp-hint'),
            desc: document.getElementById('agent-desc'),
            dynamicContent: document.getElementById('agent-dynamic-content')
        };
        this.renderSession = 0;
        this.swapTimer = null;
        this.currentAgentId = null;
    }

    render(agent, animate = false) {
        if (!agent || !this.els.detailZone) return;
        const session = ++this.renderSession;
        this.clearSwapTimer();
        const zone = this.els.detailZone;

        if (animate && zone.offsetParent !== null) {
            zone.classList.remove('page-enter');
            zone.classList.add('is-swapping');
            this.swapTimer = setTimeout(() => {
                this.swapTimer = null;
                if (session !== this.renderSession) return;
                this.applyAgent(agent, session);
                zone.classList.remove('is-swapping');
            }, SWAP_DURATION);
        } else {
            zone.classList.remove('is-swapping');
            this.applyAgent(agent, session);
            zone.classList.remove('page-enter');
            void zone.offsetWidth;
            zone.classList.add('page-enter');
        }
    }

    applyAgent(agent, session) {
        try {
            const colorVal = AgentCard.getRoleColor(agent.color);
            const { level, progress, daysActive, currentExp, nextLevelExp, daysLeft } = AgentCard.calculateLevelData(agent.createdAt);

            this.els.page.style.setProperty('--agent-color', colorVal);
            this.els.name.textContent = agent.squadName || agent.name;
            this.els.role.textContent = agent.role || 'Агент';
            this.els.lvlBadge.textContent = `LVL.${level}`;
            this.els.timeBadge.textContent = agent.createdAt ? `${daysActive} дн. в сети` : 'ДАННЫЕ ЗАСЕКРЕЧЕНЫ';
            this.els.desc.textContent = agent.description || 'Информация о данном агенте отсутствует в базе.';

            const oldTwitchBtn = this.els.statsRow.querySelector('.agent-twitch-btn');
            if (oldTwitchBtn) oldTwitchBtn.remove();
            if (agent.twitch) {
                const btn = document.createElement('a');
                btn.className = 'agent-twitch-btn';
                btn.href = `https://twitch.tv/${encodeURIComponent(agent.twitch)}`;
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.innerHTML = '<i class="fab fa-twitch"></i> TWITCH';
                this.els.statsRow.appendChild(btn);
            }

            if (agent.createdAt) {
                this.els.expText.textContent = `${currentExp} / ${nextLevelExp} XP`;
                this.els.expHint.textContent = `До следующего уровня (LVL.${level + 1}): ${daysLeft} дн.`;
            } else {
                this.els.expText.textContent = 'ДАННЫЕ СКРЫТЫ';
                this.els.expHint.textContent = 'Прогресс неизвестен';
            }
            this.els.levelFill.style.width = `${progress}%`;

            // Аватар: фото или простая иконка юзера (единая логика AgentCard).
            this.els.avatar.innerHTML = AgentCard.getAvatarContent(agent);

            if (agent.hasTierlist) {
                this.els.dynamicContent.innerHTML = `
                    <div class="agent-tierlist-block">
                        <div class="agent-tierlist-title"><i class="fas fa-list"></i> БАЗА ДАННЫХ АГЕНТА</div>
                        <div id="mini-tierlist-root" style="text-align:center; padding:20px; color: var(--agent-color);">
                            <i class="fas fa-circle-notch fa-spin"></i> СИНХРОНИЗАЦИЯ...
                        </div>
                    </div>`;
                this.renderMiniTierlist(session);
            } else {
                this.renderSecretPlaceholder();
            }

            this.currentAgentId = agent.id;
        } catch (error) {
            console.error('🚨 [AgentsDetail] Ошибка применения досье:', error);
        }
    }

    /** Ждём медиа-базу, но не дольше таймаута — досье не должно зависать. */
    waitForMedia(session) {
        return new Promise((resolve) => {
            if (AppStore.getState().data.isMediaLoaded) { resolve(true); return; }
            let settled = false;
            const finish = (value) => {
                if (settled) return;
                settled = true;
                unsubscribe();
                clearTimeout(timer);
                resolve(value);
            };
            const unsubscribe = AppStore.subscribe((state) => {
                if (state.data.isMediaLoaded) finish(true);
                else if (session !== this.renderSession) finish(false);
            });
            const timer = setTimeout(() => {
                console.warn('⚠️ [AgentsDetail] Таймаут ожидания медиа-базы.');
                finish(AppStore.getState().data.isMediaLoaded);
            }, MEDIA_WAIT_TIMEOUT);
        });
    }

    /** Индекс постеров по названию, включая части коллекций. */
    buildPosterIndex() {
        const index = new Map();
        const put = (title, url) => {
            if (!title || !url || index.has(title)) return;
            index.set(title, url);
        };
        (AppStore.getState().data.media || []).forEach(item => {
            put(item.title, item.image || (Array.isArray(item.images) ? item.images[0] : null));
            if (Array.isArray(item.items)) {
                item.items.forEach(sub => put(sub.title, sub.image || item.image));
            }
        });
        return index;
    }

    async renderMiniTierlist(session) {
        const root = document.getElementById('mini-tierlist-root');
        if (!root) return;
        try {
            const [staticData] = await Promise.all([
                loadData('tierlist-static-games.json', null),
                this.waitForMedia(session)
            ]);
            if (session !== this.renderSession) return;
            const freshRoot = document.getElementById('mini-tierlist-root');
            if (!freshRoot) return;

            if (!staticData || !Array.isArray(staticData.tiers)) {
                freshRoot.innerHTML = '<div style="color: var(--color-text-muted);">Данные тирлиста повреждены</div>';
                return;
            }

            const posters = this.buildPosterIndex();
            let html = '<div class="agent-tierlist-preview" id="btn-open-agent-tierlist" role="button" tabindex="0" title="Открыть полный тирлист"><div class="mini-tl-container">';
            let total = 0;

            staticData.tiers.forEach(tier => {
                if (!Array.isArray(tier.items) || tier.items.length === 0) return;
                total += tier.items.length;
                const cards = tier.items.map(title => {
                    const url = posters.get(title);
                    const safeTitle = escapeAttr(title);
                    return url
                        ? `<div class="mini-tl-card" title="${safeTitle}"><img src="${escapeAttr(optimizeImageUrl(url, 50, 60))}" alt="${safeTitle}" loading="lazy"></div>`
                        : `<div class="mini-tl-card" title="${safeTitle}" style="display:flex;align-items:center;justify-content:center;background:var(--color-bg-medium);color:var(--color-text-muted);font-size:0.6rem;font-family:var(--font-header);">${safeTitle.charAt(0).toUpperCase()}</div>`;
                }).join('');
                html += `
                    <div class="mini-tl-row">
                        <div class="mini-tl-label" style="background-color:${escapeAttr(tier.color)}">${escapeAttr(tier.name)}</div>
                        <div class="mini-tl-content">${cards}</div>
                    </div>`;
            });
            html += '</div></div>';

            if (total === 0) {
                freshRoot.innerHTML = '<div style="color: var(--color-text-muted);">Тирлист ещё не распределён</div>';
                return;
            }

            freshRoot.innerHTML = html;
            const openBtn = document.getElementById('btn-open-agent-tierlist');
            if (openBtn) {
                const open = () => {
                    EventBus.emit('PLAY_SOUND', 'expand');
                    AppRouter.navigate('/tierlist', { type: 'games' });
                };
                openBtn.addEventListener('click', open);
                openBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
                });
            }
        } catch (error) {
            if (session !== this.renderSession) return;
            console.error('🚨 [AgentsDetail] Ошибка генерации мини-тирлиста:', error);
            const freshRoot = document.getElementById('mini-tierlist-root');
            if (freshRoot) freshRoot.innerHTML = '<div style="color: var(--color-danger-red);">Ошибка синхронизации</div>';
        }
    }

    renderSecretPlaceholder() {
        this.els.dynamicContent.innerHTML = `
            <div class="agent-secret-data">
                <i class="fas fa-lock"></i><br>
                ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ ЗАСЕКРЕЧЕНЫ<br>
                <span style="font-size:0.8rem; color: var(--color-text-muted);">(Личная база данных пуста)</span>
            </div>`;
    }

    clearSwapTimer() {
        if (this.swapTimer) {
            clearTimeout(this.swapTimer);
            this.swapTimer = null;
        }
    }

    cancelPending() {
        this.renderSession++;
        this.clearSwapTimer();
        if (this.els.detailZone) {
            this.els.detailZone.classList.remove('is-swapping', 'page-enter');
        }
    }
}