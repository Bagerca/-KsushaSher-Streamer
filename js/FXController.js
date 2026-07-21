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
        this.engines.comet.startIdle();
        console.log('✨ [FXController] Графические движки инициализированы');
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
                this.engines.comet.startIdle();
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
                this.engines.comet.stopIdle();
            }
            EventBus.emit('STATE_FX_CHANGED', this.state.fxMode);
        });
        
        EventBus.on('CMD_GOD', () => this.engines.matrix.toggleGodMode());
        EventBus.on('CMD_GODMODE', () => this.engines.matrix.toggleGodMode());
        
        EventBus.on('STATE_GODMODE_CHANGED', (isGodMode) => {
            if (isGodMode) {
                EventBus.emit('SYS_LOG', { type: 'system', tag: 'PROTOCOL', action: 'GOD_MODE', value: 'ACTIVATED', color: '#ffd700' });
            } else {
                EventBus.emit('SYS_LOG', { type: 'system', tag: 'PROTOCOL', action: 'GOD_MODE', value: 'DEACTIVATED', color: '#888' });
            }
        });
    }
}