/* js/app.js */

import EventBus from './event-bus.js';
import { AppConfig } from './config.js'; 
import { SynthEngine } from './services/SynthEngine.js'; 
import { ConfigInjector } from './services/ConfigInjector.js';

import { TerminalController } from './terminal-core.js';
import { SettingsMenu } from './settings-menu.js';

import { initScrollPhysics } from './ui/scroll-physics.js';
import { initCryptoWidget } from './ui/crypto-widget.js';
import { initNavRail } from './ui/nav-rail.js';

import { initMediaArchive } from './media-manager.js';
import { HeroController } from './hero-controller.js';
import { SquadController } from './squad-controller.js';
import { MediaModalManager } from './modal/MediaModalManager.js';

import { FXController } from './FXController.js'; // НОВЫЙ ИМПОРТ

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
        
        // 3. Настройка графики и глобальных событий (без мусора в app.js)
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

// Здесь остались ТОЛЬКО системные и UI-ивенты, графика ушла в FXController
function registerGlobalEvents() {
    EventBus.on('CMD_CLEAR', () => {
        if (terminalCtrl && terminalCtrl.historyEl) terminalCtrl.historyEl.innerHTML = '';
    });
    
    EventBus.on('CMD_STATUS', () => EventBus.emit('SYS_LOG', { html: 'СИСТЕМЫ В НОРМЕ.' }));
    EventBus.on('CMD_MUSIC', () => EventBus.emit('UI_CLICK_MUSIC'));
    EventBus.on('CMD_PLAYER', () => EventBus.emit('UI_CLICK_MUSIC'));
    
    EventBus.on('CMD_HELP', () => {
        const helpHtml = `
        <div style="color:#888;">ДОСТУПНЫЕ ПРОТОКОЛЫ:</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="clear">CLEAR</span> - Очистить консоль и существ</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="dragon">DRAGON</span> - Запуск: Дракон</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="lizard">LIZARD</span> - Запуск: Ящерица</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="comet">COMET</span> - Запуск: Метеоры</div>
        <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="godmode">GODMODE</span> - Перезапись реальности</div>
        `;
        EventBus.emit('SYS_LOG', { html: helpHtml });
    });

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