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
    'suggested': '#ff2d95' // Розовый
};

/**
 * Инициализация системы модальных окон
 */
export function initModalSystem() {
    if (!overlay) return;

    // Закрытие по крестику
    closeBtn.addEventListener('click', closeModal);

    // Закрытие по клику на затемненный фон
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Закрытие по клавише ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeModal();
        }
    });
}

/**
 * Надежное получение ID видео из ссылки YouTube
 */
function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

/**
 * Открытие модального окна с данными
 */
export function openMediaModal(item, type) {
    if (!overlay) return;

    // 1. ОПРЕДЕЛЕНИЕ ЦВЕТА ОКНА
    const color = item.customColor || '#fff';
    document.querySelector('.media-modal-content').style.setProperty('--modal-color', color);

    // 2. ЛОГИКА ПОСТЕРОВ (АНИМИРОВАННАЯ СТОПКА)
    const posterWrapper = document.querySelector('.modal-poster-wrapper');
    posterWrapper.innerHTML = ''; 
    
    // Добавляем красивое свечение назад
    const glow = document.createElement('div');
    glow.className = 'modal-poster-glow';
    posterWrapper.appendChild(glow);

    // Подготовка списка картинок
    let imageUrls = [];
    
    // ПРИОРИТЕТ: Если это YouTube и есть видео, берем превью видео как картинки
    if (item.format === 'youtube' && item.videos && item.videos.length > 0) {
        // Берем первые 3 видео для обложек
        imageUrls = item.videos.slice(0, 3).map(v => {
            const vidId = getYouTubeId(v.url);
            return `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
        });
    } 
    // Иначе берем обычные картинки
    else if (item.images && item.images.length > 0) {
        imageUrls = [...item.images];
    } else if (item.image) {
        imageUrls = [item.image];
    } else {
        imageUrls = ['https://via.placeholder.com/600x900?text=NO+IMAGE'];
    }

    // Создаем DOM-элементы для ВСЕХ картинок один раз
    const imgElements = imageUrls.map((src) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'modal-poster-img'; 
        posterWrapper.appendChild(img);
        return img;
    });

    // Функция обновления классов (запускает анимацию)
    const updateClasses = () => {
        imgElements.forEach((img, index) => {
            img.classList.remove('is-front', 'is-back', 'is-back-2', 'is-hidden');
            
            if (index === 0) {
                img.classList.add('is-front');
                img.style.zIndex = 30;
            } else if (index === 1) {
                img.classList.add('is-back');
                img.style.zIndex = 20;
            } else if (index === 2) {
                img.classList.add('is-back-2');
                img.style.zIndex = 10;
            } else {
                img.classList.add('is-hidden');
                img.style.zIndex = 0;
            }
        });
    };

    updateClasses();

    // ИНТЕРАКТИВ: Если картинок > 1, включаем клик (перелистывание)
    // НО: Если это YouTube, отключаем клик по постеру
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

    // 3. ЗАПОЛНЕНИЕ ТЕКСТОВОГО КОНТЕНТА
    els.title.textContent = item.title;
    els.desc.textContent = item.description || "Описание отсутствует.";
    
    // СТАТУС
    els.status.textContent = statusTextMap[item.status] || item.status;
    const statusColor = statusColorMap[item.status] || '#fff';
    
    els.status.style.backgroundColor = statusColor;
    els.status.style.boxShadow = `0 0 15px ${statusColor}`;
    
    if (['dropped', 'playing', 'watching'].includes(item.status)) {
        els.status.style.color = '#fff';
    } else {
        els.status.style.color = '#000';
    }

    // --- ЛОГИКА РЕЙТИНГА И ЖАНРОВ ---
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
        for(let i=0; i < 5; i++) {
            starsHtml += i < fullStars 
                ? `<i class="fas fa-star" style="color:${color}"></i>` 
                : `<i class="far fa-star" style="opacity:0.3"></i>`;
        }
        els.stars.innerHTML = starsHtml;

        if (item.genres) {
            els.genres.innerHTML = item.genres.map(g => `<span class="modal-genre-tag">${g}</span>`).join('');
        } else {
            els.genres.innerHTML = '';
        }
    }

    // Техническая инфо
    els.id.textContent = item.id;
    els.type.textContent = type.toUpperCase();

    // 4. НАСТРОЙКА ВИДЕО ПЛЕЕРА (Передаем ВЕСЬ ITEM)
    setupVideoPlayer(item);

    // 5. ПОКАЗАТЬ ОКНО
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

/**
 * Логика плеера и плейлиста (YouTube Style)
 * Теперь принимает весь объект item для проверки типа
 */
function setupVideoPlayer(item) {
    const videos = item.videos;

    // Сброс контента
    els.playlist.innerHTML = '';
    els.iframe.src = '';
    
    els.videoSection.className = 'modal-video-section';

    if (!videos || videos.length === 0) {
        els.videoSection.style.display = 'none';
        return;
    }

    els.videoSection.style.display = ''; 
    els.videoSection.style.removeProperty('display'); 

    // Функция переключения видео
    const playVideo = (videoId, btn) => {
        // 1. Снимаем активность
        document.querySelectorAll('.playlist-item').forEach(b => b.classList.remove('active'));
        
        // 2. Активируем нажатую
        if(btn) btn.classList.add('active');
        
        // 3. Загружаем видео
        els.iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

        // 4. --- ОБНОВЛЕНИЕ ОБЛОЖКИ (СЛЕВА) ---
        // Срабатывает ТОЛЬКО для YouTube Предложки
        if (item.format === 'youtube' && item.status === 'suggested') {
            const newThumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const currentPosters = document.querySelectorAll('.modal-poster-img');
            
            currentPosters.forEach(img => {
                img.style.opacity = '0.5'; 
                setTimeout(() => {
                    img.src = newThumbUrl;
                    img.style.opacity = ''; 
                }, 150);
            });
        }
    };

    let firstValidId = null;
    let validCount = 0;

    // Генерируем элементы плейлиста
    videos.forEach((vid, index) => {
        const vidId = getYouTubeId(vid.url);
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
                <div class="pl-title">${vid.title || 'Видео ' + (index + 1)}</div>
                <div class="pl-status"><i class="fas fa-film"></i> СМОТРЕТЬ</div>
            </div>
        `;
        
        itemEl.addEventListener('click', () => playVideo(vidId, itemEl));
        els.playlist.appendChild(itemEl);
    });

    // УПРАВЛЕНИЕ РАЗМЕТКОЙ
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

/**
 * Закрытие модального окна
 */
function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        els.iframe.src = '';
    }, 300);
}