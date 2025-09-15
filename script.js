// ==================== КОД ДЛЯ САЙТА ====================

// Функция для применения данных от бота
function applyDataFromBot(data) {
    try {
        // Обновляем расписание
        if (data.schedule) {
            localStorage.setItem('scheduleData', JSON.stringify(data.schedule));
            updateScheduleOnSite(data.schedule);
        }
        
        // Обновляем игры
        if (data.games) {
            localStorage.setItem('gamesData', JSON.stringify(data.games));
            window.gamesData = data.games;
            renderCards(document.querySelector('#games-content .games-grid'), data.games, 'game');
        }
        
        // Обновляем фильмы
        if (data.movies) {
            localStorage.setItem('moviesData', JSON.stringify(data.movies));
            window.moviesData = data.movies;
            renderCards(document.querySelector('#movies-content .games-grid'), data.movies, 'movie');
        }
        
        console.log('Данные от бота успешно применены!');
        showNotification('Данные обновлены!');
    } catch (error) {
        console.error('Ошибка применения данных:', error);
    }
}

// Функция обновления расписания на сайте
function updateScheduleOnSite(scheduleData) {
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = '';
    
    scheduleData.forEach(item => {
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
    
    highlightCurrentDay();
}

// Функция для получения текущих данных
function getCurrentData() {
    return {
        schedule: JSON.parse(localStorage.getItem('scheduleData') || '[]'),
        games: JSON.parse(localStorage.getItem('gamesData') || '[]'),
        movies: JSON.parse(localStorage.getItem('moviesData') || '[]')
    };
}

// Показ уведомления
function showNotification(message) {
    // Создаем элемент уведомления, если его нет
    let notification = document.getElementById('data-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'data-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background: var(--neon-green);
            color: var(--dark-bg);
            border-radius: 5px;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Инициализация данных при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные из localStorage
    const savedData = getCurrentData();
    
    // Если есть сохраненные данные, применяем их
    if (savedData.schedule.length > 0) {
        updateScheduleOnSite(savedData.schedule);
    }
    
    if (savedData.games.length > 0) {
        window.gamesData = savedData.games;
        renderCards(document.querySelector('#games-content .games-grid'), savedData.games, 'game');
    }
    
    if (savedData.movies.length > 0) {
        window.moviesData = savedData.movies;
        renderCards(document.querySelector('#movies-content .games-grid'), savedData.movies, 'movie');
    }
});
