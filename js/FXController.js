/* js/FXController.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { ReptileEngine } from './reptile-engine.js';
import { DragonEngine } from './dragon-engine.js';
import { CometEngine } from './comets.js';
import { MatrixEngine } from './matrix-engine.js';

export class FXController {
    constructor() {
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
        });
        
        EventBus.on('CMD_LIZARD', () => { 
            this.engines.dragon.stop(); 
            this.engines.reptile.start(); 
        });
        
        EventBus.on('CMD_DRAGON', () => { 
            this.engines.reptile.stop(); 
            this.engines.dragon.start(); 
        });
        
        EventBus.on('CMD_COMET', () => this.engines.comet.triggerShower());
        
        EventBus.on('UI_CLICK_CLEAR', () => { 
            this.engines.reptile.stop(); 
            this.engines.dragon.stop(); 
        });
        
        EventBus.on('CMD_GOD', () => AppStore.dispatch({ type: 'FX_TOGGLE_GODMODE' }));
        EventBus.on('CMD_GODMODE', () => AppStore.dispatch({ type: 'FX_TOGGLE_GODMODE' }));

        // Синхронизация состояний из AppStore
        AppStore.subscribe((state, prevState) => {
            
            // 1. Управление паузой
            if (state.fx.isPaused !== prevState?.fx?.isPaused) {
                if (state.fx.isPaused) {
                    this.pauseAll();
                } else {
                    this.resumeAll(state.fx.mode);
                }
            }

            // 2. Управление режимами скролла и фонов (Если не на паузе)
            if (!state.fx.isPaused && state.fx.mode !== prevState?.fx?.mode) {
                this.applyFxMode(state.fx.mode, state.fx.isGodMode);
            }

            // 3. Управление режимом бога
            if (state.fx.isGodMode !== prevState?.fx?.isGodMode) {
                if (state.fx.isGodMode) {
                    if (!state.fx.isPaused) this.engines.matrix.start();
                    if (this.engines.matrix.curtain) this.engines.matrix.curtain.style.opacity = '0';
                    EventBus.emit('SYS_LOG', { type: 'system', tag: 'PROTOCOL', action: 'GOD_MODE', value: 'ACTIVATED', color: '#ffd700' });
                } else {
                    this.engines.matrix.stop();
                    EventBus.emit('SYS_LOG', { type: 'system', tag: 'PROTOCOL', action: 'GOD_MODE', value: 'DEACTIVATED', color: '#888' });
                }
                this.engines.matrix.isGodMode = state.fx.isGodMode;
            }
        });
    }

    pauseAll() {
        this.engines.reptile.stop();
        this.engines.dragon.stop();
        this.engines.comet.stopIdle();
        this.engines.comet.stopShower();
        this.engines.matrix.stop();
    }

    resumeAll(mode) {
        // Возобновляем только дефолтные фоны. Драконы вызываются вручную, поэтому не восстанавливаем.
        this.applyFxMode(mode, AppStore.getState().fx.isGodMode);
    }

    applyFxMode(mode, isGodMode) {
        document.body.classList.remove('state-no-comets', 'state-no-stars');
            
        if (mode === 0) {
            if (isGodMode) this.engines.matrix.start();
            this.engines.comet.startIdle();
        }
        else if (mode === 1) {
            document.body.classList.add('state-no-comets');
        }
        else if (mode === 2) {
            document.body.classList.add('state-no-stars');
        }
        else if (mode === 3) {
            document.body.classList.add('state-no-comets', 'state-no-stars');
            this.engines.matrix.stop();
            this.engines.comet.stopIdle();
        }
    }
}