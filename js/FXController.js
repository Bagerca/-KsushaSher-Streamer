/* js/FXController.js */
import EventBus from './event-bus.js';
import { ReptileEngine } from './reptile-engine.js';
import { DragonEngine } from './dragon-engine.js';
import { CometEngine } from './comets.js';
import { MatrixEngine } from './matrix-engine.js';

export class FXController {
    constructor() {
        this.state = {
            fxMode: 0,
            activeSubEngines: []
        };

        this.engines = {
            reptile: new ReptileEngine(),
            dragon: new DragonEngine(),
            comet: new CometEngine(),
            matrix: new MatrixEngine()
        };
    }

    init() {
        this.registerEventHandlers();
        this.setupVisibilityManager();
        
        // Запуск базового фона при старте
        this.engines.comet.startIdle();
        console.log('✨ [FXController] Графические движки инициализированы');
    }

    setupVisibilityManager() {
        const heroObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                if (this.state.fxMode === 0 && this.engines.matrix.isGodMode) this.engines.matrix.start();
                if (this.state.fxMode !== 1 && this.state.fxMode !== 3) this.engines.comet.startIdle();
                
                if (this.state.activeSubEngines.includes('dragon')) this.engines.dragon.start();
                if (this.state.activeSubEngines.includes('reptile')) this.engines.reptile.start();
            } else {
                this.engines.matrix.stop();
                this.engines.comet.stopIdle();
                
                if (this.engines.dragon.rafId) this.engines.dragon.stop();
                if (this.engines.reptile.rafId) this.engines.reptile.stop();
            }
        }, { threshold: 0.01 });

        const heroEl = document.getElementById('hero');
        if (heroEl) heroObserver.observe(heroEl);
    }

    registerEventHandlers() {
        EventBus.on('CMD_CLEAR', () => {
            this.engines.reptile.stop(); 
            this.engines.dragon.stop(); 
            this.engines.comet.stopShower();
            this.engines.matrix.stop();
            this.state.activeSubEngines = []; 
        });
        
        EventBus.on('CMD_LIZARD', () => { 
            this.engines.dragon.stop(); 
            this.engines.reptile.start(); 
            this.state.activeSubEngines = ['reptile']; 
        });
        
        EventBus.on('CMD_DRAGON', () => { 
            this.engines.reptile.stop(); 
            this.engines.dragon.start(); 
            this.state.activeSubEngines = ['dragon']; 
        });
        
        EventBus.on('CMD_COMET', () => this.engines.comet.triggerShower());
        
        EventBus.on('UI_CLICK_CLEAR', () => { 
            this.engines.reptile.stop(); 
            this.engines.dragon.stop(); 
            this.state.activeSubEngines = [];
        });
        
        EventBus.on('UI_CLICK_FX_CYCLE', () => {
            this.state.fxMode = (this.state.fxMode + 1) % 4;
            document.body.classList.remove('state-no-comets', 'state-no-stars');
            
            if (this.state.fxMode === 0) {
                if (this.engines.matrix.isGodMode) this.engines.matrix.start();
            }
            else if (this.state.fxMode === 1) {
                document.body.classList.add('state-no-comets');
            }
            else if (this.state.fxMode === 2) {
                document.body.classList.add('state-no-stars');
            }
            else if (this.state.fxMode === 3) {
                document.body.classList.add('state-no-comets', 'state-no-stars');
                this.engines.matrix.stop();
            }
            EventBus.emit('STATE_FX_CHANGED', this.state.fxMode);
        });
        
        EventBus.on('CMD_GOD', () => this.engines.matrix.toggleGodMode());
        EventBus.on('CMD_GODMODE', () => this.engines.matrix.toggleGodMode());
        
        EventBus.on('STATE_GODMODE_CHANGED', (isGodMode) => {
            if (isGodMode) {
                EventBus.emit('SYS_LOG', { html: "🔥 PROTOCOL: <span style='color:var(--neon-pink)'>GOD_MODE_ACTIVATED</span>" });
            } else {
                EventBus.emit('SYS_LOG', { html: "💤 PROTOCOL: <span style='color:#666'>GOD_MODE_DEACTIVATED</span>" });
            }
        });
    }
}