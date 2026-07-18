/* js/archive/LazyLoader.js */
import { extractColorFromImageAsync } from '../utils.js';

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

        if (primaryUrl && imgBg) {
            this._safeImageLoad(primaryUrl, isYouTube, imgBg, placeholder, card);
            frontLayer.removeAttribute('data-lazy-bg');
        }

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

    async _safeImageLoad(url, isYouTube, targetEl, placeholderEl, parentCard) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.decoding = "async";
        img.src = url;

        try {
            await img.decode();

            if (isYouTube && url.includes('maxresdefault') && img.naturalWidth <= 120) {
                this._safeImageLoad(url.replace('maxresdefault', 'hqdefault'), false, targetEl, placeholderEl, parentCard);
                return;
            }

            requestAnimationFrame(() => {
                targetEl.style.backgroundImage = `url('${img.src}')`;
                targetEl.style.opacity = '1';
                
                if (placeholderEl) {
                    placeholderEl.style.opacity = '0';
                    setTimeout(() => placeholderEl.style.display = 'none', 400);
                }
            });

            if (parentCard) {
                extractColorFromImageAsync(img).then(neonColor => {
                    if (neonColor) {
                        requestAnimationFrame(() => {
                            parentCard.style.setProperty('--custom-color', neonColor);
                            parentCard.dataset.extractedColor = neonColor;
                        });
                    }
                });
            }

        } catch (error) {
            // Сюда мы попадаем, если пропал интернет (ERR_CONNECTION_RESET)
            console.warn(`[LazyLoader] Ошибка сети при загрузке: ${url}`);
            
            // Если произошла ошибка, мы НЕ скрываем placeholderEl.
            // Буквенная заглушка останется на экране, и сайт не будет выглядеть сломанным.
            
            if (parentCard && !parentCard.dataset.extractedColor) {
                // Задаем нейтральный цвет, если оригинал не скачался
                parentCard.style.setProperty('--custom-color', '#444455');
            }
        }
    }
}