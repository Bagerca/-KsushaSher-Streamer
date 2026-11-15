/* js/media-item/ItemNavigation.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';

const BACK_LABELS = {
    library: '<i class="fas fa-chevron-left"></i> НАЗАД В БИБЛИОТЕКУ',
    youtube: '<i class="fas fa-chevron-left"></i> НАЗАД В YOUTUBE АРХИВ',
    tierlist: '<i class="fas fa-chevron-left"></i> НАЗАД В ТИРЛИСТ',
    agents: '<i class="fas fa-chevron-left"></i> НАЗАД К АГЕНТУ',
    archive: '<i class="fas fa-chevron-left"></i> НАЗАД В БАЗУ'
};

/**
 * Кнопка "Назад": подпись + маршрут возврата с восстановлением
 * типа, вкладки, страницы, поиска и сортировки исходного экрана.
 */
export class ItemNavigation {
    constructor(backBtn) {
        this.backBtn = backBtn;
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.goBack());
        }
    }

    updateLabel(from) {
        if (!this.backBtn) return;
        this.backBtn.innerHTML = BACK_LABELS[from] || BACK_LABELS.archive;
    }

    goBack() {
        EventBus.emit('PLAY_SOUND', 'click');

        const state = AppStore.getState();
        const query = state.route.query;
        const from = query.from || 'archive';
        const media = state.media;
        // Тип уже выставлен контроллером по самому объекту — возврат корректен
        // даже при холодном открытии ссылки.
        const type = media.type || 'games';

        const restore = {};
        if (media.searchQuery) restore.search = media.searchQuery;
        if (Array.isArray(media.filters) && media.filters.length > 0) restore.filters = media.filters.join(',');
        if (media.sort !== 'name') restore.sort = media.sort;
        if (media.sortDirection !== 'asc') restore.sortDir = media.sortDirection;
        if (media.gridMode !== 'detailed') restore.mode = media.gridMode;
        if (query.tab) restore.tab = query.tab;
        if (query.page) restore.page = query.page;

        try {
            if (from === 'library') {
                AppRouter.navigate('/library', { type }, restore);
            } else if (from === 'youtube') {
                const search = query.search || media.searchQuery || '';
                AppRouter.navigate('/youtube', {}, search ? { search } : {});
            } else if (from === 'tierlist') {
                AppRouter.navigate('/tierlist', { type }, query.edit ? { edit: '1' } : {});
            } else if (from === 'agents') {
                const agentId = query.agentId;
                AppRouter.navigate('/agents', agentId ? { id: agentId } : {});
            } else {
                AppRouter.navigate('/archive', { type }, restore);
            }
        } catch (error) {
            console.error('❌ [ItemNavigation] Ошибка возврата, падаю на хаб:', error);
            AppRouter.navigate('/');
        }
    }
}