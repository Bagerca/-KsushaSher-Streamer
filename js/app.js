/* js/app.js */

import EventBus from './event-bus.js';
import { TerminalController } from './terminal-core.js';
import { SettingsMenu } from './settings-menu.js';
import { initializeUI } from './ui-components.js';
import { initMediaArchive } from './media-manager.js';
import { HeroController } from './hero-controller.js';
import { SquadController } from './squad-controller.js';
import { MediaModalManager } from './modal/MediaModalManager.js';

import { ReptileEngine } from './reptile-engine.js';
import { DragonEngine } from './dragon-engine.js';
import { CometEngine } from './comets.js';
import { MatrixEngine } from './matrix-engine.js'; 

import { ScheduleManager } from './schedule.js';
import { SubscribersManager } from './subscribers.js';
import { HubController } from './hub-controller.js';
import { StatsManager } from './stats.js'; 

import { initMusicPlayer, toggleMusicMode } from './music-player.js';

const AppState = {
    initialized: false,
    fxMode: 0,
    activeSubEngines: [] // Запоминает, был ли запущен дракон или ящерица
};

let terminalCtrl;
let settingsMenu;
const scheduleMgr = new ScheduleManager();
const subsMgr = new SubscribersManager();
const statsMgr = new StatsManager(); 

const engines = {
    reptile: new ReptileEngine(),
    dragon: new DragonEngine(),
    comet: new CometEngine(),
    matrix: new MatrixEngine()
};

async function bootstrap() {
    if (AppState.initialized) return;
    
    try {
        console.log('🚀 [Boot] Запуск системы Ksusha Sher...');
        
        terminalCtrl = new TerminalController();
        settingsMenu = new SettingsMenu();
        
        initializeUI(); 
        new HeroController();
        new SquadController();
        new MediaModalManager();
        
        registerEventHandlers();
        setupVisibilityManager(); // Спящий режим
        
        await Promise.all([
            scheduleMgr.init(),
            subsMgr.init(),
            statsMgr.init(), 
            initMediaArchive(),
            initMusicPlayer()
        ]);
        
        new HubController();
        
        if (window.globalSyncInterval) clearInterval(window.globalSyncInterval);
        
        window.globalSyncInterval = setInterval(async () => {
            await scheduleMgr.init();
            await statsMgr.init(); 
            EventBus.emit('SYS_LOG', { html: "<span style='color:#555'>[SYS] Background data sync complete.</span>" });
        }, 300000);
        
        engines.comet.startIdle(); 
        
        console.log('✅ [Boot] Инициализация завершена успешно!');
        AppState.initialized = true;
        
    } catch (error) {
        console.error('❌ [Boot] Критическая ошибка при инициализации:', error);
    }
}

/**
 * СПЯЩИЙ РЕЖИМ (SLEEP MODE)
 */
function setupVisibilityManager() {
    const heroObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            // ПРОСЫПАЕМСЯ
            if (AppState.fxMode === 0 && engines.matrix.isGodMode) engines.matrix.start();
            if (AppState.fxMode !== 1 && AppState.fxMode !== 3) engines.comet.startIdle();
            
            // Восстанавливаем кастомных существ
            if (AppState.activeSubEngines.includes('dragon')) engines.dragon.start();
            if (AppState.activeSubEngines.includes('reptile')) engines.reptile.start();

        } else {
            // ЗАСЫПАЕМ (Глушим всё жестко)
            engines.matrix.stop();
            engines.comet.stopIdle();
            
            // Если существа работают, глушим их, но оставляем пометку в памяти
            if (engines.dragon.rafId) engines.dragon.stop();
            if (engines.reptile.rafId) engines.reptile.stop();
        }
    }, { threshold: 0.01 });

    const heroEl = document.getElementById('hero');
    if (heroEl) heroObserver.observe(heroEl);
}

function registerEventHandlers() {
    EventBus.on('CMD_CLEAR', () => {
        engines.reptile.stop(); 
        engines.dragon.stop(); 
        engines.comet.stopShower();
        engines.matrix.stop();
        AppState.activeSubEngines = []; // Очищаем память
        if (terminalCtrl.historyEl) terminalCtrl.historyEl.innerHTML = '';
    });
    
    EventBus.on('CMD_LIZARD', () => { 
        engines.dragon.stop(); 
        engines.reptile.start(); 
        AppState.activeSubEngines = ['reptile']; 
    });
    
    EventBus.on('CMD_DRAGON', () => { 
        engines.reptile.stop(); 
        engines.dragon.start(); 
        AppState.activeSubEngines = ['dragon']; 
    });
    
    EventBus.on('CMD_COMET', () => engines.comet.triggerShower());
    EventBus.on('CMD_STATUS', () => EventBus.emit('SYS_LOG', { html: 'СИСТЕМЫ В НОРМЕ.' }));
    EventBus.on('CMD_MUSIC', () => EventBus.emit('UI_CLICK_MUSIC'));
    EventBus.on('CMD_PLAYER', () => EventBus.emit('UI_CLICK_MUSIC'));
    EventBus.on('CMD_HELP', () => {
        const helpHtml = `
        <div style="color:#888;">ДОСТУПНЫЕ ПРОТОКОЛЫ:</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="clear">CLEAR</span> - Очистить существ</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="dragon">DRAGON</span> - Запуск: Дракон</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="lizard">LIZARD</span> - Запуск: Ящерица</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="comet">COMET</span> - Запуск: Метеоры</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="godmode">GODMODE</span> - Перезапись реальности</div>
        `;
        EventBus.emit('SYS_LOG', { html: helpHtml });
    });

    EventBus.on('UI_CLICK_CLEAR', () => { 
        engines.reptile.stop(); 
        engines.dragon.stop(); 
        AppState.activeSubEngines = [];
    });
    
    EventBus.on('UI_CLICK_FX_CYCLE', () => {
        AppState.fxMode = (AppState.fxMode + 1) % 4;
        document.body.classList.remove('state-no-comets', 'state-no-stars');
        
        if (AppState.fxMode === 0) {
            if (engines.matrix.isGodMode) engines.matrix.start();
        }
        else if (AppState.fxMode === 1) {
            document.body.classList.add('state-no-comets');
        }
        else if (AppState.fxMode === 2) {
            document.body.classList.add('state-no-stars');
        }
        else if (AppState.fxMode === 3) {
            document.body.classList.add('state-no-comets', 'state-no-stars');
            engines.matrix.stop();
        }
        EventBus.emit('STATE_FX_CHANGED', AppState.fxMode);
    });
    
    EventBus.on('UI_CLICK_MUSIC', () => toggleMusicMode());
    EventBus.on('UI_CLICK_REFRESH', async () => { 
        await scheduleMgr.init(); 
        await statsMgr.init();
    });
    
    EventBus.on('CMD_GOD', () => engines.matrix.toggleGodMode());
    EventBus.on('CMD_GODMODE', () => engines.matrix.toggleGodMode());
    
    EventBus.on('STATE_GODMODE_CHANGED', (isGodMode) => {
        if (isGodMode) {
            EventBus.emit('SYS_LOG', { html: "🔥 PROTOCOL: <span style='color:var(--neon-pink)'>GOD_MODE_ACTIVATED</span>" });
        } else {
            EventBus.emit('SYS_LOG', { html: "💤 PROTOCOL: <span style='color:#666'>GOD_MODE_DEACTIVATED</span>" });
        }
    });
}

window.addEventListener('error', e => console.error('🚨 Error:', e.error));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();

export function addLogLine(html, isTyping = false, forceScroll = false) { if (terminalCtrl) return terminalCtrl.addLogLine(html, isTyping, forceScroll); }
export function setSystemNoiseState(isEnabled) { if (terminalCtrl) terminalCtrl.setSystemNoiseState(isEnabled); }
window.AppState = AppState;