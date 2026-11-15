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
import { CursorController } from './ui/CursorController.js';
import { AutoScrollController } from './ui/AutoScrollController.js';
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
let hasAppliedRoute = false;
let pendingArchiveScroll = false;

/* ==========================================================
   НАДЁЖНОЕ ВОССТАНОВЛЕНИЕ СКРОЛЛА
   Сетки рендерятся асинхронно, поэтому одного setTimeout(10) мало:
   высота документа ещё нулевая и браузер отбрасывает scrollTo.
   ========================================================== */
function restoreScroll(targetY, attempts = 8) {
    requestAnimationFrame(() => {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const y = Math.min(Math.max(0, targetY), maxScroll);
        window.scrollTo(0, y);
        if (attempts > 0 && Math.abs(window.scrollY - y) > 2) {
            restoreScroll(targetY, attempts - 1);
        }
    });
}

function scrollToArchiveSection() {
    const section = document.getElementById('media-archive');
    if (!section) return;
    const y = Math.max(0, section.getBoundingClientRect().top + window.scrollY - 20);
    restoreScroll(y, 4);
    console.log('📂 [Boot] Deep-link на архив: прокрутка к секции базы данных.');
}

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
            new CursorController();
            new AutoScrollController();
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

        AppStore.subscribe(handleRouteVisibility);

        /* MediaStore создаётся СИНХРОННО внутри initMediaArchive (до первого await),
           поэтому он успевает подписаться ДО первого ROUTE_SYNC. */
        initMediaArchive().catch(e => console.error('❌ [Boot] Ошибка загрузки базы медиа:', e));

        AppRouter.init();

        scheduleMgr.init().catch(e => console.warn('⚠️ [Boot] Ошибка загрузки расписания:', e));
        subsMgr.init().catch(e => console.warn('⚠️ [Boot] Ошибка загрузки агентов:', e));
        statsMgr.init().catch(e => console.warn('⚠️ [Boot] Ошибка загрузки статистики Twitch:', e));
        initMusicPlayer().catch(e => console.warn('⚠️ [Boot] Ошибка инициализации плеера:', e));

        if (window.globalSyncInterval) clearInterval(window.globalSyncInterval);
        window.globalSyncInterval = setInterval(() => {
            try {
                scheduleMgr.init();
                statsMgr.init();
                EventBus.emit('SYS_LOG', { html: "<span style='color:var(--color-text-muted)'>[SYS] Background data sync complete.</span>" });
            } catch (error) {
                console.error('🚨 [Boot] Ошибка фоновой синхронизации:', error);
            }
        }, 300000);

        window.AppState = { initialized: true };
        console.log('✅ [Boot] Инициализация завершена успешно!');
    } catch (error) {
        console.error('❌ [Boot] Критическая ошибка при инициализации:', error);
        AppStore.dispatch({ type: 'SYSTEM_SET_ERROR', payload: String(error && error.message || error) });
    }
}

/* ==========================================================
   ЕДИНСТВЕННЫЙ ОБРАБОТЧИК ВИДИМОСТИ ЭКРАНОВ
   Реагирует на смену path, а также на смену id внутри /item.
   ========================================================== */
function handleRouteVisibility(state, prevState) {
    const current = state.route;
    const prev = prevState ? prevState.route : null;
    const currentPath = current.path;
    const prevPath = prev ? prev.path : null;

    const pathChanged = currentPath !== prevPath;
    const idChanged = (current.params.id || '') !== ((prev && prev.params.id) || '');

    if (!hasAppliedRoute) {
        // Первый прогон: обязательно проставляем классы и видимость,
        // даже если маршрут совпал с initialState ('/').
        hasAppliedRoute = true;
    } else if (!pathChanged) {
        // Внутри /item переключение объекта по ссылке/кнопке "Назад".
        if (currentPath === '/item' && idChanged && mediaItemCtrl) {
            console.log('🎬 [Router] Смена объекта внутри /item:', current.params.id);
            mediaItemCtrl.mount(current.params.id);
        }
        // /agents сам обрабатывает смену id через свою подписку (с анимацией).
        return;
    }

    const dashEl = document.getElementById('route-dashboard');
    const tierEl = document.getElementById('route-tierlist');
    const itemEl = document.getElementById('route-media-item');
    const libEl = document.getElementById('route-library');
    const ytLibEl = document.getElementById('route-youtube');
    const agentsEl = document.getElementById('route-agents');

    if (!dashEl || !tierEl || !itemEl || !libEl || !ytLibEl || !agentsEl) {
        console.error('🚨 [Router] Не найдены контейнеры маршрутов. Рендер невозможен.');
        return;
    }

    // 1. Сохраняем скролл покидаемого экрана
    if (prevPath === '/' || prevPath === '/archive') dashboardScrollPosition = window.scrollY;
    if (prevPath === '/library') libraryScrollPosition = window.scrollY;
    if (prevPath === '/youtube') youtubeScrollPosition = window.scrollY;
    if (prevPath === '/agents') agentsScrollPosition = window.scrollY;

    // 2. Гасим все экраны
    dashEl.style.display = 'none';
    tierEl.style.display = 'none';
    itemEl.style.display = 'none';
    libEl.style.display = 'none';
    ytLibEl.style.display = 'none';
    agentsEl.style.display = 'none';

    document.body.classList.remove(
        'route-dashboard', 'route-tierlist', 'route-item',
        'route-library', 'route-youtube', 'route-agents'
    );

    // 3. Размонтируем предыдущий контроллер
    try {
        if (prevPath === '/tierlist' && tierlistCtrl) tierlistCtrl.unmount();
        if (prevPath === '/item' && mediaItemCtrl) mediaItemCtrl.unmount();
        if (prevPath === '/library' && libraryCtrl) libraryCtrl.unmount();
        if (prevPath === '/youtube' && youtubeLibCtrl) youtubeLibCtrl.unmount();
        if (prevPath === '/agents' && agentsCtrl) agentsCtrl.unmount();
    } catch (error) {
        console.error('🚨 [Router] Ошибка размонтирования:', error);
    }

    // 4. Монтируем новый
    try {
        if (currentPath === '/tierlist') {
            document.body.classList.add('route-tierlist');
            tierEl.style.display = 'block';
            AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
            tierlistCtrl.mount();
            window.scrollTo(0, 0);
        } else if (currentPath === '/item') {
            document.body.classList.add('route-item');
            itemEl.style.display = 'block';
            AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
            mediaItemCtrl.mount(current.params.id);
        } else if (currentPath === '/library') {
            document.body.classList.add('route-library');
            libEl.style.display = 'block';
            AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
            libraryCtrl.mount();
            restoreScroll(libraryScrollPosition);
        } else if (currentPath === '/youtube') {
            document.body.classList.add('route-youtube');
            ytLibEl.style.display = 'block';
            AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
            youtubeLibCtrl.mount();
            restoreScroll(youtubeScrollPosition);
        } else if (currentPath === '/agents') {
            document.body.classList.add('route-agents');
            agentsEl.style.display = 'block';
            AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: true });
            agentsCtrl.mount(current.params.id);
            if (prevPath === '/agents') restoreScroll(agentsScrollPosition);
            else window.scrollTo(0, 0);
        } else {
            document.body.classList.add('route-dashboard');
            dashEl.style.display = 'block';
            AppStore.dispatch({ type: 'FX_SET_PAUSE', payload: false });

            if (currentPath === '/archive' && !prevPath) {
                // Холодный deep-link на архив: сначала верх, потом к секции.
                window.scrollTo(0, 0);
                pendingArchiveScroll = true;
                if (AppStore.getState().data.isMediaLoaded) {
                    pendingArchiveScroll = false;
                    setTimeout(scrollToArchiveSection, 150);
                }
            } else {
                restoreScroll(dashboardScrollPosition);
            }

            if (window.navRailInstance) {
                requestAnimationFrame(() => window.navRailInstance.updatePositions());
            }
        }
    } catch (error) {
        console.error(`🚨 [Router] Ошибка монтирования экрана "${currentPath}":`, error);
    }
}

function registerGlobalEvents() {
    EventBus.on('CMD_CLEAR', () => {
        if (terminalCtrl && terminalCtrl.historyEl) terminalCtrl.historyEl.innerHTML = '';
    });
    EventBus.on('CMD_STATUS', () => EventBus.emit('SYS_LOG', { html: 'СИСТЕМЫ В НОРМЕ.' }));
    EventBus.on('CMD_MUSIC', () => EventBus.emit('UI_CLICK_MUSIC'));
    EventBus.on('CMD_PLAYER', () => EventBus.emit('UI_CLICK_MUSIC'));

    registerTerminalCommands();

    EventBus.on('UI_CLICK_MUSIC', () => toggleMusicMode());
    EventBus.on('UI_CLICK_REFRESH', () => {
        scheduleMgr.init();
        statsMgr.init();
    });

    EventBus.on('MEDIA_STORE_LOADED', () => {
        if (!pendingArchiveScroll) return;
        pendingArchiveScroll = false;
        setTimeout(scrollToArchiveSection, 150);
    });

    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.code === 'KeyT') {
            const tag = document.activeElement ? document.activeElement.tagName : '';
            if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                AppRouter.navigate('/tierlist', { type: AppStore.getState().media.type });
            }
        }
    });
}

window.addEventListener('error', (e) => {
    console.error('🚨 [System] Uncaught Error:', e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 [System] Unhandled Promise Rejection:', e.reason);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

export function addLogLine(html, isTyping = false, forceScroll = false) {
    if (terminalCtrl) return terminalCtrl.addLogLine(html, isTyping, forceScroll);
    return null;
}

export function setSystemNoiseState(isEnabled) {
    if (terminalCtrl) terminalCtrl.setSystemNoiseState(isEnabled);
}