/* js/media-item/ItemPosters.js */
import EventBus from '../event-bus.js';
import { extractColorFromImageAsync, optimizeImageUrl } from '../utils.js';
import { NO_IMAGE_POSTER, getItemImageUrl } from './item-utils.js';

/**
 * 3D-стек постеров.
 * Поддерживает адресацию конкретного слайда (startIndex / goTo),
 * чтобы ссылка ?part=... / ?slide=... открывала нужную часть коллекции.
 */
export class ItemPosters {
    constructor(wrapperEl, dotsEl, callbacks = {}) {
        this.wrapper = wrapperEl;
        this.dots = dotsEl;
        this.onActiveColor = callbacks.onActiveColor || (() => {});
        this.onSlideChange = callbacks.onSlideChange || (() => {});

        this.stackData = [];
        this.imgElements = [];
        this.currentIndex = 0;
        this.session = 0;
        this.fallbackColor = '#ff2d95';
    }

    render(stackData, fallbackColor, startIndex = 0) {
        const session = ++this.session;
        this.stackData = Array.isArray(stackData) ? stackData : [];
        this.fallbackColor = fallbackColor;
        this.currentIndex = 0;
        this.imgElements = [];

        if (!this.wrapper || !this.dots) return;

        this.wrapper.innerHTML = '<div class="modal-poster-glow"></div>';
        this.dots.innerHTML = '';
        this.wrapper.classList.remove('stack-1', 'stack-2', 'stack-3', 'is-interactive');
        this.wrapper.onclick = null;

        if (this.stackData.length === 0) {
            console.warn('⚠️ [ItemPosters] Пустой стек постеров.');
            return;
        }

        const stackCount = Math.min(this.stackData.length, 3);
        this.wrapper.classList.add(`stack-${stackCount}`);

        this.stackData.forEach((data, index) => {
            const img = document.createElement('img');
            img.crossOrigin = 'Anonymous';
            img.decoding = 'async';
            img.alt = data.title || 'poster';

            const initialColor = data.customColor || fallbackColor;
            img.style.setProperty('--poster-color', initialColor);

            img.onload = async () => {
                if (session !== this.session) return;
                const neonColor = await extractColorFromImageAsync(img) || data.customColor || this.fallbackColor;
                if (session !== this.session) return;
                img.dataset.neonColor = neonColor;
                img.style.setProperty('--poster-color', neonColor);
                if (index === this.currentIndex) this.onActiveColor(neonColor);
            };

            img.onerror = () => {
                if (session !== this.session) return;
                if (img.dataset.fallbackApplied === '1') return;
                img.dataset.fallbackApplied = '1';
                img.dataset.neonColor = this.fallbackColor;
                img.style.setProperty('--poster-color', this.fallbackColor);
                img.src = NO_IMAGE_POSTER;
                if (index === this.currentIndex) this.onActiveColor(this.fallbackColor);
            };

            img.src = optimizeImageUrl(getItemImageUrl(data, NO_IMAGE_POSTER), 600, 90);
            img.className = 'modal-poster-img';
            this.wrapper.appendChild(img);
            this.imgElements.push(img);

            if (this.stackData.length > 1) {
                const dot = document.createElement('div');
                dot.className = 'poster-dot';
                dot.title = data.title ? `Показать: ${data.title}` : `Слайд ${index + 1}`;
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.goTo(index);
                });
                this.dots.appendChild(dot);
            }
        });

        const safeIndex = (Number.isFinite(startIndex) && startIndex >= 0 && startIndex < this.stackData.length)
            ? startIndex : 0;
        this.currentIndex = safeIndex;
        this.updateClasses();

        const activeImg = this.imgElements[safeIndex];
        if (activeImg && activeImg.dataset.neonColor) {
            this.onActiveColor(activeImg.dataset.neonColor);
        }

        if (this.stackData.length > 1) {
            this.wrapper.classList.add('is-interactive');
            this.wrapper.onclick = () => this.next();
        }
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    next() {
        if (this.imgElements.length === 0) return;
        this.goTo((this.currentIndex + 1) % this.imgElements.length);
    }

    /** Публичная адресация слайда (клик по точке, ссылка, кнопка "Назад"). */
    goTo(index, options = {}) {
        if (this.imgElements.length === 0) return;
        const total = this.imgElements.length;
        const safeIndex = ((index % total) + total) % total;
        if (safeIndex === this.currentIndex) return;

        if (!options.silent) EventBus.emit('PLAY_SOUND', 'hover');

        this.currentIndex = safeIndex;
        this.updateClasses();

        const currentItem = this.stackData[safeIndex];
        const activeImg = this.imgElements[safeIndex];
        const color = (activeImg && activeImg.dataset.neonColor) || this.fallbackColor;

        this.onSlideChange(currentItem, color, safeIndex);
    }

    updateClasses() {
        this.imgElements.forEach((img, index) => {
            img.classList.remove('is-front', 'is-back', 'is-back-2', 'is-hidden');
            const relIndex = (index - this.currentIndex + this.imgElements.length) % this.imgElements.length;
            if (relIndex === 0) { img.classList.add('is-front'); img.style.zIndex = 30; }
            else if (relIndex === 1) { img.classList.add('is-back'); img.style.zIndex = 20; }
            else if (relIndex === 2) { img.classList.add('is-back-2'); img.style.zIndex = 10; }
            else { img.classList.add('is-hidden'); img.style.zIndex = 0; }
        });

        if (this.stackData.length > 1 && this.dots) {
            const dots = this.dots.querySelectorAll('.poster-dot');
            dots.forEach((dot, index) => dot.classList.toggle('active', index === this.currentIndex));
        }
    }

    /** Гасит асинхронные ответы старого стека при уходе со страницы. */
    invalidate() {
        this.session++;
        if (this.wrapper) this.wrapper.onclick = null;
    }
}