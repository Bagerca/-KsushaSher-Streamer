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

        // ГРУЗИМ ПЕРЕДНИЙ СЛОЙ (и извлекаем из него цвет асинхронно!)
        if (primaryUrl && imgBg) {
            this._safeImageLoad(primaryUrl, isYouTube, imgBg, placeholder, card);
            frontLayer.removeAttribute('data-lazy-bg');
        }

        // ГРУЗИМ ЗАДНИЕ СЛОИ (им цвет не нужен)
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
        
        // ВАЖНО: Указываем браузеру декодировать картинку в фоновом потоке
        img.decoding = "async";
        img.src = url;

        try {
            // Ждем, пока браузер полностью распакует JPEG/WebP из оперативной памяти в видеопамять
            await img.decode();

            // Если это сломанная заглушка ютуба - пробуем загрузить качество ниже
            if (isYouTube && url.includes('maxresdefault') && img.naturalWidth <= 120) {
                this._safeImageLoad(url.replace('maxresdefault', 'hqdefault'), false, targetEl, placeholderEl, parentCard);
                return;
            }

            // 1. Показываем картинку МГНОВЕННО (через rAF для синхронизации с циклом рендера браузера)
            requestAnimationFrame(() => {
                targetEl.style.backgroundImage = `url('${img.src}')`;
                targetEl.style.opacity = '1';
                
                if (placeholderEl) {
                    placeholderEl.style.opacity = '0';
                    setTimeout(() => placeholderEl.style.display = 'none', 400);
                }
            });

            // 2. В ФОНОВОМ РЕЖИМЕ вычисляем неоновый цвет (не блокируя показ картинки)
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
            console.warn(`[LazyLoader] Ошибка загрузки или декодирования картинки: ${url}`);
            targetEl.style.opacity = '0';
        }
    }
}