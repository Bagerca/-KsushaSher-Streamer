const gamesData = [
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
    },
    {
        id: 'mouthwashing',
        title: 'Mouthwashing',
        rating: 4,
        description: 'Расслабляющий симулятор мойки под давлением. Невероятно затягивающий геймплей, который помогает снять стресс после тяжелого дня.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/50a36d2cac80b1dc1b56246ffab8b073.png',
        genres: ['simulator'],
        status: 'playing',
        customColor: '#ff2d95'
    }
];

const moviesData = [
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
    },
    {
        id: 'spider-verse',
        title: 'Spider-Man: Into the Spider-Verse',
        rating: 5,
        description: 'Инновационный анимационный фильм о множественных вселенных Человека-паука. Визуальный шедевр с захватывающей историей.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images.kinorium.com/movie/poster/2288844/w1500_43025325.jpg',
        genres: ['animation', 'fantasy'],
        status: 'watched',
        customColor: '#39ff14'
    }
];

// ==================== ЗАГРУЗКА ДАННЫХ ====================

// Загрузка статистики
async function loadStats() {
    try {
        const response = await fetch('stats.json');
        const stats = await response.json();
        updateStats(stats);
    } catch (error) {
        console.log('Статистика будет загружена позже');
    }
}

// Загрузка расписания
async function loadSchedule() {
    try {
        const response = await fetch('schedule.json');
        const data = await response.json();
        renderSchedule(data.schedule);
    } catch (error) {
        console.log('Расписание будет загружено позже');
    }
}

// Загрузка игр
async function loadGames() {
    try {
        const response = await fetch('games.json');
        const games = await response.json();
        if (Array.isArray(games) && games.length > 0) {
            renderCards(document.querySelector('#games-content .games-grid'), games, 'game');
        } else {
            renderCards(document.querySelector('#games-content .games-grid'), gamesData, 'game');
        }
    } catch (error) {
        renderCards(document.querySelector('#games-content .games-grid'), gamesData, 'game');
    }
}

// Загрузка фильмов
async function loadMovies() {
    try {
        const response = await fetch('movies.json');
        const movies = await response.json();
        if (Array.isArray(movies) && movies.length > 0) {
            renderCards(document.querySelector('#movies-content .games-grid'), movies, 'movie');
        } else {
            renderCards(document.querySelector('#movies-content .games-grid'), moviesData, 'movie');
        }
    } catch (error) {
        renderCards(document.querySelector('#movies-content .games-grid'), moviesData, 'movie');
    }
}

// ==================== ОБНОВЛЕНИЕ СТАТИСТИКИ ====================

function updateStats(stats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        animateValue(statNumbers[0], 0, stats.followers || 5200, 2000);
        animateValue(statNumbers[1], 0, stats.streams || 150, 2000);
        animateValue(statNumbers[2], 0, stats.hours || 250, 2000);
        animateValue(statNumbers[3], 0, stats.years || 3, 2000);
    }
}

// ==================== РЕНДЕР РАСПИСАНИЯ ====================

function renderSchedule(scheduleData) {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = '';
    
    if (!scheduleData || scheduleData.length === 0) {
        scheduleList.innerHTML = `
            <div class="schedule-item">
                <div class="schedule-content">
                    <div class="schedule-game">Расписание загружается...</div>
                    <div class="schedule-desc">Данные будут доступны скоро</div>
                </div>
            </div>
        `;
        return;
    }
    
    scheduleData.forEach(item => {
        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'schedule-item';
        if (item.highlighted) {
            scheduleItem.classList.add('highlighted');
        }
        
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
    
    highlightCurrentDay();
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

// Mobile menu toggle
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

mobileMenu.addEventListener('click', function(e) {
    e.stopPropagation();
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.addEventListener('click', function(e) {
    if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

document.querySelectorAll('#nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Header scroll behavior
let lastScrollTop = 0;
const header = document.querySelector('header');
const headerHeight = header.offsetHeight;

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > headerHeight) {
        document.body.classList.add('scrolled-down');
        document.body.classList.remove('scrolled-up');
    } else {
        document.body.classList.remove('scrolled-down');
        document.body.classList.add('scrolled-up');
    }
    lastScrollTop = scrollTop;
});

// Simple animation for stats counting
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Activate animation when stats section is in view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            loadStats(); // Загружаем статистику когда секция видна
            const statNumbers = document.querySelectorAll('.stat-number');
            if (statNumbers.length > 0 && statNumbers[0].textContent === '0') {
                // Если цифры еще не загружены, запускаем анимацию
                statNumbers.forEach((el, index) => {
                    const endValue = parseInt(el.getAttribute('data-value') || el.textContent);
                    animateValue(el, 0, endValue, 2000);
                });
            }
            observer.disconnect();
        }
    });
}, { threshold: 0.5 });

// Generate stars for rating
function generateStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
    if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';
    
    return starsHtml;
}

// Словарь для перевода жанров
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

// Render game/movie cards
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
        
        // Устанавливаем кастомный цвет для hover-эффекта
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

// Attach event listeners to game/movie cards
function attachCardListeners(type) {
    const cards = document.querySelectorAll(`[data-${type}]`);
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.getAttribute(`data-${type}`);
            const item = (type === 'game' ? gamesData : moviesData).find(i => i.id === itemId);
            if (item) showModal(item);
        });
    });
}

// Show modal with item details
function showModal(item) {
    const modalGameTitle = document.getElementById('modalGameTitle');
    const modalGameRating = document.getElementById('modalGameRating');
    const modalGameDescription = document.getElementById('modalGameDescription');
    const modalGameVideo = document.getElementById('modalGameVideo');
    const gameModal = document.getElementById('gameModal');
    
    if (!modalGameTitle || !modalGameRating || !modalGameDescription || !modalGameVideo || !gameModal) return;
    
    modalGameTitle.textContent = item.title;
    modalGameRating.innerHTML = `${generateStars(item.rating)}<span>${item.rating}/5</span>`;
    modalGameDescription.textContent = item.description;
    modalGameVideo.src = `https://www.youtube.com/embed/${item.videoId}`;
    gameModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
const closeModal = document.querySelector('.close-modal');
const gameModal = document.getElementById('gameModal');

if (closeModal && gameModal) {
    closeModal.addEventListener('click', () => {
        gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('modalGameVideo').src = '';
    });

    window.addEventListener('click', function(e) {
        if (e.target === gameModal) {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.getElementById('modalGameVideo').src = '';
        }
    });

    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && gameModal.style.display === 'block') {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Copy card number function
function copyCardNumber() {
    const cardNumber = '4276 1805 5058 1960';
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''))
        .then(() => {
            const tooltip = document.getElementById('copy-tooltip');
            if (tooltip) {
                tooltip.textContent = 'Скопировано!';
                setTimeout(() => tooltip.textContent = 'Нажмите чтобы скопировать', 2000);
            }
        })
        .catch(err => console.error('Ошибка при копировании: ', err));
}

const cardNumberElement = document.getElementById('card-number');
if (cardNumberElement) {
    cardNumberElement.addEventListener('click', copyCardNumber);
}

// Games/Movies tabs functionality
const gamesTabs = document.querySelectorAll('.games-tab');
const gamesContent = document.getElementById('games-content');
const moviesContent = document.getElementById('movies-content');
const tabSlider = document.querySelector('.tab-slider');
const filterToggle = document.getElementById('filter-toggle');
const filterDropdown = document.getElementById('filter-dropdown');
const filterOptions = document.querySelectorAll('.filter-option input');
const sortTabs = document.querySelectorAll('.sort-tab');
const sortSlider = document.querySelector('.sort-slider');

// Set initial tab slider position
function setTabSliderPosition(tabElement, sliderElement) {
    if (!tabElement || !sliderElement) return;
    const activeTab = tabElement.querySelector('.active');
    if (activeTab) {
        sliderElement.style.width = `${activeTab.offsetWidth}px`;
        sliderElement.style.left = `${activeTab.offsetLeft}px`;
    }
}

// Separate filters for games and movies
let currentGameFilters = ['all'];
let currentGameStatusFilters = ['status-all'];
let currentMovieFilters = ['all'];
let currentMovieStatusFilters = ['status-all'];
let currentSort = 'name';
let currentTab = 'games';

// Sort and filter games
function sortAndFilterData() {
    let data = currentTab === 'games' ? [...gamesData] : [...moviesData];
    const currentFilters = currentTab === 'games' ? currentGameFilters : currentMovieFilters;
    const currentStatusFilters = currentTab === 'games' ? currentGameStatusFilters : currentMovieStatusFilters;
    
    // Apply status filter
    if (!currentStatusFilters.includes('status-all')) {
        data = data.filter(item => currentStatusFilters.includes(item.status));
    }
    
    // Apply genre filter
    if (!currentFilters.includes('all')) {
        data = data.filter(item => 
            item.genres.some(genre => currentFilters.includes(genre))
        );
    }
    
    // Apply sorting
    if (currentSort === 'name') {
        data.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'rating') {
        data.sort((a, b) => b.rating - a.rating);
    }
    
    // Render filtered and sorted data
    const container = currentTab === 'games' 
        ? document.querySelector('#games-content .games-grid') 
        : document.querySelector('#movies-content .games-grid');
        
    if (container) {
        renderCards(container, data, currentTab === 'games' ? 'game' : 'movie');
    }
}

// Toggle filter dropdown
if (filterToggle && filterDropdown) {
    filterToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        filterDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('active');
        }
    });
}

// Filter option click handler
if (filterOptions.length > 0) {
    filterOptions.forEach(option => {
        option.addEventListener('change', function() {
            const filter = this.getAttribute('data-filter');
            const type = this.getAttribute('data-type');
            
            // Check if it's a status filter
            const isStatusFilter = ['status-all', 'completed', 'playing', 'dropped', 'on-hold', 'watched', 'watching'].includes(filter);
            
            // Update active filters based on type
            if (type === 'games') {
                if (isStatusFilter) {
                    if (filter === 'status-all') {
                        if (this.checked) {
                            currentGameStatusFilters = ['status-all'];
                            document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                                if (opt.getAttribute('data-filter') !== 'status-all' && 
                                    ['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                                    opt.checked = false;
                                }
                            });
                        }
                    } else {
                        if (this.checked) {
                            currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== 'status-all');
                            document.querySelector('.games-filters input[data-filter="status-all"]').checked = false;
                            currentGameStatusFilters.push(filter);
                        }
                    }
                } else {
                    if (filter === 'all') {
                        if (this.checked) {
                            currentGameFilters = ['all'];
                            document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                                if (opt !== this && !['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                                    opt.checked = false;
                                }
                            });
                        }
                    } else {
                        if (this.checked) {
                            currentGameFilters = currentGameFilters.filter(f => f !== 'all');
                            document.querySelector('.games-filters input[data-filter="all"]').checked = false;
                            currentGameFilters.push(filter);
                        }
                    }
                }
            }
            
            sortAndFilterData();
        });
    });
}

// Sort tab click handler with animation
if (sortTabs.length > 0 && sortSlider) {
    sortTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const sort = this.getAttribute('data-sort');
            
            sortTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
            
            const activeContent = document.querySelector('.games-content.active');
            if (activeContent) {
                const activeGrid = activeContent.querySelector('.games-grid');
                activeGrid.classList.add('sorting');
                
                currentSort = sort;
                
                setTimeout(() => {
                    sortAndFilterData();
                    setTimeout(() => {
                        activeGrid.classList.remove('sorting');
                    }, 300);
                }, 300);
            }
        });
    });
}

// Games tabs with animation
if (gamesTabs.length > 0 && tabSlider && gamesContent && moviesContent) {
    gamesTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            gamesTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
            
            const previousContent = document.querySelector('.games-content.active');
            if (previousContent) {
                previousContent.classList.add('fade-out');
            }
            
            currentTab = tab.dataset.tab;
            
            setTimeout(() => {
                if (currentTab === 'movies') {
                    document.querySelector('.games-filters').style.display = 'none';
                    document.querySelector('.movies-filters').style.display = 'block';
                    gamesContent.classList.remove('active');
                    moviesContent.classList.add('fade-in');
                    setTimeout(() => {
                        moviesContent.classList.remove('fade-in');
                        moviesContent.classList.add('active');
                        sortAndFilterData();
                    }, 300);
                } else {
                    document.querySelector('.movies-filters').style.display = 'none';
                    document.querySelector('.games-filters').style.display = 'block';
                    moviesContent.classList.remove('active');
                    gamesContent.classList.add('fade-in');
                    setTimeout(() => {
                        gamesContent.classList.remove('fade-in');
                        gamesContent.classList.add('active');
                        sortAndFilterData();
                    }, 300);
                }
                
                if (previousContent) {
                    previousContent.classList.remove('fade-out');
                    previousContent.classList.remove('active');
                }
            }, 300);
        });
    });
}

// Toggle games grid
const toggleGamesBtn = document.getElementById('toggle-games');
let isExpanded = false;

if (toggleGamesBtn) {
    toggleGamesBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        const activeContent = document.querySelector('.games-content.active');
        if (activeContent) {
            const activeGrid = activeContent.querySelector('.games-grid');
            
            if (isExpanded) {
                activeGrid.style.maxHeight = 'none';
                activeGrid.style.webkitMaskImage = 'none';
                activeGrid.style.maskImage = 'none';
                toggleGamesBtn.textContent = 'Свернуть';
            } else {
                activeGrid.style.maxHeight = '800px';
                activeGrid.style.webkitMaskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
                activeGrid.style.maskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
                toggleGamesBtn.textContent = 'Развернуть';
                
                document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

// Автоматическое выделение текущего дня в расписании
function highlightCurrentDay() {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const today = new Date().getDay();
    
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
        const status = item.querySelector('.schedule-status');
        if (status) {
            status.classList.remove('active');
        }
    });
    
    if (today === 0 || today === 6) return;
    
    const scheduleIndex = today - 1;
    if (scheduleIndex < scheduleItems.length) {
        const currentStatus = scheduleItems[scheduleIndex].querySelector('.schedule-status');
        if (currentStatus) {
            currentStatus.classList.add('active');
        }
    }
}

// Easter egg - history section on image click
const heroImage = document.getElementById('hero-image-click');
let clickCount = 0;
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.querySelector('.close-history-modal');

if (heroImage) {
    heroImage.addEventListener('click', () => {
        clickCount++;
        heroImage.classList.add('clicked');
        
        setTimeout(() => {
            heroImage.classList.remove('clicked');
        }, 300);
        
        if (clickCount >= 14 && historyModal) {
            historyModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            clickCount = 0;
        }
    });
}

if (closeHistoryModal && historyModal) {
    closeHistoryModal.addEventListener('click', () => {
        historyModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    window.addEventListener('click', function(e) {
        if (e.target === historyModal) {
            historyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && historyModal.style.display === 'block') {
            historyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Make sure all external links open in new tab
document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (!link.href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    }
});

// ==================== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ====================

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем все данные
    loadStats();
    loadSchedule();
    loadGames();
    loadMovies();
    
    // Наблюдатель для статистики
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
    
    // Устанавливаем начальные фильтры
    document.querySelectorAll('.filter-option input[data-filter="all"]').forEach(input => {
        input.checked = true;
    });
    document.querySelectorAll('.filter-option input[data-filter="status-all"]').forEach(input => {
        input.checked = true;
    });
    
    // Обновляем слайдеры
    setTimeout(() => {
        setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
        setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
    }, 100);
    
    // Периодическое обновление данных
    setInterval(() => {
        loadStats();
        loadSchedule();
    }, 300000); // Каждые 5 минут
});
