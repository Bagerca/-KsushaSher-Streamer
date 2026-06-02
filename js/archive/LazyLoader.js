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
        }, { rootMargin: '300px' });
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
                    this._safeImageLoad(bgUrl, isYouTube, layer, null);
                    layer.removeAttribute('data-lazy-bg');
                }
            });
        }
    }

    _safeImageLoad(url, isYouTube, targetEl, placeholderEl) {
        const img = new Image();
        img.onload = () => {
            if (isYouTube && url.includes('maxresdefault') && img.naturalWidth <= 120) {
                this._safeImageLoad(url.replace('maxresdefault', 'hqdefault'), false, targetEl, placeholderEl);
                return;
            }
            targetEl.style.backgroundImage = `url('${img.src}')`;
            targetEl.style.opacity = '1';
            if (placeholderEl) {
                placeholderEl.style.opacity = '0';
                setTimeout(() => placeholderEl.style.display = 'none', 400);
            }
        };
        img.src = url;
    }
}