// Глобальные переменные для данных
let gamesData = [];
let moviesData = [];
let scheduleData = [];

// Загрузка данных с сервера
async function loadData() {
    try {
        const [gamesResponse, moviesResponse, scheduleResponse] = await Promise.all([
            fetch('games.json'),
            fetch('movies.json'), 
            fetch('schedule.json')
        ]);
        
        if (gamesResponse.ok) gamesData = await gamesResponse.json();
        if (moviesResponse.ok) moviesData = await moviesResponse.json();
        if (scheduleResponse.ok) scheduleData = await scheduleResponse.json();
        
        initPage();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Fallback к старым данным если файлы не найдены
        await loadFallbackData();
    }
}

// Функция-запас на случай если файлы еще не созданы
async function loadFallbackData() {
    try {
        // Временные данные для инициализации
        gamesData = [
            {
                id: 'portal2',
                title: 'Portal 2',
                rating: 5,
                description: 'Культовая головоломка от Valve с уникальным геймплеем и юмором. Одна из лучших игр в своём жанре с захватывающим сюжетом и запоминающимися персонажами.',
                videoId: 'dQw4w9WgXcQ',
                image: 'https://cdn2.steamgriddb.com/grid/24be7c4485d63a3d70e038692172adce.png',
                genres: ['puzzle', 'adventure'],
                status: 'completed',
                customColor: '#39ff14'
            }
        ];
        
        moviesData = [
            {
                id: 'arcane',
                title: 'Arcane',
                rating: 5,
                description: 'Визуально потрясающий анимационный сериал по вселенной League of Legends. Глубокий сюжет о сестрах Вай и Пайлтовере.',
                videoId: 'dQw4w9WgXcQ',
                image: 'https://images-s.kinorium.com/movie/poster/2754301/w1500_50222111.jpg',
                genres: ['animation', 'fantasy'],
                status: 'watched',
                customColor: '#39ff14'
            }
        ];
        
        scheduleData = {
            schedule: [
                {
                    day: "Понедельник",
                    time: "16:00 - 19:00+",
                    game: "Dead Island 2", 
                    description: "Режем зомби в солнечном Калифорнийском аду"
                }
            ]
        };
        
        initPage();
    } catch (error) {
        console.error('Ошибка fallback данных:', error);
    }
}

// Инициализация страницы
function initPage() {
    renderSchedule();
    renderCards(document.querySelector('#games-content .games-grid'), gamesData, 'game');
    renderCards(document.querySelector('#movies-content .games-grid'), moviesData, 'movie');
    highlightCurrentDay();
    setupEventListeners();
}

// Рендер расписания из JSON
function renderSchedule() {
    if (!scheduleData.schedule) return;
    
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = '';
    
    scheduleData.schedule.forEach(item => {
        const scheduleItem = document.createElement('div');
        scheduleItem.className = `schedule-item ${item.highlighted ? 'highlighted' : ''}`;
        
        scheduleItem.innerHTML = `
            <div class="schedule-day-wrapper">
                <div class="schedule-day">${item.day}</div>
                <div class="schedule-time">${item.time}</div>
            </div>
            <div class="schedule-content">
                <div class="schedule-game">${item.game}</div>
                <div class="schedule-desc">${item.description}</div>
            </div>
            <div class="schedule-status"></div>
        `;
        
        scheduleList.appendChild(scheduleItem);
    });
}

// Остальные функции остаются практически без изменений, но используют gamesData и moviesData
function renderCards(container, data, type) {
    if (!container) return;
    
    container.innerHTML = '';
    
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute(`data-${type}`, item.id);
        
        // Добавляем класс статуса для цветной рамки
        if (type === 'game') {
            card.classList.add(item.status);
        } else {
            if (item.status === 'watched') card.classList.add('watched');
            else if (item.status === 'watching') card.classList.add('watching');
            else card.classList.add(item.status);
        }
        
        card.style.setProperty('--custom-hover-color', item.customColor || '#39ff14');
        
        const imageHtml = `<div class="game-image-container"><img src="${item.image}" alt="${item.title}" class="game-image"></div>`;
        const starsHtml = generateStars(item.rating);
        const genresHtml = item.genres.map(genre => `<span class="game-genre">${genreTranslations[genre] || genre}</span>`).join('');
        
        card.innerHTML = `
            ${imageHtml}
            <div class="game-info">
                <h3 class="game-title">${item.title}</h3>
                <div class="game-genres">${genresHtml}</div>
                <div class="game-rating">${starsHtml}<span>${item.rating}/5</span></div>
                <p class="game-description">${item.description}</p>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    attachCardListeners(type);
}

// Словарь для перевода жанров (оставляем как было)
const genreTranslations = {
    'puzzle': 'Головоломка',
    'adventure': 'Приключения',
    'simulator': 'Симулятор',
    'horror': 'Хоррор',
    'coop': 'Кооператив',
    'sandbox': 'Песочница',
    'metroidvania': 'Метроидвания',
    'fps': 'Шутер',
    'shooter': 'Шутер',
    'platformer': 'Платформер',
    'animation': 'Анимация',
    'fantasy': 'Фэнтези',
    'crossover': 'Кроссовер'
};

// Остальные функции (generateStars, attachCardListeners, showModal и т.д.) 
// остаются без изменений, просто убери старые массивы gamesData и moviesData

// Mobile menu toggle (оставляем без изменений)
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

mobileMenu.addEventListener('click', function(e) {
    e.stopPropagation();
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// ... все остальные функции из оригинального script.js остаются без изменений ...

// В конце заменяем инициализацию
document.addEventListener('DOMContentLoaded', function() {
    loadData(); // Заменяем прямую инициализацию на загрузку данных
    
    // Остальная инициализация
    setTimeout(() => {
        setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
        setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
    }, 100);
    
    setInterval(highlightCurrentDay, 3600000);
});
