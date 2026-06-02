/* js/media-modal.js */
import EventBus from './event-bus.js';
import { GENRE_MAP } from './media-store.js';
import { getYouTubeId } from './utils.js';

const STATUS_TEXT_MAP = {
    'completed': 'ЗАВЕРШЕНО', 'watched': 'ПРОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'НА ПАУЗЕ',
    'suggested': 'ПРЕДЛОЖЕНО'
};

const STATUS_COLOR_MAP = {
    'completed': '#39ff14', 'watched': '#39ff14',
    'playing': '#007bff', 'watching': '#007bff',
    'dropped': '#ff4444', 'on-hold': '#ffd700', 'suggested': '#ff2d95' 
};

export class MediaModalManager {
    constructor() {
        this.buildDOM();
        this.initListeners();
    }

    buildDOM() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'media-modal-overlay';
        this.overlay.id = 'media-modal-overlay';
        
        this.overlay.innerHTML = `
            <div class="media-modal-content">
                <button class="modal-close-btn">&times;</button>
                <div class="modal-layout">
                    <div class="modal-col-sidebar">
                        <div class="modal-poster-wrapper"><div class="modal-poster-glow"></div></div>
                        <div class="modal-rating-box">
                            <span id="modal-rating-val">0.0</span>
                            <div class="modal-stars" id="modal-stars"></div>
                        </div>
                        <div class="modal-tech-data">
                            <div class="tech-line"><span>ID:</span> <span class="t-val" id="modal-id">---</span></div>
                            <div class="tech-line"><span>TYPE:</span> <span class="t-val neon-pulse" id="modal-type">---</span></div>
                        </div>
                    </div>
                    <div class="modal-col-main">
                        <div class="modal-header">
                            <div class="modal-header-top">
                                <h2 class="modal-title" id="modal-title">TITLE</h2>
                                <span class="modal-status-badge" id="modal-status">STATUS</span>
                            </div>
                            <div class="modal-meta-row" id="modal-genres"></div>
                        </div>
                        <div class="modal-body"><p class="modal-desc" id="modal-desc"></p></div>
                        <div class="modal-video-section" id="modal-video-section" style="display: none;">
                            <div class="video-header"><i class="fas fa-bars"></i> <span id="modal-sidebar-title">СОДЕРЖИМОЕ</span></div>
                            <div class="video-container" id="modal-player-container"><iframe id="modal-iframe" src="" frameborder="0" allowfullscreen></iframe></div>
                            <div class="video-playlist" id="modal-playlist"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.closeBtn = this.overlay.querySelector('.modal-close-btn');
        this.content = this.overlay.querySelector('.media-modal-content');
        this.posterWrapper = this.overlay.querySelector('.modal-poster-wrapper');
        
        this.els = {
            ratingVal: document.getElementById('modal-rating-val'),
            stars: document.getElementById('modal-stars'),
            status: document.getElementById('modal-status'),
            title: document.getElementById('modal-title'),
            genres: document.getElementById('modal-genres'),
            desc: document.getElementById('modal-desc'),
            id: document.getElementById('modal-id'),
            type: document.getElementById('modal-type'),
            videoSection: document.getElementById('modal-video-section'),
            playerContainer: document.getElementById('modal-player-container'),
            iframe: document.getElementById('modal-iframe'),
            playlist: document.getElementById('modal-playlist'),
            ratingBox: document.querySelector('.modal-rating-box'),
            sidebarTitle: document.getElementById('modal-sidebar-title')
        };
    }

    initListeners() {
        this.closeBtn.addEventListener('click', () => { EventBus.emit('PLAY_SOUND', 'click'); this.close(); });
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.overlay.classList.contains('active')) this.close(); });

        EventBus.on('MODAL_OPEN_MEDIA', ({ item, type }) => this.open(item, type));
    }

    open(item, type) {
        const color = item.customColor || '#fff';
        this.content.style.setProperty('--modal-color', color);

        if (item.format === 'collection' && item.items && item.items.length > 0) {
            this.setupCollectionSidebar(item, color);
            this.renderDynamicContent(item.items[0], item, type, color);
        } else {
            // ИСПРАВЛЕН БАГ: Выводим ютуб плеер для любых элементов, у которых есть массив videos
            if (item.videos && item.videos.length > 0) {
                this.setupYouTubeSidebar(item);
            } else {
                this.els.videoSection.style.display = 'none';
            }
            this.renderDynamicContent(item, item, type, color);
        }

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    renderDynamicContent(subItem, parentItem, type, color) {
        this.setupPosters(subItem, parentItem);
        this.els.title.textContent = subItem.title || parentItem.title;
        this.els.desc.textContent = subItem.description || parentItem.description || "Описание отсутствует.";
        this.els.id.textContent = subItem.id || parentItem.id;
        this.els.type.textContent = type.toUpperCase();
        
        const effectiveStatus = subItem.status || parentItem.status;
        this.els.status.textContent = STATUS_TEXT_MAP[effectiveStatus] || effectiveStatus;
        
        const statusColor = STATUS_COLOR_MAP[effectiveStatus] || '#fff';
        this.els.status.style.backgroundColor = statusColor;
        this.els.status.style.boxShadow = `0 0 15px ${statusColor}`;
        this.els.status.style.color = ['dropped', 'playing', 'watching'].includes(effectiveStatus) ? '#fff' : '#000';

        if (effectiveStatus === 'suggested') {
            this.els.ratingBox.style.display = 'none';
            this.els.genres.innerHTML = '';
        } else {
            this.els.ratingBox.style.display = 'flex';
            const rating = subItem.rating || parentItem.rating || 0;
            this.els.ratingVal.textContent = rating;
            this.els.ratingVal.style.color = color;
            
            const fullStars = Math.floor(rating);
            this.els.stars.innerHTML = Array(5).fill(0).map((_, i) => `<i class="${i < fullStars ? 'fas' : 'far'} fa-star" style="${i < fullStars ? 'color:'+color : 'opacity:0.3'}"></i>`).join('');
            
            const genres = subItem.genres || parentItem.genres;
            this.els.genres.innerHTML = genres ? genres.map(g => `<span class="modal-genre-tag">${GENRE_MAP[g] || g}</span>`).join('') : '';
        }
    }

    setupPosters(subItem, parentItem) {
        this.posterWrapper.innerHTML = '<div class="modal-poster-glow"></div>';
        
        let imageUrls = [];
        if (subItem.images && subItem.images.length > 0) imageUrls = [...subItem.images];
        else if (subItem.image) imageUrls = [subItem.image];
        else if (parentItem.images && parentItem.images.length > 0) imageUrls = [...parentItem.images];
        else if (parentItem.image) imageUrls = [parentItem.image];
        else imageUrls = ['https://via.placeholder.com/600x900?text=NO+IMAGE'];

        const imgElements = imageUrls.map(src => {
            const img = document.createElement('img');
            img.src = src; img.className = 'modal-poster-img'; 
            this.posterWrapper.appendChild(img); return img;
        });

        const updateClasses = () => {
            imgElements.forEach((img, index) => {
                img.classList.remove('is-front', 'is-back', 'is-back-2', 'is-hidden');
                if (index === 0) { img.classList.add('is-front'); img.style.zIndex = 30; }
                else if (index === 1) { img.classList.add('is-back'); img.style.zIndex = 20; }
                else if (index === 2) { img.classList.add('is-back-2'); img.style.zIndex = 10; }
                else { img.classList.add('is-hidden'); img.style.zIndex = 0; }
            });
        };
        updateClasses();

        if (imgElements.length > 1) {
            this.posterWrapper.classList.add('is-interactive');
            this.posterWrapper.onclick = () => { EventBus.emit('PLAY_SOUND', 'hover'); imgElements.push(imgElements.shift()); updateClasses(); };
        } else {
            this.posterWrapper.classList.remove('is-interactive');
            this.posterWrapper.onclick = null;
        }
    }

    setupCollectionSidebar(item, color) {
        this.els.videoSection.style.display = '';
        this.els.videoSection.className = 'modal-video-section has-playlist is-collection';
        this.els.sidebarTitle.textContent = "ЧАСТИ ФРАНШИЗЫ";
        this.els.playerContainer.style.display = 'none'; 
        this.els.playlist.innerHTML = '';

        item.items.forEach((sub, index) => {
            const thumbUrl = sub.image || item.image || 'https://via.placeholder.com/150';
            const itemEl = document.createElement('div');
            itemEl.className = `playlist-item ${index === 0 ? 'active' : ''}`;
            itemEl.innerHTML = `<div class="pl-thumb"><img src="${thumbUrl}"></div><div class="pl-info"><div class="pl-title">${sub.title}</div><div class="pl-status"><i class="fas fa-folder"></i> ДОСЬЕ</div></div>`;
            
            itemEl.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                document.querySelectorAll('.playlist-item').forEach(b => b.classList.remove('active'));
                itemEl.classList.add('active');
                this.renderDynamicContent(sub, item, item.type, color);
            });
            this.els.playlist.appendChild(itemEl);
        });
    }

    setupYouTubeSidebar(item) {
        const videos = item.videos;
        if (!videos || videos.length === 0) return;

        this.els.videoSection.style.display = ''; 
        this.els.videoSection.className = 'modal-video-section has-playlist';
        this.els.sidebarTitle.textContent = "МЕДИА МАТЕРИАЛЫ";
        this.els.playerContainer.style.display = '';
        this.els.playlist.innerHTML = '';
        
        let firstValidId = null;

        videos.forEach((vid, index) => {
            const isString = typeof vid === 'string';
            const url = isString ? vid : vid.url;
            let title = (!isString && vid.title) ? vid.title : `Видео фрагмент #${index + 1}`;
            const vidId = getYouTubeId(url);
            
            if (!vidId) return;
            if (!firstValidId) firstValidId = vidId;

            const itemEl = document.createElement('div');
            itemEl.className = `playlist-item ${index === 0 ? 'active' : ''}`;
            itemEl.innerHTML = `
                <div class="pl-thumb"><img src="https://img.youtube.com/vi/${vidId}/mqdefault.jpg"><div class="pl-overlay"><i class="fas fa-play"></i></div></div>
                <div class="pl-info"><div class="pl-title">${title}</div><div class="pl-status"><i class="fas fa-film"></i> СМОТРЕТЬ</div></div>`;
            
            itemEl.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                document.querySelectorAll('.playlist-item').forEach(b => b.classList.remove('active'));
                itemEl.classList.add('active');
                this.els.iframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
                if (item.status === 'suggested') this.els.title.textContent = itemEl.querySelector('.pl-title').textContent;
            });
            this.els.playlist.appendChild(itemEl);

            if (isString) {
                fetch(`https://noembed.com/embed?url=${url}`).then(r => r.json()).then(d => {
                    if (d.title) {
                        itemEl.querySelector('.pl-title').textContent = d.title;
                        if (itemEl.classList.contains('active') && item.status === 'suggested') this.els.title.textContent = d.title;
                    }
                }).catch(() => {});
            }
        });

        if (firstValidId) this.els.iframe.src = `https://www.youtube.com/embed/${firstValidId}?rel=0&modestbranding=1`;
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { if (this.els.iframe) this.els.iframe.src = ''; }, 300);
    }
}