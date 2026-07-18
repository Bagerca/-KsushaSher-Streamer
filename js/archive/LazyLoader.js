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
            // Передаем frontLayer чтобы покрасить конкретно его
            this._safeImageLoad(primaryUrl, isYouTube, imgBg, placeholder, card, frontLayer);
            frontLayer.removeAttribute('data-lazy-bg');
        }

        if (this.getGridMode() !== 'compact') {
            const backLayers = card.querySelectorAll('.layer-back, .layer-back-deep');
            backLayers.forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl) {
                    // Передаем layer, чтобы покрасить конкретно его
                    this._safeImageLoad(bgUrl, isYouTube, layer, null, null, layer);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }
    }

    async _safeImageLoad(url, isYouTube, targetEl, placeholderEl, parentCard, layerEl) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.decoding = "async";
        img.src = url;

        try {
            await img.decode();

            if (isYouTube && url.includes('maxresdefault') && img.naturalWidth <= 120) {
                this._safeImageLoad(url.replace('maxresdefault', 'hqdefault'), false, targetEl, placeholderEl, parentCard, layerEl);
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

            if (layerEl || parentCard) {
                extractColorFromImageAsync(img).then(neonColor => {
                    if (neonColor) {
                        requestAnimationFrame(() => {
                            // Родительская карта красится (как fallback для остального UI)
                            if (parentCard && !parentCard.dataset.extractedColor) {
                                parentCard.style.setProperty('--custom-color', neonColor);
                                parentCard.dataset.extractedColor = neonColor;
                            }
                            // Конкретный слой получает индивидуальный цвет!
                            if (layerEl) {
                                layerEl.style.setProperty('--layer-color', neonColor);
                            }
                        });
                    }
                });
            }

        } catch (error) {
            console.warn(`[LazyLoader] Ошибка сети при загрузке: ${url}`);
            
            if (parentCard && !parentCard.dataset.extractedColor) {
                parentCard.style.setProperty('--custom-color', '#444455');
            }
        }
    }
}