/* js/app.js */

import EventBus from './event-bus.js';
import { AppConfig } from './config.js'; 
import { SynthEngine } from './services/SynthEngine.js'; 
import { ConfigInjector } from './services/ConfigInjector.js';

import { TerminalController } from './terminal-core.js';
import { SettingsMenu } from './settings-menu.js';
import { registerTerminalCommands } from './terminal-commands.js'; // <-- ИМПОРТ НОВОГО МОДУЛЯ

import { initScrollPhysics } from './ui/scroll-physics.js';
import { initCryptoWidget } from './ui/crypto-widget.js';
import { initNavRail } from './ui/nav-rail.js';

import { initMediaArchive } from './media-manager.js';
import { HeroController } from './hero-controller.js';
import { SquadController } from './squad-controller.js';
import { MediaModalManager } from './modal/MediaModalManager.js';
import { YoutubeModalManager } from './modal/YoutubeModalManager.js';

import { FXController } from './FXController.js'; 

import { ScheduleManager } from './schedule.js';
import { SubscribersManager } from './subscribers.js';
import { HubController } from './hub-controller.js';
import { StatsManager } from './stats.js'; 

import { initMusicPlayer, toggleMusicMode } from './music-player.js';

let terminalCtrl;
let settingsMenu;
const scheduleMgr = new ScheduleManager();
const subsMgr = new SubscribersManager();
const statsMgr = new StatsManager(); 
let fxController;

async function bootstrap() {
    if (window.AppState && window.AppState.initialized) return;
    
    try {
        console.log(`🚀 [Boot] Запуск системы ${AppConfig.system.osName} ${AppConfig.system.osVersion}...`);
        
        // 1. Инициализация базовых сервисов
        new SynthEngine(); 
        terminalCtrl = new TerminalController();
        settingsMenu = new SettingsMenu();
        fxController = new FXController();
        
        // 2. Инициализация UI модулей
        initScrollPhysics();
        initCryptoWidget();
        initNavRail();
        
        ConfigInjector.init(); 
        
        new HeroController();
        new SquadController();
        new MediaModalManager();
        new YoutubeModalManager();
        
        // 3. Настройка графики и глобальных событий
        fxController.init();
        registerGlobalEvents();
        
        // 4. Параллельная загрузка данных
        await Promise.all([
            scheduleMgr.init(),
            subsMgr.init(),
            statsMgr.init(), 
            initMediaArchive(),
            initMusicPlayer()
        ]);
        
        // 5. Пост-инициализация
        new HubController();
        
        // Фоновая синхронизация
        if (window.globalSyncInterval) clearInterval(window.globalSyncInterval);
        window.globalSyncInterval = setInterval(async () => {
            await scheduleMgr.init();
            await statsMgr.init(); 
            EventBus.emit('SYS_LOG', { html: "<span style='color:#555'>[SYS] Background data sync complete.</span>" });
        }, 300000);
        
        window.AppState = { initialized: true };
        console.log('✅ [Boot] Инициализация завершена успешно!');
        
    } catch (error) {
        console.error('❌ [Boot] Критическая ошибка при инициализации:', error);
    }
}

// Регистрация только высокоуровневых UI-событий
function registerGlobalEvents() {
    EventBus.on('CMD_CLEAR', () => {
        if (terminalCtrl && terminalCtrl.historyEl) terminalCtrl.historyEl.innerHTML = '';
    });
    
    EventBus.on('CMD_STATUS', () => EventBus.emit('SYS_LOG', { html: 'СИСТЕМЫ В НОРМЕ.' }));
    EventBus.on('CMD_MUSIC', () => EventBus.emit('UI_CLICK_MUSIC'));
    EventBus.on('CMD_PLAYER', () => EventBus.emit('UI_CLICK_MUSIC'));
    
    // Инициализация модуля с контентными командами и пасхалками
    registerTerminalCommands();

    EventBus.on('UI_CLICK_MUSIC', () => toggleMusicMode());
    EventBus.on('UI_CLICK_REFRESH', async () => { 
        await scheduleMgr.init(); 
        await statsMgr.init();
    });
}

window.addEventListener('error', e => console.error('🚨 [System] Uncaught Error:', e.error));

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap); 
} else {
    bootstrap();
}

export function addLogLine(html, isTyping = false, forceScroll = false) { 
    if (terminalCtrl) return terminalCtrl.addLogLine(html, isTyping, forceScroll); 
}
export function setSystemNoiseState(isEnabled) { 
    if (terminalCtrl) terminalCtrl.setSystemNoiseState(isEnabled); 
}