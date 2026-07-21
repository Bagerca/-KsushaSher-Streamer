/* js/modal/YoutubeModalManager.js */
import EventBus from '../event-bus.js';
import { getYouTubeId, extractColorFromImageAsync } from '../utils.js';

export class YoutubeModalManager {
    constructor() {
        this.buildDOM();
        this.initListeners();
        this.fallbackColor = '#ff0000';
    }

    buildDOM() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'yt-modal-overlay';
        this.overlay.id = 'yt-modal-overlay';
        
        this.overlay.innerHTML = `
            <div class="yt-cinematic-bg" id="yt-cinematic-bg"></div>
            <button class="modal-close-btn" id="yt-close-btn" title="Закрыть (Esc)"><i class="fas fa-times"></i></button>
            
            <div class="yt-modal-content" id="yt-modal-content">
                <div class="yt-main-col">
                    <div class="yt-player-wrapper">
                        <iframe id="yt-iframe" src="" frameborder="0" allow="encrypted-media" allowfullscreen></iframe>
                    </div>
                    
                    <div class="yt-info-section">
                        <div class="hover-reveal-wrapper">
                            <h2 class="yt-title truncated" id="yt-title">TITLE</h2>
                            <div class="hover-reveal-box">
                                <h2 class="yt-title" id="yt-title-full">TITLE</h2>
                            </div>
                        </div>
                        
                        <div class="hover-reveal-wrapper" style="margin-top: 15px;">
                            <p class="yt-desc truncated" id="yt-desc">Description</p>
                            <div class="hover-reveal-box">
                                <p class="yt-desc" id="yt-desc-full">Description</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="yt-playlist-col" id="yt-playlist-col" style="display: none;">
                    <div class="yt-playlist-header"><i class="fas fa-list"></i> СПИСОК РОЛИКОВ</div>
                    <div class="yt-playlist-items" id="yt-playlist-items"></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.els = {
            content: document.getElementById('yt-modal-content'),
            bg: document.getElementById('yt-cinematic-bg'),
            closeBtn: document.getElementById('yt-close-btn'),
            iframe: document.getElementById('yt-iframe'),
            
            title: document.getElementById('yt-title'),
            titleFull: document.getElementById('yt-title-full'),
            desc: document.getElementById('yt-desc'),
            descFull: document.getElementById('yt-desc-full'),
            
            playlistCol: document.getElementById('yt-playlist-col'),
            playlistItems: document.getElementById('yt-playlist-items')
        };
    }

    initListeners() {
        this.els.closeBtn.addEventListener('click', () => { EventBus.emit('PLAY_SOUND', 'click'); this.close(); });
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay || e.target === this.els.bg) this.close(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.overlay.classList.contains('active')) this.close(); });
        
        EventBus.on('MODAL_OPEN_YOUTUBE', ({ item, triggerElement }) => {
            const precalculatedColor = triggerElement ? triggerElement.dataset.extractedColor : null;
            this.open(item, precalculatedColor);
        });
    }

    open(item, color) {
        this.currentItem = item;
        this.fallbackColor = color || item.customColor || '#ff0000';
        this.overlay.style.setProperty('--yt-color', this.fallbackColor);
        
        this.els.title.textContent = item.title;
        this.els.titleFull.textContent = item.title;
        
        let descText = item.description || "Описание отсутствует.";
        const effectiveStatus = item.status || 'unknown';
        
        this.els.desc.innerHTML = '';
        this.els.descFull.innerHTML = '';

        if (effectiveStatus === 'suggested' && item.suggestedBy) {
            const prefixSpan = document.createElement('span');
            prefixSpan.style.color = 'var(--yt-color)';
            prefixSpan.style.fontWeight = '700';
            prefixSpan.innerHTML = '<i class="fas fa-user"></i> '; 
            
            const authorText = document.createTextNode(`${item.suggestedBy}: `);
            prefixSpan.appendChild(authorText);
            
            const mainDescNode = document.createTextNode(descText);
            
            this.els.desc.appendChild(prefixSpan.cloneNode(true));
            this.els.desc.appendChild(mainDescNode.cloneNode());
            
            this.els.descFull.appendChild(prefixSpan);
            this.els.descFull.appendChild(mainDescNode);
        } else {
            this.els.desc.textContent = descText;
            this.els.descFull.textContent = descText;
        }

        this.renderPlaylist(item.videos, effectiveStatus);

        document.body.classList.add('modal-open');
        this.overlay.classList.add('active');
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

        videos.forEach((url, index) => { // ИСПРАВЛЕНИЕ: Ждем только строку url
            const loopYtId = getYouTubeId(url);
            if (!loopYtId) return;
            if (!firstValidId) firstValidId = loopYtId;

            const card = document.createElement('div');
            card.className = `yt-playlist-card ${index === 0 ? 'active' : ''}`;
            
            card.innerHTML = `
                <div class="yt-thumb"><img src="https://img.youtube.com/vi/${loopYtId}/hqdefault.jpg" alt="thumbnail"></div>
                <div class="yt-card-info">
                    <div class="yt-card-title">Ролик #${index + 1}</div>
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

            // АВТО-ПАРСИНГ ИМЕНИ
            fetch(`https://noembed.com/embed?url=${url}`).then(r => r.json()).then(d => {
                if (d.title) {
                    titleEl.textContent = d.title;
                    if (card.classList.contains('active') && status === 'suggested') {
                        this.els.title.textContent = d.title;
                        this.els.titleFull.textContent = d.title;
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
            this.els.titleFull.textContent = title;
        }
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        setTimeout(() => { this.els.iframe.src = ''; }, 300);
    }
}