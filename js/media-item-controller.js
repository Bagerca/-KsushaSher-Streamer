/* js/media-item-controller.js */
/*
 * Оркестратор страницы медиа-объекта.
 * Отвечает за соответствие URL <-> состояние страницы:
 *   #/item/{id}?part={subId}&slide={n}&v={youtubeId}&from=...&tab=...&page=...
 * Суб-состояние пишется через replace, чтобы не засорять историю браузера.
 */
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { ItemNavigation } from './media-item/ItemNavigation.js';
import { ItemRenderer } from './media-item/ItemRenderer.js';
import { ItemPosters } from './media-item/ItemPosters.js';
import { ItemPlayer } from './media-item/ItemPlayer.js';
import { buildStack, SWAP_DURATION } from './media-item/item-utils.js';

/** Ищет объект по id / title, включая вложенные элементы коллекций. */
function resolveMediaItem(mediaList, needle) {
    if (!needle || !Array.isArray(mediaList)) return null;
    const key = String(needle);
    const lower = key.toLowerCase();

    let hit = mediaList.find(i => String(i.id) === key);
    if (hit) return { item: hit, forcedPart: null };

    hit = mediaList.find(i => String(i.title) === key);
    if (hit) return { item: hit, forcedPart: null };

    hit = mediaList.find(i => String(i.title || '').toLowerCase() === lower);
    if (hit) return { item: hit, forcedPart: null };

    // Прямая ссылка на часть коллекции: #/item/bendy-dark-revival
    for (const parent of mediaList) {
        if (parent.format !== 'collection' || !Array.isArray(parent.items)) continue;
        const sub = parent.items.find(s => String(s.id) === key || String(s.title) === key);
        if (sub) return { item: parent, forcedPart: String(sub.id) };
    }
    return null;
}

export class MediaItemController {
    constructor() {
        this.container = document.getElementById('route-media-item');
        if (!this.container) return;

        this.els = {
            page: document.getElementById('media-item-page'),
            layout: document.getElementById('item-layout'),
            backBtn: document.getElementById('btn-item-back'),
            bg: document.getElementById('item-cinematic-bg'),
            statusBadge: document.getElementById('item-status-badge'),
            posterWrapper: document.getElementById('item-poster-wrapper'),
            posterDots: document.getElementById('item-poster-dots'),
            ratingBox: document.getElementById('item-rating-box'),
            ratingVal: document.getElementById('item-rating-val'),
            segments: document.getElementById('item-segments'),
            barcodeContainer: document.getElementById('item-barcode-container'),
            sysId: document.getElementById('item-sys-id'),
            dataType: document.getElementById('item-datatype'),
            mainZone: document.getElementById('item-main-zone'),
            title: document.getElementById('item-title-text'),
            googleLink: document.getElementById('item-google-link'),
            desc: document.getElementById('item-desc-text'),
            videoZone: document.getElementById('item-video-zone'),
            iframe: document.getElementById('item-iframe'),
            playlistCol: document.getElementById('item-playlist-col'),
            playlistList: document.getElementById('item-playlist-list')
        };

        this.fallbackColor = '#ff2d95';
        this.currentStack = [];
        this.currentRouteId = null;
        this.currentItemId = null;
        this.currentPartKey = null;
        this.currentVideoId = null;
        this.isRendered = false;
        this.swapTimer = null;
        this.waitUnsub = null;
        this.pendingItemId = null;

        this.renderer = new ItemRenderer(this.els);
        this.navigation = new ItemNavigation(this.els.backBtn);

        this.posters = new ItemPosters(this.els.posterWrapper, this.els.posterDots, {
            onActiveColor: (color) => this.renderer.applyThemeColor(color),
            onSlideChange: (item, color, index) => this.handleSlideChange(item, color, index)
        });

        this.player = new ItemPlayer(this.els, {
            onThemeColor: (color) => this.renderer.applyThemeColor(color),
            onBackground: (url) => this.renderer.setBackground(url),
            onTitleChange: (title) => {
                this.renderer.setTitle(title);
                AppRouter.setDocumentTitle(title);
            },
            onVideoChange: (videoId) => this.handleVideoChange(videoId)
        });

        this.subscribeToStore();
        console.log('🎬 [ItemPage] Контроллер инициализирован (URL-driven sub-state)');
    }

    /* ==================== STORE ==================== */

    subscribeToStore() {
        AppStore.subscribe((state) => {
            if (state.route.path !== '/item') return;
            const id = state.route.params.id;
            if (!id) return;
            if (id !== this.currentRouteId) {
                this.mount(id);
                return;
            }
            this.syncSubState(state.route.query);
        });
    }

    waitForData(itemId) {
        this.pendingItemId = itemId;
        if (this.waitUnsub) return;
        console.log('🎬 [ItemPage] База ещё грузится, ожидаем:', itemId);
        this.waitUnsub = AppStore.subscribe((state) => {
            if (!state.data.isMediaLoaded) return;
            const target = this.pendingItemId;
            this.clearWaiter();
            if (state.route.path === '/item' && state.route.params.id === target) {
                this.mount(target);
            }
        });
    }

    clearWaiter() {
        if (this.waitUnsub) {
            this.waitUnsub();
            this.waitUnsub = null;
        }
        this.pendingItemId = null;
    }

    /* ==================== LIFECYCLE ==================== */

    mount(itemId) {
        if (!itemId) {
            console.warn('⚠️ [ItemPage] Пустой ID — возврат в базу.');
            this.redirectToArchive();
            return;
        }

        const state = AppStore.getState();

        if (!state.data.isMediaLoaded) {
            this.waitForData(itemId);
            return;
        }

        if (this.currentRouteId === itemId && this.isRendered) {
            this.syncSubState(state.route.query);
            return;
        }

        const resolved = resolveMediaItem(state.data.media, itemId);
        if (!resolved) {
            console.warn(`⚠️ [ItemPage] Объект "${itemId}" не найден. Мягкий редирект (replace).`);
            this.redirectToArchive();
            return;
        }

        this.renderPage(resolved.item, itemId, resolved.forcedPart);
    }

    redirectToArchive() {
        const type = AppStore.getState().media.type || 'games';
        // replace — иначе кнопка "Назад" зацикливается на битой ссылке.
        AppRouter.navigate('/archive', { type }, {}, { replace: true });
    }

    unmount() {
        this.cancelSwap();
        this.clearWaiter();
        this.posters.invalidate();
        this.player.stop();
        if (this.els.layout) this.els.layout.classList.remove('page-enter');
        this.currentStack = [];
        this.currentRouteId = null;
        this.currentItemId = null;
        this.currentPartKey = null;
        this.currentVideoId = null;
        this.isRendered = false;
        console.log('🎬 [ItemPage] Компонент размонтирован');
    }

    /* ==================== РЕНДЕР ==================== */

    renderPage(item, routeId, forcedPart) {
        try {
            this.isRendered = false;
            this.currentRouteId = routeId;
            this.currentItemId = item.id;
            this.cancelSwap();
            window.scrollTo(0, 0);

            /* Тип выводим из самого объекта: ссылка не зависит от того,
               в какой вкладке пользователь находился. Это же чинит
               кнопку "Назад" при холодном открытии карточки кино. */
            if (item.type && AppStore.getState().media.type !== item.type) {
                AppStore.dispatch({ type: 'MEDIA_SYNC_STATE', payload: { type: item.type } });
            }

            const query = AppStore.getState().route.query;

            this.fallbackColor = item.customColor || (item.format === 'youtube' ? '#ff0000' : '#ff2d95');
            this.els.page.classList.toggle('is-cinema', item.format === 'youtube');

            this.currentStack = buildStack(item);
            const startIndex = this.resolveStartIndex(query, forcedPart);
            const active = this.currentStack[startIndex] || this.currentStack[0];

            this.posters.render(this.currentStack, this.fallbackColor, startIndex);
            this.currentPartKey = this.partKeyFor(active, startIndex);

            this.renderer.applyDataFields(active, item.type, this.fallbackColor);

            this.player.render(active.videos, active.format || item.format, active.status, {
                initialVideoId: query.v || null
            });
            this.currentVideoId = this.player.getActiveVideoId();

            this.navigation.updateLabel(query.from || 'archive');
            AppRouter.setDocumentTitle(active.title || item.title);

            this.els.layout.classList.remove('page-enter');
            void this.els.layout.offsetWidth;
            this.els.layout.classList.add('page-enter');

            this.isRendered = true;
            this.syncUrlSubState();

            console.log(`🎬 [ItemPage] Отрендерен объект: ${item.id} (part index ${startIndex})`);
        } catch (error) {
            console.error('❌ [ItemPage] Ошибка рендера страницы:', error);
            this.isRendered = true;
        }
    }

    resolveStartIndex(query, forcedPart = null) {
        const partId = query.part || forcedPart;
        if (partId) {
            const idx = this.currentStack.findIndex(
                s => !s.isImageOnly && String(s.id) === String(partId)
            );
            if (idx >= 0) return idx;
            console.warn(`⚠️ [ItemPage] Часть "${partId}" не найдена в стеке — открываю первую.`);
        }
        if (query.slide !== undefined) {
            const n = parseInt(query.slide, 10);
            if (Number.isFinite(n) && n >= 0 && n < this.currentStack.length) return n;
        }
        return 0;
    }

    partKeyFor(stackItem, index) {
        if (!stackItem) return 'none';
        return stackItem.isImageOnly ? `slide:${index}` : `part:${stackItem.id}`;
    }

    /* ==================== URL <-> СОСТОЯНИЕ ==================== */

    /** Пишет part/slide/v в адрес, только если они реально отличаются. */
    syncUrlSubState() {
        if (!this.isRendered) return;
        const state = AppStore.getState();
        if (state.route.path !== '/item') return;
        if (state.route.params.id !== this.currentRouteId) return;

        const index = this.posters.getCurrentIndex();
        const active = this.currentStack[index];
        const patch = { part: null, slide: null, v: null };

        if (active && index > 0) {
            if (active.isImageOnly) patch.slide = String(index);
            else patch.part = String(active.id);
        }

        const firstVideo = this.player.getFirstVideoId();
        if (this.currentVideoId && this.currentVideoId !== firstVideo) {
            patch.v = this.currentVideoId;
        }

        const query = state.route.query;
        const changed = ['part', 'slide', 'v'].some(
            key => (query[key] || null) !== (patch[key] || null)
        );
        if (!changed) return;

        AppRouter.updateQuery(patch, { replace: true });
    }

    /** Применяет состояние из URL (кнопки браузера, вставка ссылки). */
    syncSubState(query) {
        if (!this.isRendered) return;

        const index = this.resolveStartIndex(query);
        const active = this.currentStack[index];
        const key = this.partKeyFor(active, index);

        if (key !== this.currentPartKey) {
            this.posters.goTo(index);
            return;
        }

        const target = query.v || this.player.getFirstVideoId();
        if (target && target !== this.currentVideoId) {
            this.player.selectByVideoId(target);
        }
    }

    /* ==================== СОБЫТИЯ ==================== */

    handleSlideChange(item, color, index) {
        this.currentPartKey = this.partKeyFor(item, index);

        if (!item.isImageOnly) {
            this.currentVideoId = null; // старый ролик относится к другой части
            this.swapToItem(item, color);
        } else {
            this.renderer.applyThemeColor(color);
            this.renderer.setBackground(item.overrideImage || item.image);
        }
        this.syncUrlSubState();
    }

    handleVideoChange(videoId) {
        this.currentVideoId = videoId || null;
        this.syncUrlSubState();
    }

    swapToItem(currentItem, color) {
        this.cancelSwap();
        this.els.mainZone.classList.add('is-swapping');

        this.swapTimer = setTimeout(() => {
            this.swapTimer = null;
            try {
                this.renderer.applyDataFields(currentItem, currentItem.type, color);

                const desiredVideo = AppStore.getState().route.query.v || null;
                this.player.render(currentItem.videos, currentItem.format, currentItem.status, {
                    initialVideoId: desiredVideo
                });
                this.currentVideoId = this.player.getActiveVideoId();

                AppRouter.setDocumentTitle(currentItem.title);
                this.els.mainZone.classList.remove('is-swapping');
                this.syncUrlSubState();
            } catch (error) {
                console.error('❌ [ItemPage] Ошибка переключения части коллекции:', error);
                this.els.mainZone.classList.remove('is-swapping');
            }
        }, SWAP_DURATION);
    }

    cancelSwap() {
        if (this.swapTimer) {
            clearTimeout(this.swapTimer);
            this.swapTimer = null;
        }
        if (this.els.mainZone) this.els.mainZone.classList.remove('is-swapping');
    }
}