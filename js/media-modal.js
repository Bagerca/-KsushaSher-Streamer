/* js/media-modal.js */

// Элементы DOM
const overlay = document.getElementById('media-modal-overlay');
const closeBtn = document.querySelector('.modal-close-btn');

// Объект со ссылками на элементы внутри модалки
const els = {
    img: document.getElementById('modal-img'),
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
    'dropped': 'БРОШЕНО', 'on-hold': 'НА ПАУЗЕ'
};

const statusColorMap = {
    'completed': '#39ff14', 'watched': '#39ff14',
    'playing': '#007bff', 'watching': '#007bff',
    'dropped': '#ff4444',
    'on-hold': '#ffd700'
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

    // 1. ОПРЕДЕЛЕНИЕ ЦВЕТА
    const color = item.customColor || statusColorMap[item.status] || '#fff';
    
    // Устанавливаем CSS переменную для покраски элементов
    document.querySelector('.media-modal-content').style.setProperty('--modal-color', color);

    // 2. ЗАПОЛНЕНИЕ КОНТЕНТА
    const imgSrc = (item.images && item.images.length > 0) ? item.images[0] : item.image;
    els.img.src = imgSrc;

    els.title.textContent = item.title;
    els.desc.textContent = item.description || "Описание отсутствует.";
    
    // Статус
    els.status.textContent = statusTextMap[item.status] || item.status;
    els.status.style.backgroundColor = color;
    els.status.style.boxShadow = `0 0 15px ${color}`;

    // Рейтинг
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

    // Жанры
    if (item.genres) {
        els.genres.innerHTML = item.genres.map(g => `<span class="modal-genre-tag">${g}</span>`).join('');
    } else {
        els.genres.innerHTML = '';
    }

    // Техническая инфо
    els.id.textContent = item.id;
    els.type.textContent = type.toUpperCase();

    // 3. НАСТРОЙКА ВИДЕО ПЛЕЕРА
    setupVideoPlayer(item.videos);

    // 4. ПОКАЗАТЬ ОКНО
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
}

/**
 * Логика плеера и плейлиста (YouTube Style)
 */
function setupVideoPlayer(videos) {
    // Сброс контента
    els.playlist.innerHTML = '';
    els.iframe.src = '';
    
    // Сбрасываем классы разметки на контейнере
    els.videoSection.className = 'modal-video-section';

    // Если видео нет -> скрываем секцию
    if (!videos || videos.length === 0) {
        els.videoSection.style.display = 'none';
        return;
    }

    // --- ВАЖНЫЙ ФИКС ---
    // Убираем инлайн-стиль display, чтобы CSS мог применить Grid или Flex в зависимости от @media
    els.videoSection.style.display = ''; 
    els.videoSection.style.removeProperty('display'); 

    // Функция переключения видео
    const playVideo = (videoId, btn) => {
        // Снимаем активность со всех кнопок
        document.querySelectorAll('.playlist-item').forEach(b => b.classList.remove('active'));
        // Активируем нажатую
        if(btn) btn.classList.add('active');
        // Загружаем видео
        els.iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    };

    let firstValidId = null;
    let validCount = 0;

    // Генерируем элементы плейлиста
    videos.forEach((vid, index) => {
        const vidId = getYouTubeId(vid.url);
        if (!vidId) return; // Пропускаем кривые ссылки

        validCount++;
        if (!firstValidId) firstValidId = vidId;

        const item = document.createElement('div');
        item.className = 'playlist-item';
        if (index === 0) item.classList.add('active'); // Первое видео активно
        
        // Получаем превью с YouTube
        const thumbUrl = `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`;

        item.innerHTML = `
            <div class="pl-thumb">
                <img src="${thumbUrl}" alt="preview">
                <div class="pl-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="pl-info">
                <div class="pl-title">${vid.title || 'Видео ' + (index + 1)}</div>
                <div class="pl-status"><i class="fas fa-film"></i> СМОТРЕТЬ</div>
            </div>
        `;
        
        // Клик
        item.addEventListener('click', () => playVideo(vidId, item));
        els.playlist.appendChild(item);
    });

    // УПРАВЛЕНИЕ РАЗМЕТКОЙ (GRID vs COLUMN)
    if (validCount > 1) {
        // Если видео несколько -> Добавляем класс для сетки
        els.videoSection.classList.add('has-playlist');
        els.playlist.style.display = 'flex';
    } else {
        // Если видео одно -> Скрываем плейлист
        els.playlist.style.display = 'none';
    }

    // Загружаем первое видео в плеер (БЕЗ автоплея при открытии)
    if (firstValidId) {
        els.iframe.src = `https://www.youtube.com/embed/${firstValidId}?rel=0&modestbranding=1`;
    } else {
        // Если ни одного валидного ID не нашлось
        els.videoSection.style.display = 'none';
    }
}

/**
 * Закрытие модального окна
 */
function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Разблокируем скролл
    
    // Очищаем iframe, чтобы остановить звук
    setTimeout(() => {
        els.iframe.src = '';
    }, 300);
}