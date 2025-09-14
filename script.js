const gamesData = [
    {
        id: 'portal2',
        title: 'Portal 2',
        rating: 5,
        description: 'Культовая головоломка от Valve с уникальным геймплеем и юмором. Одна из лучших игр в своём жанре с захватывающим сюжетом и запоминающимися персонажами.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/24be7c4485d63a3d70e038692172adce.png',
        genres: ['puzzle', 'adventure'],
        status: 'completed'
    },
    {
        id: 'mouthwashing',
        title: 'Mouthwashing',
        rating: 4,
        description: 'Расслабляющий симулятор мойки под давлением. Невероятно затягивающий геймплей, который помогает снять стресс после тяжелого дня.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/50a36d2cac80b1dc1b56246ffab8b073.png',
        genres: ['simulator'],
        status: 'abandoned'
    },
    {
        id: 'minecraft',
        title: 'Minecraft',
        rating: 5,
        description: 'Легендарная песочница с безграничными возможностями для творчества. Игра, в которую можно играть бесконечно, каждый раз открывая что-то новое.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/53344d4d9596276b9b7f70158bf95779.webp',
        genres: ['adventure', 'sandbox'],
        status: 'in-progress'
    },
    {
        id: 'lethal-company',
        title: 'Lethal Company',
        rating: 4,
        description: 'Кооперативный хоррор про сбор лома на опасных планетах. Веселая и страшная игра для прохождения с друзьями.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/fd729ccc51bbb0d182ac464d2f34e4f2.webp',
        genres: ['horror', 'coop'],
        status: 'completed'
    },
    {
        id: 'hollow-knight',
        title: 'Hollow Knight',
        rating: 5,
        description: 'Изумительный метроидвания с красивым миром и сложными боями. Одна из лучших инди-игр всех времен с глубоким лором и атмосферой.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/2cffdc4195ce6adf0a57062e4318662e.webp',
        genres: ['adventure', 'metroidvania'],
        status: 'completed'
    },
    {
        id: 'content-warning',
        title: 'Content Warning',
        rating: 3.5,
        description: 'Страшные приключения с друзьями в поисках вирального контента. Веселая кооперативная игра с элементами хоррора.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/ec6fbf0d38ffc435686348723a08c839.png',
        genres: ['horror', 'coop'],
        status: 'abandoned'
    },
    {
        id: 'cs2',
        title: 'CS2',
        rating: 4,
        description: 'Легендарный тактический шутер с безупречным геймплеем. Competitive игра, в которой каждый матч уникален и непредсказуем.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/0662aa1719017e0efa5fa8daf0880c6e.png',
        genres: ['shooter', 'fps'],
        status: 'in-progress'
    },
    {
        id: 'sally-face',
        title: 'Sally Face',
        rating: 4.5,
        description: 'Мрачная приключенческая игра с уникальным стилью и сюжетом. Захватывающая история с неожиданными поворотами и тайнами.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/9e729118dec145b90ce23e1f973a29b2.png',
        genres: ['adventure', 'horror'],
        status: 'completed'
    },
    {
        id: 'gris',
        title: 'Gris',
        rating: 5,
        description: 'Визуально потрясающая платформер-притча о преодолении горя. Невероятно красивая и эмоциональная игра с минималистичным геймплеем.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/28c3c3e591be4d57567ec7830f7b3b46.webp',
        genres: ['adventure', 'platformer'],
        status: 'completed'
    },
    {
        id: 'batim',
        title: 'Bendy and the Ink Machine',
        rating: 4,
        description: 'Уникальный хоррор в стиле старых мультфильмов с атмосферной историей и запоминающимися персонажами.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/ce4a1312b1f8175eb808eb101eccce0c.png',
        genres: ['horror', 'adventure'],
        status: 'completed'
    },
    {
        id: 'batdr',
        title: 'Bendy and the Dark Revival',
        rating: 4.5,
        description: 'Продолжение культового хоррора с улучшенной графикой, новыми механиками и захватывающим сюжетом.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/b882ca7b76297dd7e2ad9d0d464a10fd.png',
        genres: ['horror', 'adventure'],
        status: 'completed'
    },
    // Новые игры
    {
        id: 'buckshot-roulette',
        title: 'Buckshot Roulette',
        rating: 4.5,
        description: 'Напряженная игра в русскую рулетку с дробовиком.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/4b7dc6c4ae6d2e6a6d5c8b5a5d5c8b5a.png',
        genres: ['horror', 'thriller'],
        status: 'completed'
    },
    {
        id: 'helltaker',
        title: 'Helltaker',
        rating: 4,
        description: 'Головоломка про демонов и пацанский дух.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/5d8e4e7c5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['puzzle', 'adventure'],
        status: 'completed'
    },
    {
        id: 'the-forest',
        title: 'The Forest',
        rating: 4.5,
        description: 'Выживание на острове с каннибалами.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/6c8d5e5e5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['horror', 'survival'],
        status: 'in-progress'
    },
    {
        id: 'outlast',
        title: 'Outlast',
        rating: 4.5,
        description: 'Ужасы в психиатрической больнице.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/7d8e5e5e5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['horror', 'survival'],
        status: 'completed'
    },
    {
        id: 'little-nightmares',
        title: 'Little Nightmares',
        rating: 4.5,
        description: 'Мрачная головоломка в стиле хоррор.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/8e9e5e5e5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['horror', 'puzzle'],
        status: 'completed'
    },
    {
        id: 'little-nightmares-2',
        title: 'Little Nightmares 2',
        rating: 4.5,
        description: 'Продолжение мрачной головоломки в стиле хоррор.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/9f0f5e5e5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['horror', 'puzzle'],
        status: 'completed'
    },
    {
        id: 'creepy-tale',
        title: 'Creepy Tale',
        rating: 3.5,
        description: 'Мрачная приключенческая игра в сказочном мире.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/a0a1e5e5e5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['adventure', 'puzzle'],
        status: 'abandoned'
    },
    {
        id: 'creepy-tale-2',
        title: 'Creepy Tale 2',
        rating: 3.5,
        description: 'Продолжение мрачной приключенческой игры в сказочном мира.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/b1b2e5e5e5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['adventure', 'puzzle'],
        status: 'abandoned'
    },
    {
        id: 'framed',
        title: 'Framed',
        rating: 4,
        description: 'Детективная головоломка с уникальным геймплеем.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/c2c3e5e5e5e5c5e5c5e5c5e5c5e5c5e5c.png',
        genres: ['puzzle', 'adventure'],
        status: 'completed'
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
        status: 'completed'
    },
    {
        id: 'indie-cross',
        title: 'Indie Cross',
        rating: 4,
        description: 'Кроссовер независимых игр с уникальным стилем и захватывающим сюжетом. Удивительное сочетание разных вселенных и персонажей.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://i.redd.it/hskopjmudyxe1.png',
        genres: ['animation', 'crossover'],
        status: 'completed'
    },
    // Новые фильмы
    {
        id: 'the-wild-robot',
        title: 'The Wild Robot',
        rating: 4.5,
        description: 'История робота, оказавшегося на необитаемом острове.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/2854301/w1500_50222112.jpg',
        genres: ['animation', 'adventure'],
        status: 'completed'
    },
    {
        id: 'nine',
        title: 'Nine',
        rating: 4,
        description: 'Постапокалиптическая анимация о куклах-воинах.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/2954301/w1500_50222113.jpg',
        genres: ['animation', 'fantasy'],
        status: 'completed'
    },
    {
        id: 'heroes-of-envell',
        title: 'Heroes of Envell',
        rating: 3.5,
        description: 'Приключения героев в фэнтезийном мире.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/3054301/w1500_50222114.jpg',
        genres: ['animation', 'fantasy'],
        status: 'completed'
    },
    {
        id: 'gravity-falls',
        title: 'Gravity Falls',
        rating: 5,
        description: 'Культовый мультсериал о таинственных приключениях близнецов.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/3154301/w1500_50222115.jpg',
        genres: ['animation', 'adventure'],
        status: 'completed'
    },
    {
        id: 'garfield',
        title: 'Garfield',
        rating: 3.5,
        description: 'Приключения ленивого кота Гарфилда.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/3254301/w1500_50222116.jpg',
        genres: ['animation', 'comedy'],
        status: 'completed'
    },
    {
        id: 'garfield-2',
        title: 'Garfield 2',
        rating: 3.5,
        description: 'Продолжение приключений ленивого кота Гарфилда.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/3354301/w1500_50222117.jpg',
        genres: ['animation', 'comedy'],
        status: 'completed'
    },
    {
        id: 'ice-age',
        title: 'Ice Age',
        rating: 4,
        description: 'Приключения животных во времена ледникового периода.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/3454301/w1500_50222118.jpg',
        genres: ['animation', 'adventure'],
        status: 'completed'
    },
    {
        id: 'shrek',
        title: 'Shrek',
        rating: 5,
        description: 'Культовая история о зеленом огре и его приключениях.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images-s.kinorium.com/movie/poster/3554301/w1500_50222119.jpg',
        genres: ['animation', 'fantasy'],
        status: 'completed'
    }
];

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
            const statNumbers = document.querySelectorAll('.stat-number');
            statNumbers.forEach((el, index) => {
                const endValue = parseInt(el.textContent);
                animateValue(el, 0, endValue, 2000);
            });
            observer.disconnect();
        }
    });
}, { threshold: 0.5 });

observer.observe(document.getElementById('stats'));

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
    'crossover': 'Кроссовер',
    'thriller': 'Триллер',
    'survival': 'Выживание',
    'comedy': 'Комедия'
};

// Функция для получения текста статуса
function getStatusText(status) {
    const statusMap = {
        'completed': 'Пройдено',
        'abandoned': 'Брошено', 
        'in-progress': 'Проходим',
        'questionable': 'Под вопросом'
    };
    return statusMap[status] || '';
}

// Render game/movie cards
function renderCards(container, data, type) {
    container.innerHTML = '';
    
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute(`data-${type}`, item.id);
        
        const statusClass = `status-${item.status || 'unknown'}`;
        const statusText = getStatusText(item.status);
        
        const imageHtml = `<div class="game-image-container"><img src="${item.image}" alt="${item.title}" class="game-image"></div>`;
        
        const starsHtml = generateStars(item.rating);
        const genresHtml = item.genres.map(genre => `<span class="game-genre">${genreTranslations[genre] || genre}</span>`).join('');
        
        card.innerHTML = `
            ${imageHtml}
            <div class="game-info">
                <h3 class="game-title">${item.title}</h3>
                <div class="game-rating">${starsHtml}<span>${item.rating}/5</span></div>
                <div class="game-tags">
                    <span class="game-status ${statusClass}">${statusText}</span>
                    ${genresHtml}
                </div>
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
    const modalGameImage = document.getElementById('modalGameImage');
    const modalGameTags = document.getElementById('modalGameTags');
    const gameModal = document.getElementById('gameModal');
    
    modalGameTitle.textContent = item.title;
    modalGameRating.innerHTML = `${generateStars(item.rating)}<span>${item.rating}/5</span>`;
    modalGameDescription.textContent = item.description;
    modalGameVideo.src = `https://www.youtube.com/embed/${item.videoId}`;
    modalGameImage.src = item.image;
    
    // Добавим статус и жанры в модальное окно
    const statusClass = `status-${item.status || 'unknown'}`;
    const statusText = getStatusText(item.status);
    const genresHtml = item.genres.map(genre => `<span class="game-genre">${genreTranslations[genre] || genre}</span>`).join('');
    
    modalGameTags.innerHTML = `
        <span class="game-status ${statusClass}">${statusText}</span>
        ${genresHtml}
    `;
    
    gameModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
const closeModal = document.querySelector('.close-modal');
const gameModal = document.getElementById('gameModal');

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
        document.getElementById('modalGameVideo').src = '';
    }
});

// Copy card number function
function copyCardNumber() {
    const cardNumber = '4276 1805 5058 1960';
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''))
        .then(() => {
            const tooltip = document.getElementById('copy-tooltip');
            tooltip.textContent = 'Скопировано!';
            setTimeout(() => tooltip.textContent = 'Нажмите чтобы скопировать', 2000);
        })
        .catch(err => console.error('Ошибка при копировании: ', err));
}

document.getElementById('card-number').addEventListener('click', copyCardNumber);

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
    const activeTab = tabElement.querySelector('.active');
    if (activeTab) {
        sliderElement.style.width = `${activeTab.offsetWidth}px`;
        sliderElement.style.left = `${activeTab.offsetLeft}px`;
    }
}

// Initialize tab sliders and render games
setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);

// Separate filters for games and movies
let currentGameFilters = ['all'];
let currentMovieFilters = ['all'];
let currentGameStatusFilters = ['all'];
let currentMovieStatusFilters = ['all'];
let currentSort = 'name';
let currentTab = 'games';

// Sort and filter games
function sortAndFilterData() {
    let data = currentTab === 'games' ? [...gamesData] : [...moviesData];
    const currentFilters = currentTab === 'games' ? currentGameFilters : currentMovieFilters;
    const currentStatusFilters = currentTab === 'games' ? currentGameStatusFilters : currentMovieStatusFilters;
    
    // Apply genre filter
    if (!currentFilters.includes('all')) {
        data = data.filter(item => 
            item.genres.some(genre => currentFilters.includes(genre))
        );
    }
    
    // Apply status filter
    if (!currentStatusFilters.includes('all')) {
        data = data.filter(item => 
            currentStatusFilters.includes(item.status)
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
        
    renderCards(container, data, currentTab === 'games' ? 'game' : 'movie');
    
    // Центрируем карточки
    centerLastRowCards(container);
}

// Функция для центрирования карточек в последнем ряду
function centerLastRowCards(container) {
    const cards = container.querySelectorAll('.game-card');
    if (cards.length === 0) return;
    
    // Сбросим предыдущие стили
    cards.forEach(card => {
        card.style.marginLeft = '';
        card.style.marginRight = '';
        card.style.gridColumn = '';
    });
    
    // Получим количество карточек в ряду
    const gridComputedStyle = window.getComputedStyle(container);
    const gridColumnCount = gridComputedStyle.gridTemplateColumns.split(' ').length;
    
    // Если карточек меньше, чем столбцов в сетке
    if (cards.length < gridColumnCount) {
        const emptyCells = gridColumnCount - (cards.length % gridColumnCount);
        const lastRowStart = cards.length - (cards.length % gridColumnCount || gridColumnCount);
        
        // Центрируем последний ряд
        if (emptyCells < gridColumnCount) {
            const firstCardInLastRow = cards[lastRowStart];
            firstCardInLastRow.style.gridColumn = `${Math.floor(emptyCells/2) + 1} / span ${gridColumnCount - emptyCells + 1}`;
        }
    }
}

// Initial render
sortAndFilterData();

// Toggle filter dropdown
filterToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    filterDropdown.classList.toggle('active');
});

// Close filter dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
        filterDropdown.classList.remove('active');
    }
});

// Filter option click handler
filterOptions.forEach(option => {
    option.addEventListener('change', function() {
        const filter = this.getAttribute('data-filter');
        const type = this.getAttribute('data-type');
        
        // Update active filters based on type
        if (type === 'games') {
            if (filter === 'all') {
                // If "all" is checked, uncheck all others
                if (this.checked) {
                    currentGameFilters = ['all'];
                    document.querySelectorAll('.games-filters input').forEach(opt => {
                        if (opt !== this && opt.getAttribute('data-type') === 'games') opt.checked = false;
                    });
                } else {
                    currentGameFilters = currentGameFilters.filter(f => f !== 'all');
                }
            } else {
                // If a specific filter is checked, uncheck "all"
                if (this.checked) {
                    currentGameFilters = currentGameFilters.filter(f => f !== 'all');
                    document.querySelector('.games-filters input[data-filter="all"][data-type="games"]').checked = false;
                    currentGameFilters.push(filter);
                } else {
                    currentGameFilters = currentGameFilters.filter(f => f !== filter);
                }
            }
        } else if (type === 'movies') {
            if (filter === 'all') {
                // If "all" is checked, uncheck all others
                if (this.checked) {
                    currentMovieFilters = ['all'];
                    document.querySelectorAll('.movies-filters input').forEach(opt => {
                        if (opt !== this && opt.getAttribute('data-type') === 'movies') opt.checked = false;
                    });
                } else {
                    currentMovieFilters = currentMovieFilters.filter(f => f !== 'all');
                }
            } else {
                // If a specific filter is checked, uncheck "all"
                if (this.checked) {
                    currentMovieFilters = currentMovieFilters.filter(f => f !== 'all');
                    document.querySelector('.movies-filters input[data-filter="all"][data-type="movies"]').checked = false;
                    currentMovieFilters.push(filter);
                } else {
                    currentMovieFilters = currentMovieFilters.filter(f => f !== filter);
                }
            }
        } else if (type === 'status') {
            if (filter === 'all') {
                // If "all" is checked, uncheck all others
                if (this.checked) {
                    currentGameStatusFilters = ['all'];
                    currentMovieStatusFilters = ['all'];
                    document.querySelectorAll('.status-filters input').forEach(opt => {
                        if (opt !== this) opt.checked = false;
                    });
                } else {
                    currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== 'all');
                    currentMovieStatusFilters = currentMovieStatusFilters.filter(f => f !== 'all');
                }
            } else {
                // If a specific filter is checked, uncheck "all"
                if (this.checked) {
                    currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== 'all');
                    currentMovieStatusFilters = currentMovieStatusFilters.filter(f => f !== 'all');
                    document.querySelector('.status-filters input[data-filter="all"]').checked = false;
                    currentGameStatusFilters.push(filter);
                    currentMovieStatusFilters.push(filter);
                } else {
                    currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== filter);
                    currentMovieStatusFilters = currentMovieStatusFilters.filter(f => f !== filter);
                }
            }
        }
        
        sortAndFilterData();
    });
});

// Sort tab click handler with animation
sortTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        const sort = this.getAttribute('data-sort');
        
        // Update active sort
        sortTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Update sort slider position
        setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
        
        // Add animation class
        const activeContent = document.querySelector('.games-content.active');
        const activeGrid = activeContent.querySelector('.games-grid');
        activeGrid.classList.add('sorting');
        
        currentSort = sort;
        
        setTimeout(() => {
            sortAndFilterData();
            setTimeout(() => {
                activeGrid.classList.remove('sorting');
            }, 300);
        }, 300);
    });
});

// Games tabs with animation
gamesTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        gamesTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Animate tab slider
        setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
        
        // Add animation class
        const previousContent = document.querySelector('.games-content.active');
        if (previousContent) {
            previousContent.classList.add('fade-out');
        }
        
        currentTab = tab.dataset.tab;
        
        setTimeout(() => {
            // Show/hide appropriate filter groups
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

// Toggle games grid
const toggleGamesBtn = document.getElementById('toggle-games');
let isExpanded = false;

toggleGamesBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    const activeContent = document.querySelector('.games-content.active');
    const activeGrid = activeContent.querySelector('.games-grid');
    
    activeGrid.classList.toggle('expanded', isExpanded);
    toggleGamesBtn.textContent = isExpanded ? 'Свернуть' : 'Развернуть';
    
    // Убрана автоматическая прокрутка вниз
});

// Сброс состояния кнопки при переключении вкладок
gamesTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        isExpanded = false;
        const allGrids = document.querySelectorAll('.games-grid');
        allGrids.forEach(grid => grid.classList.remove('expanded'));
        toggleGamesBtn.textContent = 'Развернуть';
    });
});

window.addEventListener('resize', () => {
    setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
    setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
    
    // Перецентрируем карточки при изменении размера окна
    const activeContent = document.querySelector('.games-content.active');
    if (activeContent) {
        const activeGrid = activeContent.querySelector('.games-grid');
        centerLastRowCards(activeGrid);
    }
});

// Easter egg - history section on image click
const heroImage = document.getElementById('hero-image-click');
let clickCount = 0;
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.querySelector('.close-history-modal');

heroImage.addEventListener('click', () => {
    clickCount++;
    heroImage.classList.add('clicked');
    
    // Reset animation after 300ms
    setTimeout(() => {
        heroImage.classList.remove('clicked');
    }, 300);
    
    // Show history modal after 14 clicks
    if (clickCount >= 14) {
        historyModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        clickCount = 0; // Reset counter
    }
});

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

// Инициализируем фильтры по статусам при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Перерисуем карточки
    sortAndFilterData();
    
    // Обновим позицию слайдеров
    setTimeout(() => {
        setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
        setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
    }, 100);
    
    // Установим галочку "Все" по умолчанию
    document.querySelectorAll('.filter-option input[data-filter="all"]').forEach(input => {
        input.checked = true;
    });
});

// Дополнительное исправление для проблемы с верхом первого ряда
function fixFirstRowOverlap() {
    const gamesGrid = document.querySelector('.games-grid');
    if (gamesGrid) {
        const firstRowCards = gamesGrid.querySelectorAll('.game-card');
        if (firstRowCards.length > 0) {
            // Добавляем дополнительный отступ для первых карточек
            firstRowCards.forEach((card, index) => {
                if (index < 4) { // Предполагаем 4 карточки в строке
                    card.style.marginTop = '20px';
                }
            });
        }
    }
}

// Вызываем функцию после загрузки и после фильтрации/сортировки
setTimeout(fixFirstRowOverlap, 500);
window.addEventListener('resize', fixFirstRowOverlap);

// Модифицируем функцию сортировки и фильтрации для вызова fixFirstRowOverlap
const originalSortAndFilterData = sortAndFilterData;
sortAndFilterData = function() {
    originalSortAndFilterData();
    setTimeout(fixFirstRowOverlap, 100);
};
