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
            <div class="modal-cinematic-bg" id="modal-cinematic-bg"></div>
            <button class="modal-close-btn" title="Закрыть (Esc)"><i class="fas fa-times"></i></button>
            
            <div class="media-modal-content">
                <div class="modal-layout" id="modal-layout">
                    <!-- ЛЕВАЯ КОЛОНКА -->
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
                    
                    <!-- ПРАВАЯ КОЛОНКА -->
                    <div class="modal-col-main" id="modal-col-main">
                        <!-- ЗОНА 1: Инфа и Плеер -->
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
                                    <div class="modal-genres-container" id="modal-genres"></div>
                                </div>
                            </div>
                            
                            <div class="modal-body"><p class="modal-desc" id="modal-desc"></p></div>

                            <!-- ЗОНА 2: ВИДЕО ПЛЕЕР -->
                            <div class="modal-video-section" id="modal-video-section" style="display: none;">
                                <div class="video-header"><i class="fas fa-play-circle"></i> <span>МЕДИА АРХИВ</span></div>
                                <div class="video-container" id="modal-player-container"><iframe id="modal-iframe" src="" frameborder="0" allowfullscreen></iframe></div>
                                <div class="horizontal-scroll-list" id="modal-video-playlist"></div>
                            </div>
                        </div>

                        <!-- ЗОНА 3: ПОЛКА ФРАНШИЗЫ -->
                        <div class="modal-franchise-section" id="modal-franchise-section" style="display: none;">
                            <div class="franchise-header"><i class="fas fa-sitemap"></i> СТРУКТУРА ФРАНШИЗЫ</div>
                            <div class="horizontal-scroll-list" id="modal-franchise-list"></div>
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
            layout: document.getElementById('modal-layout'),
            colSidebar: document.getElementById('modal-col-sidebar'),
            colMain: document.getElementById('modal-col-main'),
            dynamicZone: document.getElementById('modal-dynamic-zone'),
            cinematicBg: document.getElementById('modal-cinematic-bg'),
            posterDots: document.getElementById('modal-poster-dots'),
            ratingBox: document.getElementById('modal-rating-box'),
            ratingVal: document.getElementById('modal-rating-val'),
            segments: document.getElementById('modal-segments'),
            status: document.getElementById('modal-status'),
            title: document.getElementById('modal-title'),
            genres: document.getElementById('modal-genres'),
            desc: document.getElementById('modal-desc'),
            id: document.getElementById('modal-id'),
            type: document.getElementById('modal-type'),
            
            videoSection: document.getElementById('modal-video-section'),
            playerContainer: document.getElementById('modal-player-container'),
            iframe: document.getElementById('modal-iframe'),
            videoPlaylist: document.getElementById('modal-video-playlist'),
            
            franchiseSection: document.getElementById('modal-franchise-section'),
            franchiseList: document.getElementById('modal-franchise-list')
        };
    }

    initListeners() {
        this.closeBtn.addEventListener('click', () => { EventBus.emit('PLAY_SOUND', 'click'); this.close(); });
        this.overlay.addEventListener('click', (e) => { 
            if (e.target === this.overlay || e.target === this.els.cinematicBg) this.close(); 
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.overlay.classList.contains('active')) this.close(); });
        EventBus.on('MODAL_OPEN_MEDIA', ({ item, type }) => this.open(item, type));
    }

    open(item, type) {
        const color = item.customColor || '#fff';
        this.content.style.setProperty('--modal-color', color);
        this.overlay.style.setProperty('--modal-color', color); 
        
        this.els.layout.className = 'modal-layout';
        this.els.videoSection.style.display = 'none';
        this.els.franchiseSection.style.display = 'none';
        this.els.iframe.src = '';
        
        // Включаем "Кинотеатр"
        if (item.format === 'youtube') {
            this.els.layout.classList.add('layout-cinema');
            this.overlay.classList.add('is-cinema-mode'); 
        } else {
            this.els.layout.classList.add('layout-standard');
            this.overlay.classList.remove('is-cinema-mode');
        }

        const bgImg = (item.images && item.images.length > 0) ? item.images[0] : item.image;
        if (bgImg) this.els.cinematicBg.style.backgroundImage = `url('${bgImg}')`;

        if (item.format === 'collection' && item.items && item.items.length > 0) {
            this.setupCollectionView(item, type, color);
            this.renderDynamicContent(item, item, type, color); 
            this.setupYouTubeView(item, item.status);
        } else {
            this.renderDynamicContent(item, item, type, color);
            this.setupYouTubeView(item, item.status);
        }

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    triggerSmoothTransition(callback) {
        const elementsToAnimate = [this.els.colSidebar, this.els.dynamicZone];
        elementsToAnimate.forEach(el => el.classList.add('fade-out'));
        
        setTimeout(() => {
            callback(); 
            elementsToAnimate.forEach(el => {
                el.classList.remove('fade-out');
                el.classList.add('fade-in');
            });
            setTimeout(() => {
                elementsToAnimate.forEach(el => el.classList.remove('fade-in'));
            }, 300);
        }, 200); 
    }

    renderDynamicContent(subItem, parentItem, type, color) {
        this.setupPosters(subItem, parentItem);
        
        this.els.title.textContent = subItem.title || parentItem.title;
        this.els.desc.textContent = subItem.description || parentItem.description || "Описание отсутствует.";
        this.els.id.textContent = subItem.id || parentItem.id;
        this.els.type.textContent = type ? type.toUpperCase() : "UNKNOWN";
        
        const effectiveStatus = subItem.status || parentItem.status;
        this.els.status.textContent = STATUS_TEXT_MAP[effectiveStatus] || effectiveStatus;
        
        const statusColor = STATUS_COLOR_MAP[effectiveStatus] || '#fff';
        this.els.status.style.backgroundColor = statusColor;
        this.els.status.style.color = ['dropped', 'playing', 'watching'].includes(effectiveStatus) ? '#fff' : '#000';

        if (effectiveStatus === 'suggested') {
            this.els.ratingBox.style.display = 'none';
            this.els.genres.innerHTML = '';
        } else {
            this.els.ratingBox.style.display = 'flex';
            
            let rating = subItem.rating || 0;
            if (subItem.format === 'collection' && subItem.items) {
                let sum = 0, count = 0;
                subItem.items.forEach(i => { if (i.rating > 0) { sum += i.rating; count++; } });
                if (count > 0) rating = sum / count;
            }
            
            if (rating > 0) {
                this.els.ratingVal.textContent = rating.toFixed(1);
                this.els.ratingVal.style.color = color;
                
                const rScore = Math.round(rating);
                let segmentsHtml = '';
                for(let i=0; i<5; i++) {
                    segmentsHtml += `<div class="modal-segment-line ${i < rScore ? 'filled' : ''}" style="color:${color}"></div>`;
                }
                this.els.segments.innerHTML = segmentsHtml;
            } else {
                this.els.ratingVal.textContent = "N/A";
                this.els.ratingVal.style.color = "#666";
                this.els.segments.innerHTML = `<span style="font-family:monospace;font-size:0.7rem;color:#666;">NO_DATA</span>`;
            }
            
            const genres = subItem.genres || parentItem.genres;
            this.els.genres.innerHTML = genres ? genres.map(g => `<span class="modal-genre-tag">${GENRE_MAP[g] || g}</span>`).join('') : '';
        }
    }

    setupPosters(subItem, parentItem) {
        this.posterWrapper.innerHTML = '<div class="modal-poster-glow"></div>';
        this.els.posterDots.innerHTML = '';
        
        let imageUrls = [];
        if (subItem.images && subItem.images.length > 0) imageUrls = [...subItem.images];
        else if (subItem.image) imageUrls = [subItem.image];
        else if (parentItem.images && parentItem.images.length > 0) imageUrls = [...parentItem.images];
        else if (parentItem.image) imageUrls = [parentItem.image];
        else imageUrls = ['https://via.placeholder.com/600x900?text=NO+IMAGE'];

        let currentIndex = 0;

        const imgElements = imageUrls.map((src, index) => {
            const img = document.createElement('img');
            img.src = src; img.className = 'modal-poster-img'; 
            this.posterWrapper.appendChild(img); 
            if (imageUrls.length > 1) {
                const dot = document.createElement('div');
                dot.className = 'poster-dot';
                this.els.posterDots.appendChild(dot);
            }
            return img;
        });

        const updateVisuals = () => {
            imgElements.forEach((img, index) => {
                img.classList.remove('is-front', 'is-back', 'is-back-2', 'is-hidden');
                let relIndex = (index - currentIndex + imgElements.length) % imgElements.length;
                if (relIndex === 0) { img.classList.add('is-front'); img.style.zIndex = 30; }
                else if (relIndex === 1) { img.classList.add('is-back'); img.style.zIndex = 20; }
                else if (relIndex === 2) { img.classList.add('is-back-2'); img.style.zIndex = 10; }
                else { img.classList.add('is-hidden'); img.style.zIndex = 0; }
            });
            if (imageUrls.length > 1) {
                const dots = this.els.posterDots.querySelectorAll('.poster-dot');
                dots.forEach((dot, index) => { dot.classList.toggle('active', index === currentIndex); });
            }
        };
        updateVisuals(); 

        if (imgElements.length > 1) {
            this.posterWrapper.classList.add('is-interactive');
            this.posterWrapper.onclick = () => { 
                EventBus.emit('PLAY_SOUND', 'hover'); 
                currentIndex = (currentIndex + 1) % imgElements.length; 
                updateVisuals(); 
            };
        } else {
            this.posterWrapper.classList.remove('is-interactive');
            this.posterWrapper.onclick = null;
        }
    }

    setupCollectionView(item, type, color) {
        this.els.franchiseSection.style.display = 'block';
        this.els.franchiseList.innerHTML = '';

        const collectionItems = [{ isRoot: true, ...item }, ...item.items];

        collectionItems.forEach((sub, index) => {
            const thumbUrl = sub.image || item.image || 'https://via.placeholder.com/200x300';
            const itemEl = document.createElement('div');
            itemEl.className = `scroll-card franchise-card ${index === 0 ? 'active is-root-item' : ''}`;
            
            const iconHtml = sub.isRoot ? '<i class="fas fa-folder-open"></i>' : '<i class="fas fa-file-alt"></i>';
            const statusHtml = sub.isRoot ? 'MAIN HUB' : 'ДОСЬЕ';

            itemEl.innerHTML = `
                <div class="sc-thumb"><img src="${thumbUrl}"><div class="sc-overlay">${iconHtml}</div></div>
                <div class="sc-info"><div class="sc-title">${sub.title}</div><div class="sc-status">${statusHtml}</div></div>
            `;
            
            itemEl.addEventListener('click', () => {
                if (itemEl.classList.contains('active')) return;
                EventBus.emit('PLAY_SOUND', 'click');
                
                document.querySelectorAll('.franchise-card').forEach(b => b.classList.remove('active'));
                itemEl.classList.add('active');
                
                this.triggerSmoothTransition(() => {
                    this.renderDynamicContent(sub, item, type, color); 
                    this.setupYouTubeView(sub, item.status);
                });
            });
            this.els.franchiseList.appendChild(itemEl);
        });
    }

    setupYouTubeView(targetItem, rootStatus) {
        const videos = targetItem.videos;
        
        if (!videos || videos.length === 0) {
            this.els.videoSection.style.display = 'none';
            this.els.iframe.src = '';
            return;
        }

        this.els.videoSection.style.display = 'flex'; 
        this.els.videoPlaylist.innerHTML = '';
        
        let firstValidId = null;

        videos.forEach((vid, index) => {
            const isString = typeof vid === 'string';
            const url = isString ? vid : vid.url;
            let title = (!isString && vid.title) ? vid.title : `Запись #${index + 1}`;
            const vidId = getYouTubeId(url);
            
            if (!vidId) return;
            if (!firstValidId) firstValidId = vidId;

            const itemEl = document.createElement('div');
            itemEl.className = `scroll-card video-card ${index === 0 ? 'active' : ''}`;
            
            // ДОБАВЛЕН ЭКВАЛАЙЗЕР И ИКОНКА PLAY
            itemEl.innerHTML = `
                <div class="sc-thumb is-16-9">
                    <img src="https://img.youtube.com/vi/${vidId}/mqdefault.jpg">
                    <div class="sc-overlay">
                        <i class="fas fa-play play-icon"></i>
                        <div class="equalizer-icon"><span></span><span></span><span></span></div>
                    </div>
                </div>
                <div class="sc-info"><div class="sc-title">${title}</div><div class="sc-status">СМОТРЕТЬ</div></div>
            `;
            
            itemEl.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                document.querySelectorAll('.video-card').forEach(b => b.classList.remove('active'));
                itemEl.classList.add('active');
                this.els.iframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
                
                if (targetItem.status === 'suggested' || rootStatus === 'suggested') {
                    this.els.title.textContent = itemEl.querySelector('.sc-title').textContent;
                }
            });
            this.els.videoPlaylist.appendChild(itemEl);

            if (isString) {
                fetch(`https://noembed.com/embed?url=${url}`).then(r => r.json()).then(d => {
                    if (d.title) {
                        itemEl.querySelector('.sc-title').textContent = d.title;
                        if (itemEl.classList.contains('active') && (targetItem.status === 'suggested' || rootStatus === 'suggested')) {
                            this.els.title.textContent = d.title;
                        }
                    }
                }).catch(() => {});
            }
        });

        if (videos.length <= 1) {
            this.els.videoPlaylist.style.display = 'none';
        } else {
            this.els.videoPlaylist.style.display = 'flex';
        }

        if (firstValidId) {
            this.els.iframe.src = `https://www.youtube.com/embed/${firstValidId}?rel=0&modestbranding=1`;
        }
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { if (this.els.iframe) this.els.iframe.src = ''; }, 300);
    }
}