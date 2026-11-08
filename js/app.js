/* js/app.js */

import EventBus from './event-bus.js';
import { AppConfig } from './config.js'; 
import { AppStore } from './store.js'; 
import { AppRouter } from './router.js'; 
import { PreloaderController } from './services/PreloaderController.js'; 

import { getDashboardView } from './views/dashboardView.js';
import { getTierlistView } from './views/tierlistView.js';
import { getMediaItemView } from './views/mediaItemView.js';
import { getLibraryView } from './views/libraryView.js';
import { getYoutubeLibraryView } from './views/youtubeLibraryView.js';
import { getAgentsView } from './views/agentsView.js';

import { SynthEngine } from './services/SynthEngine.js'; 
import { ConfigInjector } from './services/ConfigInjector.js';
import { MobileOptimizer } from './services/MobileOptimizer.js'; 
import { FXController } from './FXController.js'; 

import { TerminalController } from './terminal-core.js';
import { SettingsMenu } from './settings-menu.js';
import { registerTerminalCommands } from './terminal-commands.js'; 

import { initScrollPhysics } from './ui/scroll-physics.js';
import { initCryptoWidget } from './ui/crypto-widget.js';
import { initNavRail } from './ui/nav-rail.js';
import { initSpecs } from './ui/SpecsRenderer.js'; 
import { CursorController } from './ui/CursorController.js'; // ДОБАВЛЕН ИМПОРТ

import { initMediaArchive } from './media-manager.js';
import { HeroController } from './hero-controller.js';
import { SquadController } from './squad-controller.js';

import { ScheduleManager } from './schedule.js';
import { SubscribersManager } from './subscribers.js';
import { HubController } from './hub-controller.js';
import { StatsManager } from './stats.js'; 
import { initMusicPlayer, toggleMusicMode } from './music-player.js';
import { replaceIcons } from './utils/icons.js'; 

import { TierlistController } from './tierlist/TierlistController.js';
import { MediaItemController } from './media-item-controller.js';
import { LibraryController } from './library-controller.js';
import { YoutubeLibraryController } from './youtube-library-controller.js';
import { AgentsController } from './agents-controller.js';

let terminalCtrl;
let scheduleMgr;
let statsMgr; 
let tierlistCtrl;
let mediaItemCtrl;
let libraryCtrl; 
let youtubeLibCtrl; 
let agentsCtrl;

window.navRailInstance = null;

let dashboardScrollPosition = 0;
let libraryScrollPosition = 0;
let youtubeScrollPosition = 0;
let agentsScrollPosition = 0;

function bootstrap() {
    if (window.AppState && window.AppState.initialized) return;
    
    try {
        console.log(`🚀 [Boot] Запуск системы ${AppConfig.system.osName} ${AppConfig.system.osVersion}...`);
        
        PreloaderController.init();
        
        const appRoot = document.getElementById('app');
        if (appRoot) {
            appRoot.innerHTML = `
                <div id="route-dashboard">${getDashboardView()}</div>
                <div id="route-library" style="display: none;">${getLibraryView()}</div>
                <div id="route-youtube" style="display: none;">${getYoutubeLibraryView()}</div>
                <div id="route-agents" style="display: none;">${getAgentsView()}</div>
                <div id="route-tierlist" style="display: none;">${getTierlistView()}</div>
                <div id="route-media-item" style="display: none;">${getMediaItemView()}</div>
                <div id="modals-root"></div>
            `;
            replaceIcons(appRoot);
            console.log('🏗️ [Boot] DOM структура смонтирована (SPA Mode)');
        }

        const iconObserver = new MutationObserver(() => replaceIcons(document.body));
        iconObserver.observe(document.body, { childList: true, subtree: true });

        new SynthEngine(); 
        terminalCtrl = new TerminalController();
        const fxController = new FXController();
        
        if (!MobileOptimizer.isMobile()) {
            new SettingsMenu();
            initScrollPhysics();
            window.navRailInstance = initNavRail();
            new CursorController(); // ЗАПУСК КУРСОРНОГО ДВИЖКА ТОЛЬКО НА ПК
        }
        
        initCryptoWidget();
        initSpecs(); 
        ConfigInjector.init(); 
        
        new HeroController();
        new SquadController();
        
        fxController.init();
        registerGlobalEvents();
        MobileOptimizer.applyMobilePatches(terminalCtrl, fxController);

        scheduleMgr = new ScheduleManager();
        const subsMgr = new SubscribersManager();
        statsMgr = new StatsManager();
        new HubController();
        
        tierlistCtrl = new TierlistController();
        mediaItemCtrl = new MediaItemController();
        libraryCtrl = new LibraryController(); 
        youtubeLibCtrl = new YoutubeLibraryController(); 
        agentsCtrl = new AgentsController();

        AppStore.subscribe((state, prevState) => {
            const currentPath = state.route.path;
            const prevPath = prevState?.route?.path;

            if (currentPath !== prevPath) {
                const dashEl = document.getElementById('route-dashboard');
                const tierEl = document.getElementById('route-tierlist');
                const itemEl = document.getElementById('route-media-item');
                const libEl = document.getElementById('route-library'); 
                const ytLibEl = document.getElementById('route-youtube'); 
                const agentsEl = document.getElementById('route-agents'); 
                
                if (prevPath === '/' || prevPath === '/archive') dashboardScrollPosition = window.scrollY;
                if (prevPath === '/library') libraryScrollPosition = window.scrollY;
                if (prevPath === '/youtube') youtubeScrollPosition = window.scrollY;
                if (prevPath && prevPath.startsWith('/agents')) agentsScrollPosition = window.scrollY;

                dashEl.style.display = 'none';
                tierEl.style.display = 'none';
                itemEl.style.display = 'none';
                libEl.style.display = 'none'; 
                ytLibEl.style.display = 'none';
                agentsEl.style.display = 'none';
                document.body.classList.remove('route-dashboard', 'route-tierlist', 'route-item', 'route-library', 'route-youtube', 'route-agents');

                if (prevPath && prevPath.startsWith('/tierlist')) tierlistCtrl.unmount();
                if (prevPath && prevPath.startsWith('/item')) mediaItemCtrl.unmount();
                if (prevPath && prevPath.startsWith('/library')) libraryCtrl.unmount();
                if (prevPath && prevPath.startsWith('/youtube')) youtubeLibCtrl.unmount();
                if (prevPath && prevPath.startsWith('/agents')) agentsCtrl.unmount();

                if (currentPath.startsWith('/tierlist')) {
                    document.body.classList.add('route-tierlist');
                    tierEl.style.display = 'block';
                    AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
                    tierlistCtrl.mount();
                    window.scrollTo(0, 0);

                } else if (currentPath.startsWith('/item')) {
                    document.body.classList.add('route-item');
                    itemEl.style.display = 'block';
                    AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
                    mediaItemCtrl.mount(state.route.params.id);

                } else if (currentPath.startsWith('/library')) { 
                    document.body.classList.add('route-library');
                    libEl.style.display = 'block';
                    AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
                    libraryCtrl.mount();
                    setTimeout(() => window.scrollTo(0, libraryScrollPosition), 10);

                } else if (currentPath.startsWith('/youtube')) { 
                    document.body.classList.add('route-youtube');
                    ytLibEl.style.display = 'block';
                    AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
                    youtubeLibCtrl.mount();
                    setTimeout(() => window.scrollTo(0, youtubeScrollPosition), 10);

                } else if (currentPath.startsWith('/agents')) { 
                    document.body.classList.add('route-agents');
                    agentsEl.style.display = 'block';
                    AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
                    agentsCtrl.mount(state.route.params.id);
                    if (prevPath && prevPath.startsWith('/agents')) {
                        setTimeout(() => window.scrollTo(0, agentsScrollPosition), 10);
                    } else {
                        window.scrollTo(0, 0);
                    }

                } else {
                    document.body.classList.add('route-dashboard');
                    dashEl.style.display = 'block';
                    AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: false });
                    window.scrollTo(0, dashboardScrollPosition);

                    if (window.navRailInstance) {
                        requestAnimationFrame(() => window.navRailInstance.updatePositions());
                    }
                }
            }
        });

        AppRouter.init();

        scheduleMgr.init().catch(e => console.warn('Ошибка загрузки расписания', e));
        subsMgr.init().catch(e => console.warn('Ошибка загрузки агентов', e));
        statsMgr.init().catch(e => console.warn('Ошибка загрузки статистики Twitch', e));
        initMediaArchive().catch(e => console.warn('Ошибка загрузки базы медиа', e));
        initMusicPlayer().catch(e => console.warn('Ошибка инициализации плеера', e));

        if (window.globalSyncInterval) clearInterval(window.globalSyncInterval);
        window.globalSyncInterval = setInterval(async () => {
            scheduleMgr.init();
            statsMgr.init(); 
            EventBus.emit('SYS_LOG', { html: "<span style='color:#555'>[SYS] Background data sync complete.</span>" });
        }, 300000);
        
        window.AppState = { initialized: true };
        console.log('✅ [Boot] Инициализация завершена успешно!');
        
    } catch (error) {
        console.error('❌ [Boot] Критическая ошибка при инициализации:', error);
    }
}

function registerGlobalEvents() {
    EventBus.on('CMD_CLEAR', () => { if (terminalCtrl && terminalCtrl.historyEl) terminalCtrl.historyEl.innerHTML = ''; });
    EventBus.on('CMD_STATUS', () => EventBus.emit('SYS_LOG', { html: 'СИСТЕМЫ В НОРМЕ.' }));
    EventBus.on('CMD_MUSIC', () => EventBus.emit('UI_CLICK_MUSIC'));
    EventBus.on('CMD_PLAYER', () => EventBus.emit('UI_CLICK_MUSIC'));
    
    registerTerminalCommands();
    EventBus.on('UI_CLICK_MUSIC', () => toggleMusicMode());
    EventBus.on('UI_CLICK_REFRESH', () => { scheduleMgr.init(); statsMgr.init(); });

    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.code === 'KeyT' && !document.body.classList.contains('modal-open')) {
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                AppRouter.navigate('/tierlist');
            }
        }
    });
}

window.addEventListener('error', e => console.error('🚨 [System] Uncaught Error:', e.error));

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bootstrap); } 
else { bootstrap(); }

export function addLogLine(html, isTyping = false, forceScroll = false) { if (terminalCtrl) return terminalCtrl.addLogLine(html, isTyping, forceScroll); }
export function setSystemNoiseState(isEnabled) { if (terminalCtrl) terminalCtrl.setSystemNoiseState(isEnabled); }   