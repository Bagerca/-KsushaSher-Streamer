/* js/modal/MediaModalManager.js */
import EventBus from '../event-bus.js';
import { ModalPosters } from './ModalPosters.js';
import { ModalPlayer } from './ModalPlayer.js';
import { ModalRenderer } from './ModalRenderer.js';

export class MediaModalManager {
    constructor() {
        this.buildDOM();
        this.posters = new ModalPosters(this.els.posterWrapper, this.els.posterDots, this.els.cinematicBg);
        this.player = new ModalPlayer(this.els.videoSection, this.els.iframe, this.els.videoPlaylist);
        this.renderer = new ModalRenderer(this.els);
        this.initListeners();
    }

    buildDOM() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'media-modal-overlay';
        this.overlay.id = 'media-modal-overlay';
        
        this.overlay.innerHTML = `
            <div class="modal-cinematic-bg" id="modal-cinematic-bg"></div>
            <button class="modal-close-btn" title="Закрыть (Esc)"><i class="fas fa-times"></i></button>
            <div class="media-modal-content">
                <div class="modal-layout" id="modal-layout">
                    <div class="modal-col-sidebar" id="modal-col-sidebar">
                        <div class="modal-poster-wrapper"><div class="modal-poster-glow"></div></div>
                        <div class="poster-pagination" id="modal-poster-dots"></div>
                        <div class="modal-tech-barcode">
                            <div class="barcode-lines"></div>
                            <div class="tech-info">
                                <span>SYS_ID: <span class="t-val" id="modal-id">---</span></span>
                                <span>DATATYPE: <span class="t-val" id="modal-type">---</span></span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-col-main" id="modal-col-main">
                        <div class="modal-dynamic-zone" id="modal-dynamic-zone">
                            <div class="modal-header">
                                <div class="modal-title-row">
                                    <h2 class="modal-title" id="modal-title">TITLE</h2>
                                    <div class="modal-rating-box" id="modal-rating-box">
                                        <div class="modal-segments" id="modal-segments"></div>
                                        <span id="modal-rating-val">0.0</span>
                                    </div>
                                </div>
                                <div class="modal-meta-row">
                                    <span class="modal-status-badge" id="modal-status">STATUS</span>
                                </div>
                            </div>
                            <div class="modal-body">
                                <div class="modal-desc-wrapper">
                                    <p class="modal-desc" id="modal-desc"></p>
                                    <div class="modal-desc-full" id="modal-desc-full"></div>
                                </div>
                            </div>
                            <div class="modal-video-section" id="modal-video-section" style="display: none;">
                                <div class="video-header"><i class="fas fa-play-circle"></i> <span>МЕДИА АРХИВ</span></div>
                                <div class="video-container" id="modal-player-container"><iframe id="modal-iframe" src="" frameborder="0" allowfullscreen></iframe></div>
                                <div class="horizontal-scroll-list" id="modal-video-playlist"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.content = this.overlay.querySelector('.media-modal-content');
        this.closeBtn = this.overlay.querySelector('.modal-close-btn');
        
        this.els = {
            layout: document.getElementById('modal-layout'),
            dynamicZone: document.getElementById('modal-dynamic-zone'),
            techBarcode: this.overlay.querySelector('.modal-tech-barcode'),
            cinematicBg: document.getElementById('modal-cinematic-bg'),
            posterWrapper: this.overlay.querySelector('.modal-poster-wrapper'),
            posterDots: document.getElementById('modal-poster-dots'),
            ratingBox: document.getElementById('modal-rating-box'),
            ratingVal: document.getElementById('modal-rating-val'),
            segments: document.getElementById('modal-segments'),
            status: document.getElementById('modal-status'),
            title: document.getElementById('modal-title'),
            desc: document.getElementById('modal-desc'),
            descFull: document.getElementById('modal-desc-full'),
            id: document.getElementById('modal-id'),
            type: document.getElementById('modal-type'),
            videoSection: document.getElementById('modal-video-section'),
            iframe: document.getElementById('modal-iframe'),
            videoPlaylist: document.getElementById('modal-video-playlist')
        };
    }

    initListeners() {
        this.closeBtn.addEventListener('click', () => { EventBus.emit('PLAY_SOUND', 'click'); this.close(); });
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay || e.target === this.els.cinematicBg) this.close(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.overlay.classList.contains('active')) this.close(); });
        
        // ПРИХВАТЫВАЕМ ЦВЕТ ИЗ СЕТКИ, ЕСЛИ ОН УЖЕ ВЫЧИСЛЕН (оптимизация)
        EventBus.on('MODAL_OPEN_MEDIA', ({ item, type, triggerElement }) => {
            const precalculatedColor = triggerElement ? triggerElement.dataset.extractedColor : null;
            this.open(item, type, precalculatedColor);
        });
    }

    updateThemeColor(color) {
        if (!color) return;
        this.content.style.setProperty('--modal-color', color);
        this.overlay.style.setProperty('--modal-color', color); 
    }

    open(item, type, precalculatedColor) {
        this.player.stop();
        this.renderer.setLayoutMode(item.format, this.overlay);

        let stackData = [];
        if (item.format === 'collection' && item.items && item.items.length > 0) {
            stackData = [...item.items];
        } else {
            let images = (item.images && item.images.length > 0) ? item.images : [item.image];
            stackData = images.map(img => ({ ...item, isImageOnly: true, overrideImage: img }));
        }

        // Ставим цвет из сетки (или дефолтный), пока грузится картинка
        const fallbackColor = precalculatedColor || item.customColor || '#ff2d95';
        this.updateThemeColor(fallbackColor);

        // Колбэк на клик (смена плаката)
        const handleSlideChange = (currentItem, extractedColor) => {
            this.updateThemeColor(extractedColor);
            this.renderer.triggerGlitchTransition(() => {
                const effectiveStatus = this.renderer.updateText(currentItem, type, extractedColor);
                this.player.render(currentItem, effectiveStatus, (newTitle) => {
                    this.els.title.textContent = newTitle;
                });
            });
        };

        // Колбэк на асинхронную загрузку картинки (авто-перекраска)
        const handleImageLoadedColor = (extractedColor) => {
            this.updateThemeColor(extractedColor);
            // Тихо перекрашиваем рейтинг
            this.els.ratingVal.style.color = extractedColor;
            this.els.segments.querySelectorAll('.filled').forEach(seg => {
                seg.style.color = extractedColor;
            });
        };

        this.posters.init(stackData, handleSlideChange, handleImageLoadedColor);
        
        // Стартовый рендер
        const initStatus = this.renderer.updateText(stackData[0], type, fallbackColor);
        this.player.render(stackData[0], initStatus, (newTitle) => {
            this.els.title.textContent = newTitle;
        });

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => this.player.stop(), 300);
    }
}