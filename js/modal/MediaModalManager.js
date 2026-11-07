/* js/modal/MediaModalManager.js */
import EventBus from '../event-bus.js';
import { ModalPosters } from './ModalPosters.js';
import { ModalPlayer } from './ModalPlayer.js';
import { ModalRenderer } from './ModalRenderer.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';

export class MediaModalManager {
    constructor() {
        this.buildDOM();
        this.posters = new ModalPosters(this.els.posterWrapper, this.els.posterDots, this.els.cinematicBg);
        this.player = new ModalPlayer(this.els.videoSection, this.els.iframe, this.els.videoPlaylist, this.els.playlistCol);
        this.renderer = new ModalRenderer(this.els);
        this.initListeners();
    }

    buildDOM() {
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'cyber-dialog';
        
        this.dialog.innerHTML = `
            <div class="media-modal-overlay" id="media-modal-overlay">
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
            </div>
        `;
        document.getElementById('modals-root').appendChild(this.dialog);

        this.overlay = this.dialog.querySelector('#media-modal-overlay');
        this.content = this.dialog.querySelector('.media-modal-content');
        this.closeBtn = this.dialog.querySelector('.modal-close-btn');
        
        this.els = {
            layout: this.dialog.querySelector('#modal-layout'),
            dynamicZone: this.dialog.querySelector('#modal-dynamic-zone'),
            techBarcode: this.dialog.querySelector('.modal-tech-barcode'),
            cinematicBg: this.dialog.querySelector('#modal-cinematic-bg'),
            posterWrapper: this.dialog.querySelector('.modal-poster-wrapper'),
            posterDots: this.dialog.querySelector('#modal-poster-dots'),
            ratingBox: this.dialog.querySelector('#modal-rating-box'),
            ratingVal: this.dialog.querySelector('#modal-rating-val'),
            segments: this.dialog.querySelector('#modal-segments'),
            status: this.dialog.querySelector('#modal-status'),
            title: this.dialog.querySelector('#modal-title'),
            titleFull: this.dialog.querySelector('#modal-title-full'),
            titleLink: this.dialog.querySelector('#modal-title-link'),
            titleLinkFull: this.dialog.querySelector('#modal-title-link-full'),
            desc: this.dialog.querySelector('#modal-desc'),
            descFull: this.dialog.querySelector('#modal-desc-full'),
            id: this.dialog.querySelector('#modal-id'),
            type: this.dialog.querySelector('#modal-type'),
            videoSection: this.dialog.querySelector('#modal-video-section'),
            iframe: this.dialog.querySelector('#modal-iframe'),
            playlistCol: this.dialog.querySelector('#modal-col-playlist'),
            videoPlaylist: this.dialog.querySelector('#modal-video-playlist')
        };
    }

    initListeners() {
        this.closeBtn.addEventListener('click', () => { EventBus.emit('PLAY_SOUND', 'click'); this.closeAction(); });
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay || e.target === this.els.cinematicBg) this.closeAction(); });
        
        // Нативная обработка Esc для <dialog>
        this.dialog.addEventListener('cancel', (e) => {
            e.preventDefault(); 
            this.closeAction();
        });

        AppStore.subscribe((state, prevState) => {
            const wasOpen = prevState?.modal?.isOpen && prevState?.modal?.type === 'media';
            const isOpen = state.modal.isOpen && state.modal.type === 'media';
            const idChanged = state.modal.dataId !== prevState?.modal?.dataId;
            const dataJustLoaded = state.data.isMediaLoaded && !prevState?.data?.isMediaLoaded;

            if ((isOpen && !wasOpen) || (isOpen && idChanged) || (isOpen && dataJustLoaded)) {
                this.tryOpen(state.modal.dataId, state.route.params.type || 'games');
            } else if (!isOpen && wasOpen) {
                this.closeDOM();
            }
        });
    }

    tryOpen(id, type) {
        const state = AppStore.getState();
        if (!state.data.isMediaLoaded) return; 

        const item = state.data.media.find(i => i.id === id || i.title === id);
        
        if (item) {
            this.open(item, type, null);
        } else {
            console.warn(`[MediaModal] Объект с ID "${id}" не найден в базе.`);
            this.closeAction();
        }
    }

    closeAction() {
        AppRouter.updateQuery({ modal: null, id: null });
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
        this.dialog.showModal();
        requestAnimationFrame(() => this.overlay.classList.add('active'));
    }

    closeDOM() {
        this.overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
            this.player.stop();
            this.dialog.close();
        }, 300);
    }
}