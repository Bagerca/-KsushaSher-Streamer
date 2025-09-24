// Rendering functions for different components
import { generateStars, showModal } from './ui.js';

// Genre translations
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
    'crossover': 'Кроссовер',
    'rpg': 'RPG',
    'family': 'Семейный'
};

// Render schedule
export function renderSchedule(scheduleData) {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = '';
    
    if (!scheduleData || scheduleData.length === 0) {
        scheduleList.innerHTML = `
            <div class="schedule-item">
                <div class="schedule-content">
                    <div class="schedule-game">📅 Расписание загружается...</div>
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

// Render game/movie cards
export function renderCards(container, data, type) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                ${type === 'game' ? '🎮 Игр пока нет' : '🎬 Фильмов пока нет'}
            </div>
        `;
        return;
    }
    
    data.forEach(item => {
        const card = createCard(item, type);
        container.appendChild(card);
    });
    
    attachCardListeners(type, data);
}

// Create individual card
function createCard(item, type) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute(`data-${type}`, item.id);
    
    // Set status class
    if (type === 'game') {
        card.classList.add(item.status);
    } else {
        if (item.status === 'watched') card.classList.add('watched');
        else if (item.status === 'watching') card.classList.add('watching');
        else card.classList.add(item.status);
    }
    
    // Set custom hover color
    card.style.setProperty('--custom-hover-color', item.customColor || '#39ff14');
    
    const imageHtml = `<div class="game-image-container"><img src="${item.image}" alt="${item.title}" class="game-image" loading="lazy"></div>`;
    const starsHtml = generateStars(item.rating);
    const genresHtml = renderGenres(item.genres);
    
    card.innerHTML = `
        ${imageHtml}
        <div class="game-info">
            <h3 class="game-title">${item.title}</h3>
            <div class="game-genres">${genresHtml}</div>
            <div class="game-rating">${starsHtml}<span>${item.rating}/5</span></div>
            <p class="game-description">${item.description}</p>
        </div>
    `;
    
    return card;
}

// Render genres as tags
function renderGenres(genres) {
    return genres.map(genre => 
        `<span class="game-genre">${genreTranslations[genre] || genre}</span>`
    ).join('');
}

// Attach event listeners to cards
function attachCardListeners(type, data) {
    const cards = document.querySelectorAll(`[data-${type}]`);
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.getAttribute(`data-${type}`);
            const item = data.find(i => i.id === itemId);
            if (item) showModal(item);
        });
        
        // Add hover effect for images
        const image = card.querySelector('.game-image');
        if (image) {
            card.addEventListener('mouseenter', () => {
                image.style.transform = 'scale(1.05)';
            });
            
            card.addEventListener('mouseleave', () => {
                image.style.transform = 'scale(1)';
            });
        }
    });
}

// Highlight current day in schedule
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
    
    // Don't highlight weekends
    if (today === 0 || today === 6) return;
    
    const scheduleIndex = today - 1;
    if (scheduleIndex < scheduleItems.length) {
        const currentStatus = scheduleItems[scheduleIndex].querySelector('.schedule-status');
        if (currentStatus) {
            currentStatus.classList.add('active');
        }
    }
}

// Toggle games grid expansion
export function initGridToggle() {
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
                    
                    // Scroll back to games section
                    document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
}
