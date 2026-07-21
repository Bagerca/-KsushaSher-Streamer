/* js/modal/MediaModalManager.js */
import EventBus from '../event-bus.js';
import { ModalPosters } from './ModalPosters.js';
import { ModalPlayer } from './ModalPlayer.js';
import { ModalRenderer } from './ModalRenderer.js';

export class MediaModalManager {
    constructor() {
        this.buildDOM();
        this.posters = new ModalPosters(this.els.posterWrapper, this.els.posterDots, this.els.cinematicBg);
        this.player = new ModalPlayer(this.els.videoSection, this.els.iframe, this.els.videoPlaylist, this.els.playlistCol);
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
                        
                        <div class="modal-sidebar-meta">
                            <span class="modal-status-badge" id="modal-status">STATUS</span>
                            <div class="modal-rating-box" id="modal-rating-box">
                                <div class="modal-segments" id="modal-segments"></div>
                                <span id="modal-rating-val">0.0</span>
                            </div>
                        </div>

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
                            
                            <div class="modal-text-content">
                                <div class="hover-reveal-wrapper">
                                    <h2 class="modal-title truncated">
                                        <a href="#" target="_blank" id="modal-title-link" class="title-search-link" title="Искать в Google">
                                            <span id="modal-title">TITLE</span>
                                            <i class="fab fa-google search-icon"></i>
                                        </a>
                                    </h2>
                                    <div class="hover-reveal-box" id="modal-title-full-box">
                                        <h2 class="modal-title">
                                            <a href="#" target="_blank" id="modal-title-link-full" class="title-search-link" title="Искать в Google">
                                                <span id="modal-title-full">TITLE</span>
                                                <i class="fab fa-google search-icon"></i>
                                            </a>
                                        </h2>
                                    </div>
                                </div>
                                
                                <div class="hover-reveal-wrapper" style="margin-top: 15px;">
                                    <p class="modal-desc truncated" id="modal-desc"></p>
                                    <div class="hover-reveal-box">
                                        <p class="modal-desc" id="modal-desc-full"></p>
                                    </div>
                                </div>
                            </div>

                            <div class="modal-video-section" id="modal-video-section" style="display: none;">
                                <div class="video-container" id="modal-player-container"><iframe id="modal-iframe" src="" frameborder="0" allowfullscreen></iframe></div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-col-playlist" id="modal-col-playlist" style="display: none;">
                        <div class="vertical-scroll-list" id="modal-video-playlist"></div>
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
            titleFull: document.getElementById('modal-title-full'),
            titleLink: document.getElementById('modal-title-link'),
            titleLinkFull: document.getElementById('modal-title-link-full'),
            desc: document.getElementById('modal-desc'),
            descFull: document.getElementById('modal-desc-full'),
            
            id: document.getElementById('modal-id'),
            type: document.getElementById('modal-type'),
            
            videoSection: document.getElementById('modal-video-section'),
            iframe: document.getElementById('modal-iframe'),
            playlistCol: document.getElementById('modal-col-playlist'),
            videoPlaylist: document.getElementById('modal-video-playlist')
        };
    }

    initListeners() {
        this.closeBtn.addEventListener('click', () => { EventBus.emit('PLAY_SOUND', 'click'); this.close(); });
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay || e.target === this.els.cinematicBg) this.close(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.overlay.classList.contains('active')) this.close(); });
        
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

        const fallbackColor = precalculatedColor || item.customColor || '#ff2d95';
        this.updateThemeColor(fallbackColor);

        const handleSlideChange = (currentItem, extractedColor) => {
            this.renderer.triggerGlitchTransition(() => {
                this.updateThemeColor(extractedColor);
                const effectiveStatus = this.renderer.updateText(currentItem, type, extractedColor);
                
                this.player.render(currentItem, effectiveStatus, (newTitle) => {
                    this.els.title.textContent = newTitle;
                    this.els.titleFull.textContent = newTitle;
                });
            });
        };

        const handleImageLoadedColor = (extractedColor) => {
            this.updateThemeColor(extractedColor);
            this.els.ratingVal.style.color = extractedColor;
            this.els.segments.querySelectorAll('.filled').forEach(seg => {
                seg.style.color = extractedColor;
            });
        };

        this.posters.init(stackData, handleSlideChange, handleImageLoadedColor);
        
        const initStatus = this.renderer.updateText(stackData[0], type, fallbackColor);
        this.player.render(stackData[0], initStatus, (newTitle) => {
            this.els.title.textContent = newTitle;
            this.els.titleFull.textContent = newTitle;
        });

        document.body.classList.add('modal-open');
        this.overlay.classList.add('active');
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        setTimeout(() => this.player.stop(), 300);
    }
}