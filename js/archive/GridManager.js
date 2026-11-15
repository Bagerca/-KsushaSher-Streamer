/* js/archive/GridManager.js */
import EventBus from '../event-bus.js';
import { AppRouter } from '../router.js';
import { AppStore } from '../store.js';
import { ArchivePagination } from './ArchivePagination.js';
import { SearchEngine } from '../services/SearchEngine.js';
import { isArchiveRoute, navigateArchive, buildItemQuery } from './archive-url.js';

const CATEGORY_DEFS = [
    { id: 'completed', match: ['completed', 'watched'] },
    { id: 'playing', match: ['playing', 'watching'] },
    { id: 'on-hold', match: ['on-hold'] },
    { id: 'dropped', match: ['dropped'] },
    { id: 'suggested', match: ['suggested'] }
];

/**
 * Сетка архива с пагинацией, управляемой адресной строкой.
 * Номер страницы — часть URL (?page=N), поэтому ссылку на третью
 * страницу можно скопировать, отправить и открыть в новой вкладке.
 */
export class GridManager {
    constructor(store, cardFactory, lazyLoader) {
        this.store = store;
        this.factory = cardFactory;
        this.lazyLoader = lazyLoader;

        this.els = {
            wrapper: document.getElementById('archive-grid-wrapper'),
            gridMain: document.getElementById('archive-grid-main')
        };
        if (!this.els.gridMain || !this.els.wrapper) {
            console.error('🚨 [Archive] Не найдены контейнеры сетки архива.');
            return;
        }

        const media = AppStore.getState().media;
        this.currentPage = media.currentPage || 1;
        this.gridMode = media.gridMode || 'detailed';
        this.stdPerPage = 12;
        this.totalPages = 1;
        this.pageItems = [];
        this.isAnimating = false;
        this.animationSessionId = 0;
        this.lastColsCount = 0;
        this.lastIsMobile = false;
        this.resizeDebounceTimer = null;
        this.lastDataKey = this.getDataKey(media);

        this.pagination = new ArchivePagination({
            onPageChange: (value, isAbsolute = false) => {
                this.goToPage(isAbsolute ? value : this.currentPage + value);
            }
        });

        if (this.gridMode === 'compact') this.els.gridMain.classList.add('compact-mode');
        this.bindEvents();
        console.log('📂 [Archive] GridManager инициализирован (URL-driven pagination)');
    }

    getDataKey(media) {
        return [
            media.type,
            media.searchQuery,
            (media.filters || []).join(','),
            media.sort,
            media.sortDirection
        ].join('|');
    }

    setGridMode(mode) {
        this.gridMode = mode === 'compact' ? 'compact' : 'detailed';
        this.els.gridMain.classList.toggle('compact-mode', this.gridMode === 'compact');
        // Плотность меняет число карточек на странице — нумерация сбрасывается.
        this.currentPage = 1;
        navigateArchive({ mode: this.gridMode === 'compact' ? 'compact' : null, page: null }, { replace: true });
        this.transition('page-slide-down-out', 'entering-from-top');
    }

    getColumnsCount() {
        let gridWidth = this.els.gridMain.clientWidth;
        if (gridWidth === 0) {
            const containerMax = Math.min(window.innerWidth * 0.95, 1650);
            gridWidth = containerMax - 52 - 30;
        }
        return this.gridMode === 'compact'
            ? Math.max(1, Math.floor((gridWidth + 12) / (160 + 12)))
            : Math.max(1, Math.floor((gridWidth + 20) / (230 + 20)));
    }

    bindEvents() {
        EventBus.on('MEDIA_STORE_LOADING', () => {
            this.animationSessionId++;
            this.isAnimating = true;
            this.els.gridMain.classList.remove('entering-from-bottom', 'entering-from-top');
            this.els.gridMain.classList.add('page-slide-up-out');
        });

        EventBus.on('MEDIA_STORE_LOADED', () => {
            const media = AppStore.getState().media;
            this.currentPage = media.currentPage || 1;
            this.lastDataKey = this.getDataKey(media);
            this.transition('page-slide-up-out', 'entering-from-bottom');
        });

        EventBus.on('MEDIA_STORE_UPDATED', () => {
            const media = AppStore.getState().media;
            this.currentPage = media.currentPage || 1;
            this.lastDataKey = this.getDataKey(media);
            this.transition('page-slide-down-out', 'entering-from-top');
        });

        EventBus.on('MEDIA_STORE_SILENT_UPDATE', () => {
            const allItems = this.store.combinedData || [];
            this.els.gridMain.querySelectorAll('.archive-card-container').forEach(card => {
                const itemData = allItems.find(i => i.id === card.dataset.id);
                if (!itemData) return;
                const titleEl = card.querySelector('.card-title');
                if (titleEl && titleEl.textContent !== itemData.title) {
                    titleEl.textContent = itemData.title;
                    titleEl.title = itemData.title;
                }
            });
        });

        AppStore.subscribe((state, prevState) => {
            if (!isArchiveRoute(state.route.path)) return;
            const media = state.media;
            const prev = (prevState && prevState.media) || media;

            if (media.gridMode !== prev.gridMode) {
                this.setGridMode(media.gridMode);
                return;
            }

            const key = this.getDataKey(media);
            if (key !== this.lastDataKey) {
                // Изменились данные — рендер возьмут на себя события MediaStore.
                this.lastDataKey = key;
                this.currentPage = media.currentPage || 1;
                return;
            }

            const target = media.currentPage || 1;
            if (target !== this.currentPage) this.animateToPage(target);
        });

        this.els.wrapper.addEventListener('click', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || card.classList.contains('archive-divider-row')) return;

            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) return;

            const item = state.data.media.find(i => i.id === card.dataset.id);
            if (!item) {
                console.warn(`⚠️ [Archive] Карточка "${card.dataset.id}" отсутствует в базе.`);
                return;
            }

            EventBus.emit('PLAY_SOUND', 'expand');
            const query = buildItemQuery();

            // Открываем коллекцию сразу на той части, которую видно в текущей категории.
            const virtual = this.pageItems.find(i => i.id === item.id);
            if (item.format === 'collection' && Array.isArray(item.items) && virtual) {
                const entry = item.items.find(sub => (sub.status || item.status) === virtual.status);
                if (entry && entry.id) query.part = String(entry.id);
            }

            AppRouter.navigate('/item', { id: item.id }, query);
        });

        this.els.wrapper.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.archive-card-container');
            if (!card || this.gridMode === 'compact') return;
            card.querySelectorAll('.layer-back[data-lazy-bg], .layer-back-deep[data-lazy-bg]').forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl && !layer.style.backgroundImage) {
                    this.lazyLoader._safeImageLoad(bgUrl, card.classList.contains('is-youtube'), layer, null, null, layer);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }, true);

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeDebounceTimer);
            this.resizeDebounceTimer = setTimeout(() => {
                const cols = this.getColumnsCount();
                const isMobile = window.innerWidth <= 600;
                if (this.lastColsCount !== cols || this.lastIsMobile !== isMobile) {
                    this.els.gridMain.style.minHeight = '0px';
                    try { this.renderGrid(); }
                    catch (error) { console.error('🚨 [Archive] Ошибка рендера при resize:', error); }
                }
            }, 300);
        });
    }

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    /** Один анимационный конвейер: новая сессия всегда отменяет предыдущую. */
    async transition(outClass, inClass) {
        const session = ++this.animationSessionId;
        const grid = this.els.gridMain;
        this.isAnimating = true;
        this.pagination.closeSelector();

        grid.classList.remove('page-slide-up-out', 'page-slide-down-out', 'entering-from-top', 'entering-from-bottom');
        grid.classList.add(outClass);

        await this.sleep(220);
        if (session !== this.animationSessionId) return;

        grid.classList.remove(outClass);
        try { this.renderGrid(); }
        catch (error) { console.error('🚨 [Archive] Ошибка рендера карточек:', error); }
        grid.classList.add(inClass);

        await this.sleep(480);
        if (session !== this.animationSessionId) return;

        grid.classList.remove(inClass);
        grid.querySelectorAll('.animate-entry').forEach(card => {
            card.classList.remove('animate-entry');
            card.style.animationDelay = '';
        });
        this.isAnimating = false;
        EventBus.emit('LAYOUT_CHANGED');
    }

    async animateToPage(page) {
        const target = Math.max(1, parseInt(page, 10) || 1);
        if (target === this.currentPage) return;
        const forward = target > this.currentPage;
        this.currentPage = target;
        console.log(`📂 [Archive] Переход на страницу ${target} (из URL)`);
        await this.transition(
            forward ? 'page-slide-up-out' : 'page-slide-down-out',
            forward ? 'entering-from-bottom' : 'entering-from-top'
        );
    }

    /** Клик пользователя: пишем страницу в URL, рендер придёт из Store. */
    goToPage(page) {
        const target = parseInt(page, 10);
        if (!Number.isFinite(target)) return;
        if (target < 1 || target > this.totalPages || target === this.currentPage) return;
        this.pagination.closeSelector();
        navigateArchive({ page: target > 1 ? String(target) : null });
    }

    /** Клампинг после смены данных: правим адрес без записи в историю. */
    syncClampedPage(page) {
        this.currentPage = page;
        const route = AppStore.getState().route;
        if (!isArchiveRoute(route.path)) return;
        const urlPage = parseInt(route.query.page || '1', 10);
        if (urlPage === page) return;
        console.log(`📂 [Archive] Страница скорректирована: ${urlPage} -> ${page}`);
        navigateArchive({ page: page > 1 ? String(page) : null }, { replace: true });
    }

    renderGrid() {
        this.lastColsCount = this.getColumnsCount();
        this.lastIsMobile = window.innerWidth <= 600;
        this.stdPerPage = this.lastIsMobile ? 6 : this.lastColsCount * 2;

        const state = AppStore.getState().media;
        const allData = this.store.combinedData || [];
        const searchQuery = state.searchQuery || '';

        const buckets = { 'completed': [], 'playing': [], 'on-hold': [], 'dropped': [], 'suggested': [] };

        allData.forEach(item => {
            if (item.type !== state.type || item.format === 'youtube') return;

            let matchScore = 1;
            if (searchQuery.length > 0) {
                let textToSearch = `${item.title || ''} ${item.description || ''}`.toLowerCase();
                if (item.format === 'collection' && Array.isArray(item.items)) {
                    item.items.forEach(sub => { textToSearch += ` ${sub.title || ''} ${sub.description || ''}`; });
                }
                matchScore = SearchEngine.scoreItemForGrid(textToSearch, item.title, searchQuery);
                if (matchScore === 0) return;
            }

            if (item.format === 'collection' && Array.isArray(item.items)) {
                CATEGORY_DEFS.forEach(cat => {
                    const matching = item.items.filter(sub => cat.match.includes(sub.status || item.status));
                    if (matching.length === 0) return;
                    const virtual = {
                        ...item,
                        status: matching[0].status || item.status,
                        items: item.items,
                        image: matching[0].image || item.image,
                        images: matching.slice(0, 3).map(i => i.image).filter(Boolean),
                        customColor: matching[0].customColor || item.customColor,
                        _matchScore: matchScore
                    };
                    const base = virtual.customColor || 'var(--color-bg-medium)';
                    virtual.stackColors = [
                        base,
                        (matching[1] && matching[1].customColor) || base,
                        (matching[2] && matching[2].customColor) || base
                    ];
                    buckets[cat.id].push(virtual);
                });
            } else {
                const target = CATEGORY_DEFS.find(c => c.match.includes(item.status || 'unknown'));
                if (target) buckets[target.id].push({ ...item, _matchScore: matchScore });
            }
        });

        const dir = state.sortDirection === 'asc' ? 1 : -1;
        const sortFn = (a, b) => {
            if (searchQuery.length > 0 && Math.abs((a._matchScore || 0) - (b._matchScore || 0)) > 0.1) {
                return (b._matchScore || 0) - (a._matchScore || 0);
            }
            if (state.sort === 'rating') return ((a.rating || 0) - (b.rating || 0)) * dir;
            return (a.title || '').localeCompare(b.title || '') * dir;
        };

        let totalPages = 0;
        const bucketsMeta = [];
        CATEGORY_DEFS.forEach(cat => {
            const arr = buckets[cat.id];
            arr.sort(sortFn);
            const pages = Math.ceil(arr.length / this.stdPerPage);
            bucketsMeta.push({
                id: cat.id,
                items: arr,
                pageCount: pages,
                startPage: totalPages + 1,
                endPage: totalPages + pages
            });
            totalPages += pages;
        });

        this.totalPages = totalPages;

        if (totalPages === 0) {
            this.pageItems = [];
            this.els.gridMain.innerHTML = '<div class="suggestion-empty" style="width:100%; padding:60px 20px;"><i class="fas fa-search"></i>ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>';
            this.els.gridMain.style.minHeight = '0px';
            this.pagination.render({ totalPages: 0, currentPage: 1, bucketsMeta: [], type: state.type });
            this.syncClampedPage(1);
            EventBus.emit('LAYOUT_CHANGED');
            return;
        }

        if (this.currentPage > totalPages) this.syncClampedPage(totalPages);
        if (this.currentPage < 1) this.syncClampedPage(1);

        let targetBucket = bucketsMeta.find(b => this.currentPage >= b.startPage && this.currentPage <= b.endPage);
        if (!targetBucket) {
            targetBucket = bucketsMeta.find(b => b.pageCount > 0);
            if (targetBucket) this.syncClampedPage(targetBucket.startPage);
        }
        if (!targetBucket) return;

        const localPage = this.currentPage - targetBucket.startPage;
        const startIdx = localPage * this.stdPerPage;
        const pageData = targetBucket.items.slice(startIdx, startIdx + this.stdPerPage);
        this.pageItems = pageData;

        this.els.gridMain.innerHTML = pageData
            .map((item, index) => this.factory.createCardHTML(item, index * 30))
            .join('');

        requestAnimationFrame(() => {
            if (this.lastIsMobile) {
                this.els.gridMain.style.minHeight = '0px';
            } else {
                const gap = this.gridMode === 'compact' ? 12 : 20;
                const cardWidth = this.gridMode === 'compact' ? 160 : 230;
                this.els.gridMain.style.minHeight = `${((cardWidth * 1.5) * 2) + gap}px`;
            }
            this.els.gridMain.style.alignContent = 'start';
        });

        this.els.gridMain.querySelectorAll('.archive-card-container:not(.is-observed)').forEach(card => {
            card.classList.add('is-observed');
            this.lazyLoader.observe(card);
        });

        this.pagination.render({
            totalPages: this.totalPages,
            currentPage: this.currentPage,
            bucketsMeta,
            type: state.type
        });
    }
}