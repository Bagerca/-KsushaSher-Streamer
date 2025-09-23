// ==================== КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ ====================
const CONFIG = {
    apiUrls: {
        games: 'games.json',
        movies: 'movies.json', 
        schedule: 'schedule.json',
        stats: 'stats.json'
    },
    selectors: {
        gamesGrid: '.games-grid',
        gamesContent: '.games-content',
        modal: '#gameModal'
    },
    genres: {
        games: ['puzzle', 'adventure', 'simulator', 'horror', 'coop', 'shooter', 'platformer'],
        movies: ['animation', 'fantasy', 'crossover']
    },
    statusColors: {
        completed: '#39ff14', playing: '#ff2d95', dropped: '#ff6464', 'on-hold': '#ffd700',
        watched: '#39ff14', watching: '#ff2d95'
    }
};

// Состояние приложения
const state = {
    currentTab: 'games',
    currentSort: 'name',
    gamesData: [],
    moviesData: [],
    filters: { games: ['all'], movies: ['all'] },
    isGamesExpanded: false
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    initMobileMenu();
    initSmoothScroll();
    initOrbitalSystem();
    initModal();
    initCopyCard();
    
    await loadAllData();
    setupEventListeners();
    setupIntersectionObserver();
}

// ==================== ОСНОВНЫЕ ИНИЦИАЛИЗАЦИИ ====================
function initMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    
    if (!mobileMenu || !navMenu) return;
    
    mobileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenu.contains(e.target)) {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initOrbitalSystem() {
    const avatars = document.querySelectorAll('.orbital-avatar');
    const tooltip = document.getElementById('avatarTooltip');
    
    if (!avatars.length || !tooltip) return;
    
    avatars.forEach(avatar => {
        avatar.addEventListener('mouseenter', (e) => {
            const name = avatar.getAttribute('data-name');
            const role = avatar.getAttribute('data-role');
            tooltip.innerHTML = `<strong>${name}</strong><br>${role}`;
            tooltip.classList.add('show');
        });
        
        avatar.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    });
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadAllData() {
    try {
        await Promise.all([
            loadStats(),
            loadSchedule(),
            loadContent('games'),
            loadContent('movies')
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadStats() {
    try {
        const stats = await fetchData(CONFIG.apiUrls.stats);
        if (stats) updateStats(stats);
    } catch (error) {
        console.log('Stats will load later');
    }
}

async function loadSchedule() {
    try {
        const data = await fetchData(CONFIG.apiUrls.schedule);
        if (data && data.schedule) renderSchedule(data.schedule);
    } catch (error) {
        console.log('Schedule will load later');
    }
}

async function loadContent(type) {
    const container = document.querySelector(`#${type}-content ${CONFIG.selectors.gamesGrid}`);
    if (!container) return;
    
    container.innerHTML = '<div class="loading-state">🔄 Загрузка...</div>';
    
    try {
        const data = await fetchData(CONFIG.apiUrls[type]);
        state[`${type}Data`] = Array.isArray(data) ? data : [];
        
        if (state[`${type}Data`].length > 0) {
            renderContent(type, state[`${type}Data`]);
        } else {
            container.innerHTML = `<div class="empty-state">${type === 'games' ? '🎮' : '🎬'} ${type === 'games' ? 'Игр' : 'Фильмов'} пока нет</div>`;
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-state">❌ Ошибка загрузки</div>';
    }
}

async function fetchData(url) {
    const response = await fetch(`${url}?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

// ==================== РЕНДЕРИНГ ====================
function updateStats(stats) {
    const statElements = document.querySelectorAll('.stat-number');
    const values = [stats.followers || 5200, stats.streams || 150, stats.hours || 250, stats.years || 3];
    
    statElements.forEach((el, index) => {
        animateCounter(el, 0, values[index], 2000);
    });
}

function renderSchedule(scheduleData) {
    const container = document.getElementById('schedule-list');
    if (!container) return;
    
    if (!scheduleData || scheduleData.length === 0) {
        container.innerHTML = `
            <div class="schedule-item">
                <div class="schedule-content">
                    <div class="schedule-game">📅 Расписание загружается...</div>
                    <div class="schedule-desc">Данные будут доступны скоро</div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = scheduleData.map(item => `
        <div class="schedule-item ${item.highlighted ? 'highlighted' : ''}">
            <div class="schedule-day-wrapper">
                <div class="schedule-day">${item.day}</div>
                <div class="schedule-time">${item.time}</div>
            </div>
            <div class="schedule-content">
                <div class="schedule-game">${item.game}</div>
                <div class="schedule-desc">${item.description}</div>
            </div>
            <div class="schedule-status"></div>
        </div>
    `).join('');
    
    highlightCurrentDay();
}

function renderContent(type, data) {
    const container = document.querySelector(`#${type}-content ${CONFIG.selectors.gamesGrid}`);
    if (!container) return;
    
    container.innerHTML = data.map(item => createCard(item, type)).join('');
    attachCardListeners(type);
}

function createCard(item, type) {
    const isGame = type === 'games';
    const statusText = isGame ? 
        { completed: 'Пройдено', playing: 'Проходим', dropped: 'Брошено', 'on-hold': 'Под вопросом' }[item.status] :
        { watched: 'Посмотрено', watching: 'Смотрим', dropped: 'Бросили', 'on-hold': 'Под вопросом' }[item.status];
    
    return `
        <div class="game-card ${item.status}" data-id="${item.id}" data-type="${type}" style="--custom-hover-color: ${item.customColor || CONFIG.statusColors[item.status]}">
            <div class="game-image-container">
                <img src="${item.image}" alt="${item.title}" class="game-image" loading="lazy">
            </div>
            <div class="game-info">
                <h3 class="game-title">${item.title}</h3>
                <div class="game-genres">${item.genres.map(genre => `<span class="game-genre">${genre}</span>`).join('')}</div>
                <div class="game-rating">${generateStars(item.rating)}<span>${item.rating}/5</span></div>
                <p class="game-description">${item.description}</p>
                <div class="game-status">${statusText}</div>
            </div>
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '<i class="fas fa-star"></i>'.repeat(fullStars) +
           (hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : '') +
           '<i class="far fa-star"></i>'.repeat(emptyStars);
}

// ==================== ИНТЕРАКТИВНОСТЬ ====================
function setupEventListeners() {
    // Табы игр/фильмов
    document.querySelectorAll('.games-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Кнопка развернуть/свернуть
    const toggleBtn = document.getElementById('toggle-games');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleGamesView);
    }
    
    // Фильтры и сортировка (упрощенная версия)
    setupFilters();
}

function switchTab(tab) {
    if (state.currentTab === tab) return;
    
    state.currentTab = tab;
    
    // Обновляем активные табы
    document.querySelectorAll('.games-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.games-tab[data-tab="${tab}"]`).classList.add('active');
    
    // Переключаем контент
    document.querySelectorAll('.games-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tab}-content`).classList.add('active');
    
    // Если данные еще не загружены, загружаем
    if (state[`${tab}Data`].length === 0) {
        loadContent(tab);
    }
}

function toggleGamesView() {
    const toggleBtn = document.getElementById('toggle-games');
    const activeGrid = document.querySelector('.games-content.active .games-grid');
    
    if (!toggleBtn || !activeGrid) return;
    
    state.isGamesExpanded = !state.isGamesExpanded;
    
    if (state.isGamesExpanded) {
        activeGrid.style.maxHeight = 'none';
        activeGrid.style.webkitMaskImage = 'none';
        activeGrid.style.maskImage = 'none';
        toggleBtn.textContent = 'Свернуть';
    } else {
        activeGrid.style.maxHeight = '800px';
        activeGrid.style.webkitMaskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
        activeGrid.style.maskImage = 'linear-gradient(to bottom, black 85%, transparent 98%)';
        toggleBtn.textContent = 'Развернуть';
    }
}

function setupFilters() {
    // Упрощенная система фильтров - можно расширить при необходимости
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');
    
    if (filterToggle && filterDropdown) {
        filterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', () => {
            filterDropdown.classList.remove('active');
        });
    }
}

function attachCardListeners(type) {
    const cards = document.querySelectorAll(`[data-type="${type}"]`);
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.getAttribute('data-id');
            const item = state[`${type}Data`].find(i => i.id === itemId);
            if (item) showModal(item);
        });
    });
}

// ==================== МОДАЛЬНОЕ ОКНО ====================
function initModal() {
    const modal = document.getElementById('gameModal');
    const closeBtn = document.querySelector('.close-modal');
    
    if (!modal || !closeBtn) return;
    
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

function showModal(item) {
    const modal = document.getElementById('gameModal');
    const title = document.getElementById('modalGameTitle');
    const rating = document.getElementById('modalGameRating');
    const description = document.getElementById('modalGameDescription');
    const video = document.getElementById('modalGameVideo');
    
    if (!modal || !title || !rating || !description || !video) return;
    
    title.textContent = item.title;
    rating.innerHTML = `${generateStars(item.rating)}<span>${item.rating}/5</span>`;
    description.textContent = item.description;
    video.src = `https://www.youtube.com/embed/${item.videoId}`;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('gameModal');
    const video = document.getElementById('modalGameVideo');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    if (video) {
        video.src = '';
    }
}

// ==================== УТИЛИТЫ ====================
function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function highlightCurrentDay() {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const today = new Date().getDay();
    
    if (today === 0 || today === 6) return; // Выходные
    
    const scheduleItems = document.querySelectorAll('.schedule-item');
    const scheduleIndex = today - 1;
    
    if (scheduleIndex < scheduleItems.length) {
        const currentStatus = scheduleItems[scheduleIndex].querySelector('.schedule-status');
        if (currentStatus) {
            currentStatus.classList.add('active');
        }
    }
}

function initCopyCard() {
    const cardElement = document.getElementById('card-number');
    if (!cardElement) return;
    
    cardElement.addEventListener('click', () => {
        const cardNumber = '4276180550581960';
        navigator.clipboard.writeText(cardNumber).then(() => {
            const tooltip = document.getElementById('copy-tooltip');
            if (tooltip) {
                tooltip.textContent = 'Скопировано!';
                setTimeout(() => tooltip.textContent = 'Нажмите чтобы скопировать', 2000);
            }
        }).catch(err => console.error('Copy error:', err));
    });
}

function setupIntersectionObserver() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadStats();
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(statsSection);
}

// ==================== Easter Egg ====================
(function initEasterEgg() {
    const heroImage = document.getElementById('hero-image-click');
    let clickCount = 0;
    
    if (!heroImage) return;
    
    heroImage.addEventListener('click', () => {
        clickCount++;
        heroImage.classList.add('clicked');
        setTimeout(() => heroImage.classList.remove('clicked'), 300);
        
        if (clickCount >= 5) { // Упростил с 14 до 5 для тестирования
            showHistoryModal();
            clickCount = 0;
        }
    });
})();

function showHistoryModal() {
    // Упрощенная версия модального окна истории
    console.log('Easter egg activated! History modal would show here.');
}

// ==================== ОБРАБОТКА ОШИБОК ====================
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
