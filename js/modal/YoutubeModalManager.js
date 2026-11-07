/* js/modal/YoutubeModalManager.js */
import EventBus from '../event-bus.js';
import { getYouTubeId, extractColorFromImageAsync } from '../utils.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';

export class YoutubeModalManager {
    constructor() {
        this.buildDOM();
        this.initListeners();
        this.fallbackColor = '#ff0000';
    }

    buildDOM() {
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'cyber-dialog';
        
        this.dialog.innerHTML = `
            <div class="yt-modal-overlay" id="yt-modal-overlay">
                <div class="yt-cinematic-bg" id="yt-cinematic-bg"></div>
                <button class="modal-close-btn" id="yt-close-btn" title="Закрыть (Esc)"><i class="fas fa-times"></i></button>
                
                <div class="yt-modal-content" id="yt-modal-content">
                    <div class="yt-main-col">
                        <div class="yt-player-wrapper">
                            <iframe id="yt-iframe" src="" frameborder="0" allow="encrypted-media" allowfullscreen></iframe>
                        </div>
                        
                        <div class="yt-info-section">
                            <div class="hover-reveal-wrapper">
                                <h2 class="yt-title truncated">
                                    <a href="#" target="_blank" id="yt-title-link" class="title-search-link" title="Искать в Google">
                                        <span id="yt-title">TITLE</span>
                                        <i class="fab fa-google search-icon"></i>
                                    </a>
                                </h2>
                            </div>
                            
                            <div class="hover-reveal-wrapper" id="yt-desc-wrapper" style="margin-top: 15px;">
                                <p class="yt-desc truncated" id="yt-desc">Description</p>
                            </div>
                        </div>
                    </div>

                    <div class="yt-playlist-col" id="yt-playlist-col" style="display: none;">
                        <div class="yt-playlist-items" id="yt-playlist-items"></div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modals-root').appendChild(this.dialog);

        this.overlay = this.dialog.querySelector('#yt-modal-overlay');
        this.els = {
            content: this.dialog.querySelector('#yt-modal-content'),
            bg: this.dialog.querySelector('#yt-cinematic-bg'),
            closeBtn: this.dialog.querySelector('#yt-close-btn'),
            iframe: this.dialog.querySelector('#yt-iframe'),
            title: this.dialog.querySelector('#yt-title'),
            titleLink: this.dialog.querySelector('#yt-title-link'),
            descWrapper: this.dialog.querySelector('#yt-desc-wrapper'),
            desc: this.dialog.querySelector('#yt-desc'),
            playlistCol: this.dialog.querySelector('#yt-playlist-col'),
            playlistItems: this.dialog.querySelector('#yt-playlist-items')
        };
    }

    initListeners() {
        this.els.closeBtn.addEventListener('click', () => { EventBus.emit('PLAY_SOUND', 'click'); this.closeAction(); });
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay || e.target === this.els.bg) this.closeAction(); });
        
        this.dialog.addEventListener('cancel', (e) => {
            e.preventDefault(); 
            this.closeAction();
        });

        AppStore.subscribe((state, prevState) => {
            const wasOpen = prevState?.modal?.isOpen && prevState?.modal?.type === 'youtube';
            const isOpen = state.modal.isOpen && state.modal.type === 'youtube';
            const idChanged = state.modal.dataId !== prevState?.modal?.dataId;
            const dataJustLoaded = state.data.isMediaLoaded && !prevState?.data?.isMediaLoaded;

            if ((isOpen && !wasOpen) || (isOpen && idChanged) || (isOpen && dataJustLoaded)) {
                this.tryOpen(state.modal.dataId);
            } else if (!isOpen && wasOpen) {
                this.closeDOM();
            }
        });
    }

    tryOpen(id) {
        const state = AppStore.getState();
        if (!state.data.isMediaLoaded) return; 

        const item = state.data.media.find(i => i.id === id || i.title === id);
        
        if (item) {
            this.open(item, null);
        } else {
            console.warn(`[YoutubeModal] Видео с ID "${id}" не найдено в базе.`);
            this.closeAction();
        }
    }

    closeAction() {
        AppRouter.updateQuery({ modal: null, id: null });
    }

    updateGoogleLinks(text) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
        if (this.els.titleLink) this.els.titleLink.href = searchUrl;
    }

    open(item, color) {
        this.currentItem = item;
        this.fallbackColor = color || item.customColor || '#ff0000';
        this.overlay.style.setProperty('--yt-color', this.fallbackColor);
        
        this.els.title.textContent = item.title;
        this.updateGoogleLinks(item.title);
        
        let descText = item.description;
        const effectiveStatus = item.status || 'unknown';
        
        if (!descText || descText.trim() === '' || descText.trim() === '...') {
            this.els.descWrapper.style.display = 'none';
        } else {
            this.els.descWrapper.style.display = 'block';
            this.els.desc.innerHTML = '';

            if (effectiveStatus === 'suggested' && item.suggestedBy) {
                const prefixSpan = document.createElement('span');
                prefixSpan.style.color = 'var(--yt-color)';
                prefixSpan.style.fontWeight = '700';
                prefixSpan.innerHTML = '<i class="fas fa-user"></i> '; 
                
                const authorText = document.createTextNode(`${item.suggestedBy}: `);
                prefixSpan.appendChild(authorText);
                
                const mainDescNode = document.createTextNode(descText);
                
                this.els.desc.appendChild(prefixSpan);
                this.els.desc.appendChild(mainDescNode);
            } else {
                this.els.desc.textContent = descText;
            }
        }

        this.renderPlaylist(item.videos, effectiveStatus);

        document.body.classList.add('modal-open');
        this.dialog.showModal();
        requestAnimationFrame(() => this.overlay.classList.add('active'));
    }

    async extractAndApplyColor(imageUrl) {
        if (!imageUrl) return;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.decoding = "async";
        img.src = imageUrl;
        
        try {
            await img.decode();
            const color = await extractColorFromImageAsync(img);
            if (color) this.overlay.style.setProperty('--yt-color', color);
        } catch (e) {
            this.overlay.style.setProperty('--yt-color', this.fallbackColor);
        }
    }

    renderPlaylist(videos, status) {
        if (!videos || videos.length === 0) return;

        this.els.playlistItems.innerHTML = '';
        let firstValidId = null;

        videos.forEach((url, index) => { 
            const loopYtId = getYouTubeId(url);
            if (!loopYtId) return;
            if (!firstValidId) firstValidId = loopYtId;

            const card = document.createElement('div');
            card.className = `yt-playlist-card ${index === 0 ? 'active' : ''}`;
            
            card.innerHTML = `
                <div class="yt-thumb">
                    <img src="https://img.youtube.com/vi/${loopYtId}/hqdefault.jpg" alt="thumbnail">
                    <div class="yt-overlay"><i class="fas fa-play play-icon"></i><div class="yt-equalizer"><span></span><span></span><span></span></div></div>
                </div>
                <div class="yt-card-info">
                    <div class="yt-card-title">Запись #${index + 1}</div>
                    <div class="yt-card-status">СМОТРЕТЬ</div>
                </div>
            `;
            
            const titleEl = card.querySelector('.yt-card-title');

            card.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.els.playlistItems.querySelectorAll('.yt-playlist-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.setVideo(loopYtId, titleEl.textContent);
            });

            this.els.playlistItems.appendChild(card);

            fetch(`https://noembed.com/embed?url=${url}`).then(r => r.json()).then(d => {
                if (d.title) {
                    titleEl.textContent = d.title;
                    if (card.classList.contains('active') && status === 'suggested') {
                        this.els.title.textContent = d.title;
                        this.updateGoogleLinks(d.title);
                    }
                }
            }).catch(() => {});
        });

        if (videos.length > 1) {
            this.els.playlistCol.style.display = 'flex';
            this.els.content.classList.add('has-playlist');
        } else {
            this.els.playlistCol.style.display = 'none';
            this.els.content.classList.remove('has-playlist');
        }

        if (firstValidId) this.setVideo(firstValidId, this.currentItem.title);
    }

    setVideo(ytId, title) {
        this.els.iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1`;
        this.els.bg.style.backgroundImage = `url('https://img.youtube.com/vi/${ytId}/hqdefault.jpg')`;
        
        this.extractAndApplyColor(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);

        if (this.currentItem.status === 'suggested') {
            this.els.title.textContent = title;
            this.updateGoogleLinks(title);
        }
    }

    closeDOM() {
        this.overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        setTimeout(() => { 
            this.els.iframe.src = ''; 
            this.dialog.close();
        }, 300);
    }
}