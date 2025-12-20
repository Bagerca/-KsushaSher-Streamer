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
 * Вызывается один раз при старте приложения
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
 * Поддерживает: youtube.com/watch?v=..., youtu.be/..., embed/...
 */
function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    // ID у YouTube всегда 11 символов
    return (match && match[1].length === 11) ? match[1] : null;
}

/**
 * Открытие модального окна с данными
 * @param {Object} item - Объект данных (игра/фильм)
 * @param {String} type - Тип контента ('games'/'movies')
 */
export function openMediaModal(item, type) {
    if (!overlay) return;

    // 1. ОПРЕДЕЛЕНИЕ ЦВЕТА
    // Приоритет: customColor -> цвет статуса -> белый
    const color = item.customColor || statusColorMap[item.status] || '#fff';
    
    // Устанавливаем CSS переменную для покраски элементов
    document.querySelector('.media-modal-content').style.setProperty('--modal-color', color);

    // 2. ЗАПОЛНЕНИЕ КОНТЕНТА
    
    // Картинка: Если это коллекция (массив images), берем первую (актуальную)
    // Если одиночный элемент - берем image
    const imgSrc = (item.images && item.images.length > 0) ? item.images[0] : item.image;
    els.img.src = imgSrc;

    els.title.textContent = item.title;
    els.desc.textContent = item.description || "Описание отсутствует.";
    
    // Статус
    els.status.textContent = statusTextMap[item.status] || item.status;
    els.status.style.backgroundColor = color;
    els.status.style.boxShadow = `0 0 15px ${color}`;

    // Рейтинг (цифра)
    els.ratingVal.textContent = item.rating;
    els.ratingVal.style.color = color;
    
    // Рейтинг (звезды)
    const fullStars = Math.floor(item.rating);
    let starsHtml = '';
    for(let i=0; i < 5; i++) {
        starsHtml += i < fullStars 
            ? `<i class="fas fa-star" style="color:${color}"></i>` 
            : `<i class="far fa-star" style="opacity:0.3"></i>`;
    }
    els.stars.innerHTML = starsHtml;

    // Жанры (теги)
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
 * Логика плеера и плейлиста
 */
function setupVideoPlayer(videos) {
    // Сброс
    els.playlist.innerHTML = '';
    els.iframe.src = '';

    // Если видео нет в JSON
    if (!videos || videos.length === 0) {
        els.videoSection.style.display = 'none';
        return;
    }

    els.videoSection.style.display = 'block';

    // Функция переключения видео
    const playVideo = (videoId, btn) => {
        // Снимаем активность со всех кнопок
        document.querySelectorAll('.playlist-btn').forEach(b => b.classList.remove('active'));
        // Активируем нажатую
        if(btn) btn.classList.add('active');
        // Загружаем видео (с автоплеем)
        els.iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    };

    let firstValidId = null;

    // Генерируем кнопки плейлиста
    videos.forEach((vid, index) => {
        const vidId = getYouTubeId(vid.url);
        if (!vidId) return; // Пропускаем кривые ссылки

        if (!firstValidId) firstValidId = vidId;

        const btn = document.createElement('div');
        btn.className = 'playlist-btn';
        if (index === 0) btn.classList.add('active'); // Первое видео активно по умолчанию
        
        // Иконка play и название
        btn.innerHTML = `<i class="fas fa-play"></i> ${vid.title || 'Видео ' + (index + 1)}`;
        
        // Клик
        btn.addEventListener('click', () => playVideo(vidId, btn));
        els.playlist.appendChild(btn);
    });

    // Загружаем первое видео в плеер (БЕЗ автоплея при открытии окна, чтобы не пугать звуком)
    if (firstValidId) {
        els.iframe.src = `https://www.youtube.com/embed/${firstValidId}?rel=0`;
    } else {
        // Если все ссылки битые, скрываем секцию
        els.videoSection.style.display = 'none';
    }

    // Если видео всего одно, скрываем плейлист (кнопки), оставляем только плеер
    if (videos.length < 2) {
        els.playlist.style.display = 'none';
    } else {
        els.playlist.style.display = 'flex';
    }
}

/**
 * Закрытие модального окна
 */
function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Разблокируем скролл
    
    // Очищаем iframe, чтобы остановить звук видео
    setTimeout(() => {
        els.iframe.src = '';
    }, 300);
}