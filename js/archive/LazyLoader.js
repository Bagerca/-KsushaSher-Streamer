/* js/archive/LazyLoader.js */
import { extractColorFromImage } from '../utils.js';

export class LazyLoader {
    constructor(gridModeRef) {
        this.getGridMode = gridModeRef;
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadCardImages(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '400px' }); 
    }

    observe(card) {
        this.observer.observe(card);
    }

    loadCardImages(card) {
        const isYouTube = card.classList.contains('is-youtube');
        
        const frontLayer = card.querySelector('.layer-front');
        const primaryUrl = frontLayer.dataset.lazyBg;
        const placeholder = frontLayer.querySelector('.procedural-placeholder');
        const imgBg = frontLayer.querySelector('.layer-img-bg');

        // ГРУЗИМ ПЕРЕДНИЙ СЛОЙ (и извлекаем из него цвет!)
        if (primaryUrl && imgBg) {
            this._safeImageLoad(primaryUrl, isYouTube, imgBg, placeholder, card);
            frontLayer.removeAttribute('data-lazy-bg');
        }

        // ГРУЗИМ ЗАДНИЕ СЛОИ (без извлечения цвета)
        if (this.getGridMode() !== 'compact') {
            const backLayers = card.querySelectorAll('.layer-back, .layer-back-deep');
            backLayers.forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl) {
                    this._safeImageLoad(bgUrl, isYouTube, layer, null, null);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }
    }

    _safeImageLoad(url, isYouTube, targetEl, placeholderEl, parentCard) {
        const img = new Image();
        
        // ВАЖНО: Разрешаем CORS, чтобы можно было прочитать пиксели
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            if (isYouTube && url.includes('maxresdefault') && img.naturalWidth <= 120) {
                this._safeImageLoad(url.replace('maxresdefault', 'hqdefault'), false, targetEl, placeholderEl, parentCard);
                return;
            }
            
            targetEl.style.backgroundImage = `url('${img.src}')`;
            targetEl.style.opacity = '1';
            
            // МАГИЯ АВТО-ЦВЕТА (Только для передней картинки)
            if (parentCard) {
                const neonColor = extractColorFromImage(img);
                if (neonColor) {
                    parentCard.style.setProperty('--custom-color', neonColor);
                    // Сохраняем цвет в dataset, чтобы модалка могла его забрать
                    parentCard.dataset.extractedColor = neonColor;
                }
            }
            
            if (placeholderEl) {
                placeholderEl.style.opacity = '0';
                setTimeout(() => placeholderEl.style.display = 'none', 400);
            }
        };

        img.onerror = () => {
            console.warn(`[LazyLoader] Ошибка загрузки картинки: ${url}`);
            targetEl.style.opacity = '0';
        };

        img.src = url;
    }
}