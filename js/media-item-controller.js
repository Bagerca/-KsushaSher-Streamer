/* js/media-item-controller.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';
import { AppRouter } from './router.js';
import { getYouTubeId, extractColorFromImageAsync, optimizeImageUrl } from './utils.js';
import { STATUS_MAP } from './media-store.js';

export class MediaItemController {
    constructor() {
        this.container = document.getElementById('route-media-item');
        if (!this.container) return;

        this.els = {
            page: document.getElementById('media-item-page'),
            layout: document.getElementById('item-layout'),
            backBtn: document.getElementById('btn-item-back'),
            bg: document.getElementById('item-cinematic-bg'),
            statusBadge: document.getElementById('item-status-badge'),
            
            posterWrapper: document.getElementById('item-poster-wrapper'),
            posterDots: document.getElementById('item-poster-dots'),
            
            ratingBox: document.getElementById('item-rating-box'),
            ratingVal: document.getElementById('item-rating-val'),
            segments: document.getElementById('item-segments'),
            
            barcodeContainer: document.getElementById('item-barcode-container'),
            sysId: document.getElementById('item-sys-id'),
            dataType: document.getElementById('item-datatype'),
            
            mainZone: document.getElementById('item-main-zone'),
            title: document.getElementById('item-title-text'),
            googleLink: document.getElementById('item-google-link'),
            desc: document.getElementById('item-desc-text'),
            
            videoZone: document.getElementById('item-video-zone'),
            iframe: document.getElementById('item-iframe'),
            playlistCol: document.getElementById('item-playlist-col'),
            playlistList: document.getElementById('item-playlist-list')
        };

        this.fallbackColor = '#ff2d95';
        this.currentStack = [];
        this.currentImageIndex = 0;
        
        this.bindEvents();
    }

    bindEvents() {
        this.els.backBtn.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            
            const state = AppStore.getState();
            const from = state.route.query.from || 'archive';
            const type = state.media.type || 'games';
            
            // Восстанавливаем параметры (поиск, фильтры, сортировка), чтобы они не сбросились в URL
            const mediaState = state.media;
            const restoreQuery = {};
            if (mediaState.searchQuery) restoreQuery.search = mediaState.searchQuery;
            if (mediaState.filters.length > 0) restoreQuery.filters = mediaState.filters.join(',');
            if (mediaState.sort !== 'name') restoreQuery.sort = mediaState.sort;
            if (mediaState.sortDirection !== 'asc') restoreQuery.sortDir = mediaState.sortDirection;
            if (mediaState.gridMode !== 'detailed') restoreQuery.mode = mediaState.gridMode;

            // Умный возврат туда, откуда пришли
            if (from === 'library') {
                AppRouter.navigate('/library', { type }, restoreQuery);
            } else if (from === 'youtube') {
                AppRouter.navigate('/youtube', {}, restoreQuery);
            } else if (from === 'tierlist') {
                AppRouter.navigate('/tierlist', { type });
            } else if (from === 'agents') {
                // Если пришли от агента, возвращаемся конкретно к нему
                const agentId = state.route.query.agentId;
                if (agentId) {
                    AppRouter.navigate('/agents', { id: agentId });
                } else {
                    AppRouter.navigate('/agents');
                }
            } else {
                AppRouter.navigate('/archive', { type }, restoreQuery);
            }
        });
    }

    mount(itemId) {
        const state = AppStore.getState();
        if (!state.data.isMediaLoaded) {
            const unsubscribe = AppStore.subscribe((newState) => {
                if (newState.data.isMediaLoaded) {
                    unsubscribe();
                    this.mount(itemId);
                }
            });
            return;
        }

        const item = state.data.media.find(i => i.id === itemId || i.title === itemId);
        if (!item) {
            console.warn(`[ItemPage] Объект с ID "${itemId}" не найден.`);
            AppRouter.navigate('/archive');
            return;
        }

        // Динамический текст кнопки "НАЗАД" в зависимости от того, откуда пришли
        const from = state.route.query.from || 'archive';
        if (from === 'library') {
            this.els.backBtn.innerHTML = '<i class="fas fa-chevron-left"></i> НАЗАД В БИБЛИОТЕКУ';
        } else if (from === 'youtube') {
            this.els.backBtn.innerHTML = '<i class="fas fa-chevron-left"></i> НАЗАД В YOUTUBE АРХИВ';
        } else if (from === 'tierlist') {
            this.els.backBtn.innerHTML = '<i class="fas fa-chevron-left"></i> НАЗАД В ТИРЛИСТ';
        } else if (from === 'agents') {
            this.els.backBtn.innerHTML = '<i class="fas fa-chevron-left"></i> НАЗАД К АГЕНТУ';
        } else {
            this.els.backBtn.innerHTML = '<i class="fas fa-chevron-left"></i> НАЗАД В БАЗУ';
        }

        this.renderPage(item);
    }

    unmount() {
        this.els.iframe.src = ''; 
    }

    async renderPage(item) {
        window.scrollTo(0, 0); 
        
        this.fallbackColor = item.customColor || (item.format === 'youtube' ? '#ff0000' : '#ff2d95');
        
        if (item.format === 'youtube') {
            this.els.page.classList.add('is-cinema');
        } else {
            this.els.page.classList.remove('is-cinema');
        }

        if (item.format === 'collection' && item.items && item.items.length > 0) {
            this.currentStack = [...item.items];
        } else {
            let images = (item.images && item.images.length > 0) ? item.images : [item.image];
            this.currentStack = images.map(img => ({ ...item, isImageOnly: true, overrideImage: img }));
        }

        this.renderPosters3D();
        this.updateDataFields(this.currentStack[0], item.format, item.type, this.fallbackColor);
        this.renderPlayer(this.currentStack[0].videos, item.format, this.currentStack[0].status);
    }

    updateDataFields(currentItem, format, type, initColor) {
        this.applyThemeColor(initColor);

        this.els.mainZone.classList.remove('is-glitching');
        void this.els.mainZone.offsetWidth;
        this.els.mainZone.classList.add('is-glitching');
        
        setTimeout(() => {
            this.els.title.textContent = currentItem.title;
            this.els.googleLink.href = `https://www.google.com/search?q=${encodeURIComponent(currentItem.title)}`;
            
            if (!currentItem.description || currentItem.description.trim() === '...' || currentItem.description.trim() === '') {
                this.els.desc.style.display = 'none';
            } else {
                this.els.desc.style.display = 'block';
                this.els.desc.textContent = currentItem.description;
            }

            const effectiveStatus = currentItem.status || 'unknown';
            
            if (effectiveStatus === 'suggested') {
                this.els.ratingBox.style.display = 'none';
                this.els.statusBadge.innerHTML = `<i class="fas fa-user"></i> Предложил: ${currentItem.suggestedBy || 'Агент'}`;
            } else {
                this.els.ratingBox.style.display = 'flex';
                this.els.statusBadge.textContent = STATUS_MAP[effectiveStatus] || effectiveStatus;
                
                let rating = currentItem.rating || 0;
                if (rating > 0) {
                    this.els.ratingVal.textContent = rating.toFixed(1);
                    const rScore = Math.round(rating);
                    this.els.segments.innerHTML = Array.from({length: 5}, (_, i) => 
                        `<div class="modal-segment-line ${i < rScore ? 'filled' : ''}"></div>`
                    ).join('');
                } else {
                    this.els.ratingVal.textContent = "N/A";
                    this.els.segments.innerHTML = `<span style="font-family:monospace;font-size:0.7rem;color:#666;">NO_DATA</span>`;
                }
            }
            
            this.els.sysId.textContent = currentItem.id || "SYS_UNKNOWN";
            this.els.dataType.textContent = type ? type.toUpperCase() : "UNKNOWN";
            
            this.generateBarcode(this.els.sysId.textContent.toUpperCase(), initColor);
            
            const bgImg = currentItem.overrideImage || currentItem.image || (currentItem.videos ? `https://img.youtube.com/vi/${getYouTubeId(currentItem.videos[0])}/hqdefault.jpg` : null);
            if (bgImg) this.els.bg.style.backgroundImage = `url('${optimizeImageUrl(bgImg, 1200, 80)}')`;

        }, 150); 
    }

    renderPosters3D() {
        this.currentImageIndex = 0;
        this.els.posterWrapper.innerHTML = '<div class="modal-poster-glow"></div>';
        this.els.posterDots.innerHTML = '';
        
        this.els.posterWrapper.classList.remove('stack-1', 'stack-2', 'stack-3');
        const stackCount = Math.min(this.currentStack.length, 3);
        this.els.posterWrapper.classList.add(`stack-${stackCount}`);

        this.imgElements = [];

        this.currentStack.forEach((data, index) => {
            const img = document.createElement('img');
            img.crossOrigin = "Anonymous"; 
            img.decoding = "async"; 
            
            img.onload = async () => {
                const neonColor = await extractColorFromImageAsync(img) || data.customColor || this.fallbackColor;
                img.dataset.neonColor = neonColor;
                if (index === this.currentImageIndex) this.applyThemeColor(neonColor);
            };

            img.onerror = () => {
                img.dataset.neonColor = this.fallbackColor;
                img.src = 'https://via.placeholder.com/600x900/1a1a24/ffffff?text=NO+IMAGE'; 
                if (index === this.currentImageIndex) this.applyThemeColor(this.fallbackColor);
            };
            
            let rawSrc = data.overrideImage || data.image || (data.videos ? `https://img.youtube.com/vi/${getYouTubeId(data.videos[0])}/hqdefault.jpg` : 'https://via.placeholder.com/600x900/1a1a24/ffffff?text=NO+IMAGE');
            img.src = optimizeImageUrl(rawSrc, 600, 90); 
            img.className = 'modal-poster-img'; 
            
            this.els.posterWrapper.appendChild(img); 
            this.imgElements.push(img);
            
            if (this.currentStack.length > 1) {
                const dot = document.createElement('div');
                dot.className = 'poster-dot';
                this.els.posterDots.appendChild(dot);
            }
        });

        this.updatePosterClasses();

        if (this.currentStack.length > 1) {
            this.els.posterWrapper.classList.add('is-interactive');
            this.els.posterWrapper.onclick = () => { 
                EventBus.emit('PLAY_SOUND', 'hover'); 
                this.currentImageIndex = (this.currentImageIndex + 1) % this.imgElements.length; 
                this.updatePosterClasses(); 
                
                const currentItem = this.currentStack[this.currentImageIndex];
                const activeImg = this.imgElements[this.currentImageIndex];
                const currentExtractedColor = activeImg.dataset.neonColor || this.fallbackColor;
                
                if (!currentItem.isImageOnly) {
                    this.updateDataFields(currentItem, currentItem.format, currentItem.type, currentExtractedColor);
                    this.renderPlayer(currentItem.videos, currentItem.format, currentItem.status);
                } else {
                    this.applyThemeColor(currentExtractedColor);
                    const bgImg = currentItem.overrideImage || currentItem.image;
                    if (bgImg) this.els.bg.style.backgroundImage = `url('${optimizeImageUrl(bgImg, 1200, 80)}')`;
                }
            };
        } else {
            this.els.posterWrapper.classList.remove('is-interactive');
            this.els.posterWrapper.onclick = null;
        }
    }

    updatePosterClasses() {
        this.imgElements.forEach((img, index) => {
            img.classList.remove('is-front', 'is-back', 'is-back-2', 'is-hidden');
            let relIndex = (index - this.currentImageIndex + this.imgElements.length) % this.imgElements.length;
            if (relIndex === 0) { img.classList.add('is-front'); img.style.zIndex = 30; }
            else if (relIndex === 1) { img.classList.add('is-back'); img.style.zIndex = 20; }
            else if (relIndex === 2) { img.classList.add('is-back-2'); img.style.zIndex = 10; }
            else { img.classList.add('is-hidden'); img.style.zIndex = 0; }
        });
        
        if (this.currentStack.length > 1) {
            const dots = this.els.posterDots.querySelectorAll('.poster-dot');
            dots.forEach((dot, index) => { dot.classList.toggle('active', index === this.currentImageIndex); });
        }
    }

    renderPlayer(videos, format, status) {
        if (!videos || videos.length === 0) {
            this.els.videoZone.style.display = 'none';
            this.els.playlistCol.style.display = 'none';
            this.els.iframe.src = '';
            this.els.page.classList.remove('has-playlist');
            return;
        }

        this.els.videoZone.style.display = 'block';
        this.els.playlistList.innerHTML = '';
        let firstValidId = null;

        videos.forEach((url, index) => {
            const vidId = getYouTubeId(url);
            if (!vidId) return;
            if (!firstValidId) firstValidId = vidId;

            const card = document.createElement('div');
            card.className = `item-playlist-card ${index === 0 ? 'active' : ''}`;
            card.innerHTML = `
                <div class="p-thumb">
                    <img src="https://img.youtube.com/vi/${vidId}/hqdefault.jpg" alt="thumbnail">
                    <div class="p-overlay"><i class="fas fa-play play-icon"></i><div class="p-equalizer"><span></span><span></span><span></span></div></div>
                </div>
                <div class="p-info">
                    <div class="p-title">Запись #${index + 1}</div>
                    <div class="p-status">СМОТРЕТЬ</div>
                </div>
            `;

            const titleEl = card.querySelector('.p-title');

            card.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.els.playlistList.querySelectorAll('.item-playlist-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.els.iframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=0&rel=0&modestbranding=1`;
                
                if (status === 'suggested') {
                    this.els.title.textContent = titleEl.textContent;
                    this.els.googleLink.href = `https://www.google.com/search?q=${encodeURIComponent(titleEl.textContent)}`;
                }
            });

            this.els.playlistList.appendChild(card);

            fetch(`https://noembed.com/embed?url=${url}`).then(r => r.json()).then(d => {
                if (d.title) {
                    titleEl.textContent = d.title;
                    if (card.classList.contains('active') && status === 'suggested') {
                        this.els.title.textContent = d.title;
                        this.els.googleLink.href = `https://www.google.com/search?q=${encodeURIComponent(d.title)}`;
                    }
                }
            }).catch(() => {});
        });

        if (videos.length > 1) {
            this.els.playlistCol.style.display = 'flex';
            this.els.page.classList.add('has-playlist');
        } else {
            this.els.playlistCol.style.display = 'none';
            this.els.page.classList.remove('has-playlist');
        }

        if (firstValidId) {
            this.els.iframe.src = `https://www.youtube.com/embed/${firstValidId}?autoplay=0&rel=0&modestbranding=1`;
        }
    }

    applyThemeColor(color) {
        this.els.page.style.setProperty('--item-color', color);
        
        this.els.ratingVal.style.color = color;
        this.els.segments.querySelectorAll('.filled').forEach(s => s.style.color = color);
    }

    generateBarcode(textId, color) {
        const linesContainer = this.els.barcodeContainer.querySelector('.barcode-lines');
        if (!linesContainer) return;
        linesContainer.innerHTML = '';
        try {
            if (window.JsBarcode) {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.style.height = "100%";
                svg.style.filter = `drop-shadow(0 0 3px ${color})`;
                linesContainer.appendChild(svg);
                window.JsBarcode(svg, textId, { format: "CODE39", displayValue: false, background: "transparent", lineColor: color, margin: 0, width: 2, height: 40 });
            }
        } catch (e) {}
    }
}