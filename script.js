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
    },
    {
        id: 'minecraft',
        title: 'Minecraft',
        rating: 5,
        description: 'Легендарная песочница с безграничными возможностями для творчества. Игра, в которую можно играть бесконечно, каждый раз открывая что-то новое.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/53344d4d9596276b9b7f70158bf95779.webp',
        genres: ['adventure', 'sandbox'],
        status: 'on-hold',
        customColor: '#ffd700'
    },
    {
        id: 'lethal-company',
        title: 'Lethal Company',
        rating: 4,
        description: 'Кооперативный хоррор про сбор лома на опасных планетах. Веселая и страшная игра для прохождения с друзьями.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/fd729ccc51bbb0d182ac464d2f34e4f2.webp',
        genres: ['horror', 'coop'],
        status: 'dropped',
        customColor: '#ff6464'
    },
    {
        id: 'hollow-knight',
        title: 'Hollow Knight',
        rating: 5,
        description: 'Изумительный метроидвания с красивым миром и сложными боями. Одна из лучших инди-игр всех времен с глубоким лором и атмосферой.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/2cffdc4195ce6adf0a57062e4318662e.webp',
        genres: ['adventure', 'metroidvania'],
        status: 'completed',
        customColor: '#39ff14'
    },
    {
        id: 'content-warning',
        title: 'Content Warning',
        rating: 3.5,
        description: 'Страшные приключения с друзьями в поисках вирального контента. Веселая кооперативная игра с элементами хоррора.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/ec6fbf0d38ffc435686348723a08c839.png',
        genres: ['horror', 'coop'],
        status: 'playing',
        customColor: '#ff2d95'
    },
    {
        id: 'cs2',
        title: 'CS2',
        rating: 4,
        description: 'Легендарный тактический шутер с безупречным геймплеем. Competitive игра, в которой каждый матч уникален и непредсказуем.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/0662aa1719017e0efa5fa8daf0880c6e.png',
        genres: ['shooter', 'fps'],
        status: 'on-hold',
        customColor: '#ffd700'
    },
    {
        id: 'sally-face',
        title: 'Sally Face',
        rating: 4.5,
        description: 'Мрачная приключенческая игра с уникальным стиль и сюжетом. Захватывающая история с неожиданными поворотами и тайнами.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/9e729118dec145b90ce23e1f973a29b2.png',
        genres: ['adventure', 'horror'],
        status: 'completed',
        customColor: '#39ff14'
    },
    {
        id: 'gris',
        title: 'Gris',
        rating: 5,
        description: 'Визуально потрясающая платформер-притча о преодолении горя. Невероятно красивая и эмоциональная игра с минималистичным геймплеем.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/28c3c3e591be4d57567ec7830f7b3b46.webp',
        genres: ['adventure', 'platformer'],
        status: 'completed',
        customColor: '#39ff14'
    },
    {
        id: 'batim',
        title: 'Bendy and the Ink Machine',
        rating: 4,
        description: 'Уникальный хоррор в стиле старых мультфильмов с атмосферной историей и запоминающимися персонажами.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/ce4a1312b1f8175eb808eb101eccce0c.png',
        genres: ['horror', 'adventure'],
        status: 'dropped',
        customColor: '#8c4c06'
    },
    {
        id: 'batdr',
        title: 'Bendy and the Dark Revival',
        rating: 4.5,
        description: 'Продолжение культового хоррора с улучшенной графикой, новыми механиками и захватывающим сюжетом.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://cdn2.steamgriddb.com/grid/fc423c11f06856a5507d3b91e393ddb4.jpg',
        genres: ['horror', 'adventure'],
        status: 'playing',
        customColor: '#0c1725'
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
        id: 'indie-cross',
        title: 'Indie Cross',
        rating: 4,
        description: 'Кроссовер независимых игр с уникальным стилем и захватывающим сюжетом. Удивительное сочетание разных вселенных и персонажей.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://i.redd.it/hskopjmudyxe1.png',
        genres: ['animation', 'crossover'],
        status: 'watching',
        customColor: '#ff2d95'
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
    },
    {
        id: 'rick-morty',
        title: 'Rick and Morty',
        rating: 4.5,
        description: 'Культовый анимационный сериал о безумных приключениях ученого и его внука. Остроумный юмор и неожиданные повороты сюжета.',
        videoId: 'dQw4w9WgXcQ',
        image: 'https://images.kinorium.com/movie/poster/2999112/w1500_43545645.jpg',
        genres: ['animation', 'crossover'],
        status: 'watching',
        customColor: '#ff2d95'
    }
];

// Состояние анимаций
let isFiltering = false;
let isSorting = false;

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
    'crossover': 'Кроссовер'
};

// Render game/movie cards
function renderCards(container, data, type) {
    container.innerHTML = '';
    
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute(`data-${type}`, item.id);
        
        // Добавляем классы для анимаций
        card.classList.add('filter-match');
        
        if (type === 'game') {
            card.classList.add(item.status);
        } else {
            if (item.status === 'watched') {
                card.classList.add('watched');
            } else if (item.status === 'watching') {
                card.classList.add('watching');
            } else {
                card.classList.add(item.status);
            }
        }
        
        card.style.setProperty('--custom-hover-color', item.customColor);
        
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
    
    // Убираем класс анимации после появления
    setTimeout(() => {
        const cards = container.querySelectorAll('.game-card');
        cards.forEach(card => {
            card.classList.remove('filter-match');
        });
    }, 800);
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

// Separate filters for games and movies
let currentGameFilters = ['all'];
let currentGameStatusFilters = ['status-all'];
let currentMovieFilters = ['all'];
let currentMovieStatusFilters = ['status-all'];
let currentSort = 'name';
let currentTab = 'games';

// Sort and filter games
function sortAndFilterData() {
    if (isFiltering || isSorting) return;
    
    let data = currentTab === 'games' ? [...gamesData] : [...moviesData];
    const currentFilters = currentTab === 'games' ? currentGameFilters : currentMovieFilters;
    const currentStatusFilters = currentTab === 'games' ? currentGameStatusFilters : currentMovieStatusFilters;
    
    // Добавляем анимацию фильтрации
    const activeGrid = document.querySelector('.games-content.active .games-grid');
    activeGrid.classList.add('filtering');
    
    isFiltering = true;
    
    setTimeout(() => {
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
            
        renderCards(container, data, currentTab === 'games' ? 'game' : 'movie');
        
        // Убираем класс фильтрации после завершения
        setTimeout(() => {
            activeGrid.classList.remove('filtering');
            isFiltering = false;
        }, 300);
        
    }, 400);
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
        
        // Check if it's a status filter
        const isStatusFilter = ['status-all', 'completed', 'playing', 'dropped', 'on-hold', 'watched', 'watching'].includes(filter);
        
        // Update active filters based on type
        if (type === 'games') {
            if (isStatusFilter) {
                if (filter === 'status-all') {
                    // If "all" is checked, uncheck all others
                    if (this.checked) {
                        currentGameStatusFilters = ['status-all'];
                        document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                            if (opt.getAttribute('data-filter') !== 'status-all' && 
                                ['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                                opt.checked = false;
                            }
                        });
                    } else {
                        currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== 'status-all');
                    }
                } else {
                    // If a specific status filter is checked, uncheck "all"
                    if (this.checked) {
                        currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== 'status-all');
                        document.querySelector('.games-filters input[data-filter="status-all"]').checked = false;
                        currentGameStatusFilters.push(filter);
                    } else {
                        currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== filter);
                    }
                }
            } else {
                if (filter === 'all') {
                    // If "all" is checked, uncheck all others
                    if (this.checked) {
                        currentGameFilters = ['all'];
                        document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                            if (opt !== this && !['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                                opt.checked = false;
                            }
                        });
                    } else {
                        currentGameFilters = currentGameFilters.filter(f => f !== 'all');
                    }
                } else {
                    // If a specific genre filter is checked, uncheck "all"
                    if (this.checked) {
                        currentGameFilters = currentGameFilters.filter(f => f !== 'all');
                        document.querySelector('.games-filters input[data-filter="all"]').checked = false;
                        currentGameFilters.push(filter);
                    } else {
                        currentGameFilters = currentGameFilters.filter(f => f !== filter);
                    }
                }
            }
        } else if (type === 'movies') {
            if (isStatusFilter) {
                if (filter === 'status-all') {
                    // If "all" is checked, uncheck all others
                    if (this.checked) {
                        currentMovieStatusFilters = ['status-all'];
                        document.querySelectorAll('.movies-filters input[data-type="movies"]').forEach(opt => {
                            if (opt.getAttribute('data-filter') !== 'status-all' && 
                                ['status-all', 'watched', 'watching', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                                opt.checked = false;
                            }
                        });
                    } else {
                        currentMovieStatusFilters = currentMovieStatusFilters.filter(f => f !== 'status-all');
                    }
                } else {
                    // If a specific status filter is checked, uncheck "all"
                    if (this.checked) {
                        currentMovieStatusFilters = currentMovieStatusFilters.filter(f => f !== 'status-all');
                        document.querySelector('.movies-filters input[data-filter="status-all"]').checked = false;
                        currentMovieStatusFilters.push(filter);
                    } else {
                        currentMovieStatusFilters = currentMovieStatusFilters.filter(f => f !== filter);
                    }
                }
            } else {
                if (filter === 'all') {
                    // If "all" is checked, uncheck all others
                    if (this.checked) {
                        currentMovieFilters = ['all'];
                        document.querySelectorAll('.movies-filters input[data-type="movies"]').forEach(opt => {
                            if (opt !== this && !['status-all', 'watched', 'watching', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                                opt.checked = false;
                            }
                        });
                    } else {
                        currentMovieFilters = currentMovieFilters.filter(f => f !== 'all');
                    }
                } else {
                    // If a specific genre filter is checked, uncheck "all"
                    if (this.checked) {
                        currentMovieFilters = currentMovieFilters.filter(f => f !== 'all');
                        document.querySelector('.movies-filters input[data-filter="all"]').checked = false;
                        currentMovieFilters.push(filter);
                    } else {
                        currentMovieFilters = currentMovieFilters.filter(f => f !== filter);
                    }
                }
            }
        }
        
        sortAndFilterData();
    });
});

// Sort tab click handler with animation
sortTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        if (isSorting) return;
        
        const sort = this.getAttribute('data-sort');
        
        // Update active sort
        sortTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Update sort slider position
        setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
        
        // Добавляем анимацию сортировки
        const activeContent = document.querySelector('.games-content.active');
        const activeGrid = activeContent.querySelector('.games-grid');
        activeGrid.classList.add('sorting');
        
        isSorting = true;
        currentSort = sort;
        
        setTimeout(() => {
            sortAndFilterData();
            setTimeout(() => {
                activeGrid.classList.remove('sorting');
                isSorting = false;
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
        
        // Плавная прокрутка к началу секции
        document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
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

// Make sure all external links open in new tab
document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (!link.href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set initial filters
    document.querySelectorAll('.filter-option input[data-filter="all"]').forEach(input => {
        input.checked = true;
    });
    document.querySelectorAll('.filter-option input[data-filter="status-all"]').forEach(input => {
        input.checked = true;
    });
    
    // Initial render
    sortAndFilterData();
    
    // Update slider positions
    setTimeout(() => {
        setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
        setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
    }, 100);
});

// Initialize tab sliders and render games
setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
