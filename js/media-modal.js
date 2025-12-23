/* js/media-modal.js */

// Элементы DOM
const overlay = document.getElementById('media-modal-overlay');
const closeBtn = document.querySelector('.modal-close-btn');

// Объект со ссылками на элементы внутри модалки
const els = {
    ratingVal: document.getElementById('modal-rating-val'),
    stars: document.getElementById('modal-stars'),
    status: document.getElementById('modal-status'),
    title: document.getElementById('modal-title'),
    genres: document.getElementById('modal-genres'),
    desc: document.getElementById('modal-desc'),
    id: document.getElementById('modal-id'),
    type: document.getElementById('modal-type'),
    
    // Секция видео
    videoSection: document.getElementById('modal-video-section'),
    iframe: document.getElementById('modal-iframe'),
    playlist: document.getElementById('modal-playlist')
};

// Словари для перевода и цветов
const statusTextMap = {
    'completed': 'ЗАВЕРШЕНО', 'watched': 'ПРОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'НА ПАУЗЕ',
    'suggested': 'ПРЕДЛОЖЕНО'
};

const statusColorMap = {
    'completed': '#39ff14', 'watched': '#39ff14',
    'playing': '#007bff', 'watching': '#007bff',
    'dropped': '#ff4444',
    'on-hold': '#ffd700',
    'suggested': '#ff2d95' 
};

/**
 * Инициализация системы модальных окон
 */
export function initModalSystem() {
    if (!overlay) return;

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeModal();
        }
    });
}

/**
 * Получение ID видео из ссылки YouTube
 */
function getYouTubeId(url) {
    if (!url) return null;
    const cleanUrl = (typeof url === 'object') ? url.url : url;
    
    if (!cleanUrl) return null;
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

/**
 * Асинхронное получение названия видео (API Noembed)
 */
async function fetchYoutubeTitle(url) {
    try {
        const response = await fetch(`https://noembed.com/embed?url=${url}`);
        const data = await response.json();
        return data.title || "YouTube Video";
    } catch (e) {
        return "YouTube Video";
    }
}

/**
 * Открытие модального окна
 */
export function openMediaModal(item, type) {
    if (!overlay) return;

    const color = item.customColor || '#fff';
    document.querySelector('.media-modal-content').style.setProperty('--modal-color', color);

    // --- ПОСТЕРЫ ---
    const posterWrapper = document.querySelector('.modal-poster-wrapper');
    posterWrapper.innerHTML = ''; 
    const glow = document.createElement('div');
    glow.className = 'modal-poster-glow';
    posterWrapper.appendChild(glow);

    let imageUrls = [];
    
    if (item.format === 'youtube' && item.videos && item.videos.length > 0) {
        imageUrls = item.videos.slice(0, 3).map(v => {
            const url = (typeof v === 'string') ? v : v.url;
            const vidId = getYouTubeId(url);
            return `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
        });
    } 
    else if (item.images && item.images.length > 0) imageUrls = [...item.images];
    else if (item.image) imageUrls = [item.image];
    else imageUrls = ['https://via.placeholder.com/600x900?text=NO+IMAGE'];

    const imgElements = imageUrls.map((src) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'modal-poster-img'; 
        posterWrapper.appendChild(img);
        return img;
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
        posterWrapper.classList.add('is-interactive');
        posterWrapper.onclick = () => {
            const movingCard = imgElements.shift(); 
            imgElements.push(movingCard);
            updateClasses();
        };
    } else {
        posterWrapper.classList.remove('is-interactive');
        posterWrapper.onclick = null;
    }

    // --- ТЕКСТ ---
    els.title.textContent = item.title;
    els.desc.textContent = item.description || "Описание отсутствует.";
    
    els.status.textContent = statusTextMap[item.status] || item.status;
    const statusColor = statusColorMap[item.status] || '#fff';
    els.status.style.backgroundColor = statusColor;
    els.status.style.boxShadow = `0 0 15px ${statusColor}`;
    
    if (['dropped', 'playing', 'watching'].includes(item.status)) els.status.style.color = '#fff';
    else els.status.style.color = '#000';

    // Рейтинг
    const ratingBox = document.querySelector('.modal-rating-box');
    if (item.status === 'suggested') {
        if (ratingBox) ratingBox.style.display = 'none';
        els.genres.innerHTML = '';
    } else {
        if (ratingBox) ratingBox.style.display = 'flex';
        els.ratingVal.textContent = item.rating;
        els.ratingVal.style.color = color;
        const fullStars = Math.floor(item.rating);
        let starsHtml = '';
        for(let i=0; i < 5; i++) starsHtml += i < fullStars ? `<i class="fas fa-star" style="color:${color}"></i>` : `<i class="far fa-star" style="opacity:0.3"></i>`;
        els.stars.innerHTML = starsHtml;
        els.genres.innerHTML = item.genres ? item.genres.map(g => `<span class="modal-genre-tag">${g}</span>`).join('') : '';
    }

    els.id.textContent = item.id;
    els.type.textContent = type.toUpperCase();

    // 4. НАСТРОЙКА ВИДЕО
    setupVideoPlayer(item);

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

/**
 * Логика плеера (С поддержкой смены заголовка)
 */
function setupVideoPlayer(item) {
    const videos = item.videos;

    els.playlist.innerHTML = '';
    els.iframe.src = '';
    els.videoSection.className = 'modal-video-section';

    if (!videos || videos.length === 0) {
        els.videoSection.style.display = 'none';
        return;
    }

    els.videoSection.style.display = ''; 
    els.videoSection.style.removeProperty('display'); 

    // --- ФУНКЦИЯ ВКЛЮЧЕНИЯ ВИДЕО ---
    // Добавили аргумент titleText
    const playVideo = (videoId, btn, titleText) => {
        document.querySelectorAll('.playlist-item').forEach(b => b.classList.remove('active'));
        if(btn) btn.classList.add('active');
        els.iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

        // ОБНОВЛЕНИЕ ГЛАВНОГО ЗАГОЛОВКА
        // Работает только для Предложки (suggested)
        if (item.status === 'suggested' && titleText) {
            els.title.textContent = titleText;
        }

        // ОБНОВЛЕНИЕ КАРТИНКИ СЛЕВА
        if (item.format === 'youtube' && item.status === 'suggested') {
            const newThumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const currentPosters = document.querySelectorAll('.modal-poster-img');
            currentPosters.forEach(img => {
                img.style.opacity = '0.5'; 
                setTimeout(() => { img.src = newThumbUrl; img.style.opacity = ''; }, 150);
            });
        }
    };

    let firstValidId = null;
    let validCount = 0;

    videos.forEach((vid, index) => {
        const isString = typeof vid === 'string';
        const url = isString ? vid : vid.url;
        let title = (!isString && vid.title) ? vid.title : "Загрузка названия...";

        const vidId = getYouTubeId(url);
        if (!vidId) return;

        validCount++;
        if (!firstValidId) firstValidId = vidId;

        const itemEl = document.createElement('div');
        itemEl.className = 'playlist-item';
        if (index === 0) itemEl.classList.add('active'); 
        
        const thumbUrl = `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`;

        itemEl.innerHTML = `
            <div class="pl-thumb">
                <img src="${thumbUrl}" alt="preview">
                <div class="pl-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="pl-info">
                <div class="pl-title">${title}</div>
                <div class="pl-status"><i class="fas fa-film"></i> СМОТРЕТЬ</div>
            </div>
        `;
        
        // --- КЛИК ПО ПЛЕЙЛИСТУ ---
        itemEl.addEventListener('click', () => {
            // Берем актуальное название прямо из элемента (на случай если оно обновилось асинхронно)
            const currentTitle = itemEl.querySelector('.pl-title').textContent;
            playVideo(vidId, itemEl, currentTitle);
        });
        
        els.playlist.appendChild(itemEl);

        // --- ЗАГРУЗКА НАЗВАНИЙ (API) ---
        if (isString) {
            fetchYoutubeTitle(url).then(fetchedTitle => {
                const titleEl = itemEl.querySelector('.pl-title');
                if (titleEl) {
                    titleEl.textContent = fetchedTitle;
                    titleEl.style.opacity = 0;
                    setTimeout(() => titleEl.style.opacity = 1, 50);
                    
                    // ВАЖНО: Если это видео сейчас активно (например, первое при открытии)
                    // и это предложка — обновляем главный заголовок сразу
                    if (itemEl.classList.contains('active') && item.status === 'suggested') {
                        els.title.textContent = fetchedTitle;
                    }
                }
            });
        } 
        // Если название было сразу (объект), но мы открыли первое видео
        else if (index === 0 && item.status === 'suggested') {
             els.title.textContent = title;
        }
    });

    if (validCount > 0) {
        els.videoSection.classList.add('has-playlist');
        els.playlist.style.display = 'flex'; 
    } else {
        els.playlist.style.display = 'none';
    }

    if (firstValidId) {
        els.iframe.src = `https://www.youtube.com/embed/${firstValidId}?rel=0&modestbranding=1`;
    } else {
        els.videoSection.style.display = 'none';
    }
}

function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { els.iframe.src = ''; }, 300);
}