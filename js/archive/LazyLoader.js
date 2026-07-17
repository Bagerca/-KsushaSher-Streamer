/* js/archive/LazyLoader.js */

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
        }, { rootMargin: '400px' }); // Увеличили марджин, чтобы начинало грузить чуть раньше
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
            this._safeImageLoad(primaryUrl, isYouTube, imgBg, placeholder);
            frontLayer.removeAttribute('data-lazy-bg');
        }

        if (this.getGridMode() !== 'compact') {
            const backLayers = card.querySelectorAll('.layer-back, .layer-back-deep');
            backLayers.forEach(layer => {
                const bgUrl = layer.dataset.lazyBg;
                if (bgUrl) {
                    // Для задних слоев заглушку не убираем (её там нет), просто грузим
                    this._safeImageLoad(bgUrl, isYouTube, layer, null);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }
    }

    _safeImageLoad(url, isYouTube, targetEl, placeholderEl) {
        const img = new Image();
        
        img.onload = () => {
            // Ютуб хак: если ютуб отдает картинку шириной 120px, значит maxresdefault.jpg не существует (ошибка 404 Ютуба)
            if (isYouTube && url.includes('maxresdefault') && img.naturalWidth <= 120) {
                this._safeImageLoad(url.replace('maxresdefault', 'hqdefault'), false, targetEl, placeholderEl);
                return;
            }
            
            // Успешно загрузили
            targetEl.style.backgroundImage = `url('${img.src}')`;
            targetEl.style.opacity = '1';
            
            // Плавно прячем CSS-заглушку с буквой
            if (placeholderEl) {
                placeholderEl.style.opacity = '0';
                setTimeout(() => placeholderEl.style.display = 'none', 400);
            }
        };

        img.onerror = () => {
            console.warn(`[LazyLoader] Ошибка загрузки картинки: ${url}`);
            // Если ошибка, картинка не появится, НО процедурная заглушка (placeholderEl) 
            // с первой буквой названия останется на месте! Это выглядит как фича, а не баг.
            targetEl.style.opacity = '0';
        };

        img.src = url;
    }
}