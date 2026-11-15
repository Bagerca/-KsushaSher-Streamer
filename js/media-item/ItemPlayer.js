/* js/media-item/ItemPlayer.js */
import EventBus from '../event-bus.js';
import { getYouTubeId, extractColorFromImageAsync } from '../utils.js';
import { getVideoThumbUrl, getEmbedUrl } from './item-utils.js';

/* Кэш названий роликов на всё приложение: не дёргаем noembed повторно. */
const titleCache = new Map();

/**
 * Плеер + плейлист.
 * Поддерживает адресацию конкретного ролика (?v=youtubeId) и переключение
 * без полного перерендера списка.
 */
export class ItemPlayer {
    constructor(els, callbacks = {}) {
        this.els = els;
        this.onThemeColor = callbacks.onThemeColor || (() => {});
        this.onBackground = callbacks.onBackground || (() => {});
        this.onTitleChange = callbacks.onTitleChange || (() => {});
        this.onVideoChange = callbacks.onVideoChange || (() => {});

        this.session = 0;
        this.videoColorCache = new Map();
        this.cards = new Map();
        this.firstVideoId = null;
        this.activeVideoId = null;
        this.isYouTube = false;
        this.status = null;
    }

    getFirstVideoId() {
        return this.firstVideoId;
    }

    getActiveVideoId() {
        return this.activeVideoId;
    }

    render(videos, format, status, options = {}) {
        const session = ++this.session;
        this.videoColorCache.clear();
        this.cards.clear();
        this.firstVideoId = null;
        this.activeVideoId = null;
        this.isYouTube = format === 'youtube';
        this.status = status;

        const list = this.els.playlistList;
        if (!list) return;

        if (!Array.isArray(videos) || videos.length === 0) {
            this.els.videoZone.style.display = 'none';
            this.els.playlistCol.style.display = 'none';
            this.els.iframe.src = '';
            this.els.page.classList.remove('has-playlist');
            list.innerHTML = '';
            return;
        }

        this.els.videoZone.style.display = 'block';
        list.innerHTML = '';

        videos.forEach((url, index) => {
            const vidId = getYouTubeId(url);
            if (!vidId) {
                console.warn(`⚠️ [ItemPlayer] Не распознан YouTube ID: ${url}`);
                return;
            }
            if (this.cards.has(vidId)) return; // дубликат ролика в плейлисте

            if (!this.firstVideoId) this.firstVideoId = vidId;

            const card = document.createElement('div');
            card.className = 'item-playlist-card';
            card.dataset.vid = vidId;
            card.innerHTML = `
                <div class="p-thumb">
                    <img alt="thumbnail">
                    <div class="p-overlay">
                        <i class="fas fa-play play-icon"></i>
                        <div class="p-equalizer"><span></span><span></span><span></span></div>
                    </div>
                </div>
                <div class="p-info">
                    <div class="p-title">Запись #${index + 1}</div>
                    <div class="p-status">СМОТРЕТЬ</div>
                </div>
            `;

            const titleEl = card.querySelector('.p-title');
            const thumbImg = card.querySelector('.p-thumb img');
            thumbImg.crossOrigin = 'Anonymous';
            thumbImg.decoding = 'async';
            thumbImg.src = getVideoThumbUrl(url);

            card.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.selectByVideoId(vidId);
            });

            list.appendChild(card);
            this.cards.set(vidId, { card, thumbImg, titleEl, url });

            this.loadTitle(vidId, url, titleEl, session);
        });

        if (this.cards.size > 1) {
            this.els.playlistCol.style.display = 'flex';
            this.els.page.classList.add('has-playlist');
        } else {
            this.els.playlistCol.style.display = 'none';
            this.els.page.classList.remove('has-playlist');
        }

        const requested = options.initialVideoId;
        const target = (requested && this.cards.has(requested)) ? requested : this.firstVideoId;
        if (requested && !this.cards.has(requested)) {
            console.warn(`⚠️ [ItemPlayer] Ролик "${requested}" отсутствует в плейлисте — открываю первый.`);
        }
        if (target) this.applySelection(target, { silent: true });
    }

    loadTitle(vidId, url, titleEl, session) {
        const cached = titleCache.get(url);
        if (cached) {
            titleEl.textContent = cached;
            if (this.activeVideoId === vidId && this.status === 'suggested') this.onTitleChange(cached);
            return;
        }

        fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
            .then(r => { if (!r.ok) throw new Error('noembed failed'); return r.json(); })
            .then(d => {
                if (!d || !d.title) return;
                titleCache.set(url, d.title);
                if (session !== this.session) return;
                titleEl.textContent = d.title;
                if (this.activeVideoId === vidId && this.status === 'suggested') this.onTitleChange(d.title);
            })
            .catch(() => { /* оставляем "Запись #N" */ });
    }

    /** Публичное переключение (клик, ссылка ?v=, кнопка "Назад"). */
    selectByVideoId(vidId) {
        if (!vidId || !this.cards.has(vidId)) return false;
        if (this.activeVideoId === vidId) return true;
        this.applySelection(vidId, { silent: false });
        return true;
    }

    applySelection(vidId, options = {}) {
        const entry = this.cards.get(vidId);
        if (!entry) return;

        this.cards.forEach(item => item.card.classList.remove('active'));
        entry.card.classList.add('active');

        this.activeVideoId = vidId;
        this.els.iframe.src = getEmbedUrl(vidId);

        if (this.status === 'suggested') this.onTitleChange(entry.titleEl.textContent);
        if (this.isYouTube) this.applyVideoTheme(vidId, entry.thumbImg, this.session);

        this.ensureCardVisible(entry.card);

        if (!options.silent) this.onVideoChange(vidId);
    }

    /** Скроллим ТОЛЬКО список, чтобы не дёргать страницу. */
    ensureCardVisible(card) {
        const list = this.els.playlistList;
        if (!list || list.clientHeight === 0) return;
        try {
            const listRect = list.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            const horizontal = list.scrollWidth > list.clientWidth + 4 && list.clientHeight < cardRect.height + 40;

            if (horizontal) {
                if (cardRect.left < listRect.left) list.scrollLeft += (cardRect.left - listRect.left) - 12;
                else if (cardRect.right > listRect.right) list.scrollLeft += (cardRect.right - listRect.right) + 12;
            } else {
                if (cardRect.top < listRect.top) list.scrollTop += (cardRect.top - listRect.top) - 12;
                else if (cardRect.bottom > listRect.bottom) list.scrollTop += (cardRect.bottom - listRect.bottom) + 12;
            }
        } catch (error) {
            console.warn('⚠️ [ItemPlayer] Не удалось прокрутить плейлист:', error.message);
        }
    }

    async applyVideoTheme(vidId, thumbImg, session) {
        this.onBackground(thumbImg.src);
        try {
            let color = this.videoColorCache.get(vidId);
            if (!color) {
                if (!thumbImg.complete) {
                    await new Promise((resolve, reject) => {
                        thumbImg.addEventListener('load', resolve, { once: true });
                        thumbImg.addEventListener('error', () => reject(new Error('thumbnail load error')), { once: true });
                    });
                }
                if (thumbImg.naturalWidth === 0) throw new Error('thumbnail broken');
                color = await extractColorFromImageAsync(thumbImg);
                if (color) this.videoColorCache.set(vidId, color);
            }
            if (session !== this.session) return;
            if (color) this.onThemeColor(color);
        } catch (error) {
            console.warn('⚠️ [ItemPlayer] Не удалось извлечь цвет видео:', error.message);
        }
    }

    stop() {
        this.session++;
        this.cards.clear();
        this.firstVideoId = null;
        this.activeVideoId = null;
        if (this.els.iframe) this.els.iframe.src = '';
    }
}