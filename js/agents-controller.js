/* js/agents-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { AgentsDetailRenderer } from './agents/AgentsDetailRenderer.js';
import { AgentsMarquee } from './agents/AgentsMarquee.js';

export class AgentsController {
    constructor() {
        this.container = document.getElementById('route-agents');
        if (!this.container) return;

        this.els = {
            backBtn: document.getElementById('btn-agents-back')
        };

        this.agentsData = [];
        this.currentAgentId = null;
        this.isListRendered = false; 

        this.detailRenderer = new AgentsDetailRenderer();
        this.marquee = new AgentsMarquee((clickedAgentId) => {
            AppRouter.navigate('/agents', { id: clickedAgentId });
        });

        this.bindEvents();
        this.subscribeToStore();
    }

    mount(targetId) {
        console.log('👤 [Agents] Компонент смонтирован');
        this.loadDataAndRender(targetId);
        
        // ВАЖНО: Если мы вернулись на страницу, мы ВЫЗЫВАЕМ resume(), 
        // который сам убьет старый цикл, если он завис, и запустит чистый.
        if (this.isListRendered) {
            this.marquee.resume();
        }
    }

    unmount() {
        console.log('👤 [Agents] Компонент размонтирован');
        // Ставим на жесткую паузу при уходе, чтобы не жрать CPU в фоне
        this.marquee.pause();
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

        let agent = this.agentsData.find(a => a.id === targetId || a.name === targetId);
        if (!agent) {
            agent = this.agentsData[0];
            AppRouter.navigate('/agents', { id: agent.id });
            return;
        }

        if (!this.isListRendered) {
            this.marquee.render(this.agentsData, agent.id);
            this.isListRendered = true;
        }

        this.renderDetail(agent);
    }
    
    switchAgent(targetId) {
        const agent = this.agentsData.find(a => a.id === targetId || a.name === targetId);
        if (agent) {
            this.renderDetail(agent);
        }
    }

    renderDetail(agent) {
        this.currentAgentId = agent.id;
        this.marquee.setActive(agent.id);
        this.detailRenderer.render(agent);
    }
}