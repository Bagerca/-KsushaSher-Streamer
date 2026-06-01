/* js/media-modal.js */
import EventBus from './event-bus.js';

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
                            <div class="video-header"><i class="fas fa-film"></i> МЕДИА МАТЕРИАЛЫ</div>
                            <div class="video-container"><iframe id="modal-iframe" src="" frameborder="0" allowfullscreen></iframe></div>
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
            iframe: document.getElementById('modal-iframe'),
            playlist: document.getElementById('modal-playlist'),
            ratingBox: document.querySelector('.modal-rating-box')
        };
        console.log('🖼️ [Modal] DOM структура создана');
    }

    initListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) this.close();
        });

        EventBus.on('MODAL_OPEN_MEDIA', ({ item, type }) => this.open(item, type));
    }

    open(item, type) {
        const color = item.customColor || '#fff';
        this.content.style.setProperty('--modal-color', color);

        this.setupPosters(item);
        this.setupText(item, type, color);
        this.setupVideoPlayer(item);

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { if (this.els.iframe) this.els.iframe.src = ''; }, 300);
    }

    setupPosters(item) {
        this.posterWrapper.innerHTML = '<div class="modal-poster-glow"></div>';
        
        let imageUrls = [];
        if (item.format === 'youtube' && item.videos && item.videos.length > 0) {
            imageUrls = item.videos.slice(0, 3).map(v => `https://img.youtube.com/vi/${this.getYouTubeId(typeof v === 'string' ? v : v.url)}/maxresdefault.jpg`);
        } else if (item.images && item.images.length > 0) {
            imageUrls = [...item.images];
        } else if (item.image) {
            imageUrls = [item.image];
        } else {
            imageUrls = ['https://via.placeholder.com/600x900?text=NO+IMAGE'];
        }

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

        if (imgElements.length > 1 && item.format !== 'youtube') {
            this.posterWrapper.classList.add('is-interactive');
            this.posterWrapper.onclick = () => { imgElements.push(imgElements.shift()); updateClasses(); };
        } else {
            this.posterWrapper.classList.remove('is-interactive');
            this.posterWrapper.onclick = null;
        }
    }

    setupText(item, type, color) {
        this.els.title.textContent = item.title;
        this.els.desc.textContent = item.description || "Описание отсутствует.";
        this.els.id.textContent = item.id;
        this.els.type.textContent = type.toUpperCase();
        
        this.els.status.textContent = STATUS_TEXT_MAP[item.status] || item.status;
        const statusColor = STATUS_COLOR_MAP[item.status] || '#fff';
        this.els.status.style.backgroundColor = statusColor;
        this.els.status.style.boxShadow = `0 0 15px ${statusColor}`;
        this.els.status.style.color = ['dropped', 'playing', 'watching'].includes(item.status) ? '#fff' : '#000';

        if (item.status === 'suggested') {
            this.els.ratingBox.style.display = 'none';
            this.els.genres.innerHTML = '';
        } else {
            this.els.ratingBox.style.display = 'flex';
            this.els.ratingVal.textContent = item.rating;
            this.els.ratingVal.style.color = color;
            
            const fullStars = Math.floor(item.rating);
            this.els.stars.innerHTML = Array(5).fill(0).map((_, i) => `<i class="${i < fullStars ? 'fas' : 'far'} fa-star" style="${i < fullStars ? 'color:'+color : 'opacity:0.3'}"></i>`).join('');
            this.els.genres.innerHTML = item.genres ? item.genres.map(g => `<span class="modal-genre-tag">${g}</span>`).join('') : '';
        }
    }

    setupVideoPlayer(item) {
        const videos = item.videos;
        this.els.playlist.innerHTML = '';
        this.els.iframe.src = '';
        this.els.videoSection.className = 'modal-video-section';

        if (!videos || videos.length === 0) {
            this.els.videoSection.style.display = 'none';
            return;
        }

        this.els.videoSection.style.display = ''; 
        let firstValidId = null, validCount = 0;

        videos.forEach((vid, index) => {
            const isString = typeof vid === 'string';
            const url = isString ? vid : vid.url;
            let title = (!isString && vid.title) ? vid.title : "Загрузка...";
            const vidId = this.getYouTubeId(url);
            
            if (!vidId) return;
            validCount++;
            if (!firstValidId) firstValidId = vidId;

            const itemEl = document.createElement('div');
            itemEl.className = `playlist-item ${index === 0 ? 'active' : ''}`;
            itemEl.innerHTML = `<div class="pl-thumb"><img src="https://img.youtube.com/vi/${vidId}/mqdefault.jpg"><div class="pl-overlay"><i class="fas fa-play"></i></div></div><div class="pl-info"><div class="pl-title">${title}</div><div class="pl-status"><i class="fas fa-film"></i> СМОТРЕТЬ</div></div>`;
            
            itemEl.addEventListener('click', () => {
                document.querySelectorAll('.playlist-item').forEach(b => b.classList.remove('active'));
                itemEl.classList.add('active');
                this.els.iframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
                if (item.status === 'suggested') this.els.title.textContent = itemEl.querySelector('.pl-title').textContent;
            });
            
            this.els.playlist.appendChild(itemEl);

            if (isString) {
                this.fetchYoutubeTitle(url).then(t => {
                    itemEl.querySelector('.pl-title').textContent = t;
                    if (itemEl.classList.contains('active') && item.status === 'suggested') this.els.title.textContent = t;
                });
            } else if (index === 0 && item.status === 'suggested') this.els.title.textContent = title;
        });

        this.els.videoSection.classList.toggle('has-playlist', validCount > 0);
        this.els.playlist.style.display = validCount > 0 ? 'flex' : 'none';
        if (firstValidId) this.els.iframe.src = `https://www.youtube.com/embed/${firstValidId}?rel=0&modestbranding=1`;
        else this.els.videoSection.style.display = 'none';
    }

    getYouTubeId(url) {
        if (!url) return null;
        const match = url.match(/^.*(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        return (match && match[1].length === 11) ? match[1] : null;
    }

    async fetchYoutubeTitle(url) {
        try { const r = await fetch(`https://noembed.com/embed?url=${url}`); const d = await r.json(); return d.title || "YouTube Video"; } catch { return "YouTube Video"; }
    }
}