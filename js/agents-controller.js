/* js/agents-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { AgentsDetailRenderer } from './agents/AgentsDetailRenderer.js';
import { AgentsMarquee } from './agents/AgentsMarquee.js';

/**
 * Страница досье. Адрес #/agents/{id} — единственный источник истины:
 * имя в URL канонизируется в id, отсутствующий агент мягко заменяется
 * первым из базы через replace (без ловушки в истории браузера).
 */
export class AgentsController {
    constructor() {
        this.container = document.getElementById('route-agents');
        if (!this.container) return;

        this.els = { backBtn: document.getElementById('btn-agents-back') };
        this.agentsData = [];
        this.currentAgentId = null;
        this.isListRendered = false;
        this.waitUnsub = null;

        this.detailRenderer = new AgentsDetailRenderer();
        this.marquee = new AgentsMarquee((clickedAgentId) => {
            if (clickedAgentId === this.currentAgentId) return;
            AppRouter.navigate('/agents', { id: clickedAgentId });
        });

        this.bindEvents();
        this.subscribeToStore();
        console.log('👤 [Agents] Контроллер инициализирован (URL-driven)');
    }

    mount(targetId) {
        this.loadDataAndRender(targetId);
        if (this.isListRendered) this.marquee.resume();
        console.log('👤 [Agents] Компонент смонтирован');
    }

    unmount() {
        this.clearWaiter();
        this.detailRenderer.cancelPending();
        this.marquee.pause();
        console.log('👤 [Agents] Компонент размонтирован');
    }

    clearWaiter() {
        if (this.waitUnsub) {
            this.waitUnsub();
            this.waitUnsub = null;
        }
    }

    subscribeToStore() {
        AppStore.subscribe((state, prevState) => {
            const path = state.route.path;
            const prevPath = prevState && prevState.route.path;
            if (path !== '/agents') return;

            const id = state.route.params.id;
            const prevId = prevState && prevState.route.params.id;
            if (prevPath === '/agents' && id && id !== prevId) this.switchAgent(id);
        });
    }

    bindEvents() {
        if (!this.els.backBtn) return;
        this.els.backBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            const home = AppRouter.getHomeTarget();
            AppRouter.navigate(home.path, home.params);
        });
    }

    loadDataAndRender(targetId) {
        const state = AppStore.getState();

        if (!state.data.isAgentsLoaded || !state.data.isMediaLoaded) {
            if (this.waitUnsub) return;
            console.log('👤 [Agents] Ожидаем загрузку базы агентов и медиа...');
            this.waitUnsub = AppStore.subscribe((newState) => {
                if (!newState.data.isAgentsLoaded || !newState.data.isMediaLoaded) return;
                this.clearWaiter();
                if (newState.route.path === '/agents') {
                    this.loadDataAndRender(newState.route.params.id || targetId);
                }
            });
            return;
        }

        this.agentsData = Array.isArray(state.data.agents) ? state.data.agents : [];
        if (this.agentsData.length === 0) {
            console.warn('⚠️ [Agents] База агентов пуста.');
            return;
        }

        const agent = this.resolveAgent(targetId);

        if (!agent) {
            const fallback = this.agentsData[0];
            console.warn(`⚠️ [Agents] Агент "${targetId}" не найден -> ${fallback.id} (replace)`);
            AppRouter.navigate('/agents', { id: fallback.id }, {}, { replace: true });
            return;
        }

        // Ссылка по нику канонизируется в ссылку по id.
        if (targetId && targetId !== agent.id) {
            console.log(`👤 [Agents] Канонизация: "${targetId}" -> "${agent.id}"`);
            AppRouter.navigate('/agents', { id: agent.id }, {}, { replace: true });
            return;
        }

        if (!this.isListRendered) {
            this.marquee.render(this.agentsData, agent.id);
            this.isListRendered = true;
        }
        this.renderDetail(agent, false);
    }

    resolveAgent(needle) {
        if (!needle) return null;
        const key = String(needle);
        return this.agentsData.find(a => a.id === key)
            || this.agentsData.find(a => a.name === key)
            || this.agentsData.find(a => String(a.name || '').toLowerCase() === key.toLowerCase())
            || null;
    }

    switchAgent(targetId) {
        const agent = this.resolveAgent(targetId);
        if (!agent) {
            const fallback = this.agentsData[0];
            if (!fallback) return;
            console.warn(`⚠️ [Agents] Агент "${targetId}" не найден -> ${fallback.id} (replace)`);
            AppRouter.navigate('/agents', { id: fallback.id }, {}, { replace: true });
            return;
        }
        if (agent.id === this.currentAgentId) return;
        if (targetId !== agent.id) {
            AppRouter.navigate('/agents', { id: agent.id }, {}, { replace: true });
            return;
        }
        this.renderDetail(agent, true);
    }

    renderDetail(agent, animate = false) {
        this.currentAgentId = agent.id;
        this.marquee.setActive(agent.id);
        this.detailRenderer.render(agent, animate);
        AppRouter.setDocumentTitle(agent.squadName || agent.name);
    }
}