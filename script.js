// script.js - основной функционал сайта Ksusha Sher

document.addEventListener('DOMContentLoaded', function() {
    // ========== ОСНОВНЫЕ ПЕРЕМЕННЫЕ ==========
    let currentTab = 'games';
    let currentSort = 'name';
    let isGamesExpanded = false;
    let activeFilters = {
        games: ['status-all', 'all'],
        movies: ['status-all', 'all']
    };

    // ========== МОБИЛЬНОЕ МЕНЮ ==========
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Закрытие меню при клике на ссылку
        const navLinks = document.querySelectorAll('#nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ========== СКРОЛЛ ХЕДЕРА ==========
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            document.body.classList.add('scrolled-down');
            document.body.classList.remove('scrolled-up');
        } else {
            document.body.classList.add('scrolled-up');
            document.body.classList.remove('scrolled-down');
        }
        
        lastScrollTop = scrollTop;
    });

    // ========== СИСТЕМА ПЛАНЕТ ==========
    function getRandomCommunityPhotos() {
        const photos = [
                'https://static-cdn.jtvnw.net/jtv_user_pictures/13143416-1259-4795-8517-975764570435-profile_image-70x70.png',
                'https://static-cdn.jtvnw.net/jtv_user_pictures/ae066e0d-dda7-421a-a9d0-d3d77f623cfd-profile_image-70x70.png',
                'blob:https://web.telegram.org/c4e4221e-7f4a-48a0-aa6c-5be4bae49eec',
                'https://static-cdn.jtvnw.net/jtv_user_pictures/bca2b1f8-6531-46d4-badc-92c27f7cbdef-profile_image-70x70.png'
        ];
        
        const shuffled = [...photos].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    }

    // Обновляем рандомные фото планет
    function updatePlanetPhotos() {
        const randomPhotos = getRandomCommunityPhotos();
        const pinkPlanet = document.querySelector('.planet-pink');
        const whitePlanet = document.querySelector('.planet-white');
        
        if (pinkPlanet && randomPhotos[0]) {
            pinkPlanet.style.opacity = '0';
            setTimeout(() => {
                pinkPlanet.src = randomPhotos[0];
                pinkPlanet.style.opacity = '1';
            }, 300);
        }
        if (whitePlanet && randomPhotos[1]) {
            whitePlanet.style.opacity = '0';
            setTimeout(() => {
                whitePlanet.src = randomPhotos[1];
                whitePlanet.style.opacity = '1';
            }, 600);
        }
    }

    // Инициализация планет
    updatePlanetPhotos();
    setInterval(updatePlanetPhotos, 30000);

    // ========== РАСПИСАНИЕ СТРИМОВ ==========
    const scheduleData = [
        { day: 'Понедельник', time: '16:00', game: 'Horizon Forbidden West', desc: 'Продолжение эпического путешествия по постапокалиптическому миру', status: 'active' },
        { day: 'Вторник', time: '16:00', game: 'Resident Evil 4 Remake', desc: 'Классика хоррора в современном исполнении', status: 'active' },
        { day: 'Среда', time: '16:00', game: 'The Last of Us Part II', desc: 'Эмоциональное путешествие в постапокалиптическом мире', status: 'active' },
        { day: 'Четверг', time: '16:00', game: 'Cyberpunk 2077', desc: 'Исследуем Найт-Сити и выполняем контракты', status: 'inactive' },
        { day: 'Пятница', time: '16:00', game: 'Случайная игра', desc: 'Выбор зрителей или новая игра недели', status: 'active' },
        { day: 'Суббота', time: '14:00', game: 'Кино-суббота', desc: 'Смотрим и обсуждаем фильмы вместе с комьюнити', status: 'active' },
        { day: 'Воскресенье', time: '15:00', game: 'Q&A и общение', desc: 'Отвечаю на вопросы и общаюсь с комьюнити', status: 'inactive' }
    ];

    function renderSchedule() {
        const scheduleList = document.getElementById('schedule-list');
        if (!scheduleList) return;

        const today = new Date().getDay();
        const russianDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const todayName = russianDays[today];

        scheduleList.innerHTML = scheduleData.map(item => `
            <div class="schedule-item ${item.day === todayName ? 'highlighted' : ''}">
                <div class="schedule-day-wrapper">
                    <div class="schedule-day">${item.day}</div>
                    <div class="schedule-time">${item.time} МСК</div>
                </div>
                <div class="schedule-content">
                    <div class="schedule-game">${item.game}</div>
                    <div class="schedule-desc">${item.desc}</div>
                </div>
                <div class="schedule-status ${item.status === 'active' ? 'active' : ''}"></div>
            </div>
        `).join('');
    }

    renderSchedule();

    // ========== СИСТЕМА ИГР И ФИЛЬМОВ ==========
    const gamesData = [
        { 
            id: 1, 
            title: 'The Last of Us Part II', 
            rating: 5, 
            description: 'Эпическая история выживания в постапокалиптическом мире', 
            image: 'https://images.unsplash.com/photo-1598550476439-6847785e9e6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/WxjeV10H1F0',
            status: 'completed',
            genres: ['adventure', 'horror'],
            customColor: '#39ff14'
        },
        { 
            id: 2, 
            title: 'Horizon Forbidden West', 
            rating: 4, 
            description: 'Путешествие по опасным землям, населенным механическими существами', 
            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/Lq594XmpOJg',
            status: 'playing',
            genres: ['adventure', 'rpg'],
            customColor: '#ff2d95'
        },
        { 
            id: 3, 
            title: 'Resident Evil 4 Remake', 
            rating: 5, 
            description: 'Обновленная версия классического хоррора от Capcom', 
            image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/9iy6gLBC5so',
            status: 'playing',
            genres: ['horror', 'shooter'],
            customColor: '#ff6464'
        },
        { 
            id: 4, 
            title: 'Cyberpunk 2077', 
            rating: 4, 
            description: 'Ролевая игра в открытом мире будущего', 
            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/Lq594XmpOJg',
            status: 'on-hold',
            genres: ['rpg', 'shooter'],
            customColor: '#ffd700'
        },
        { 
            id: 5, 
            title: 'Stray', 
            rating: 4, 
            description: 'Приключения кота в киберпанк-городе', 
            image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/u84hRUQlaio',
            status: 'completed',
            genres: ['adventure', 'platformer'],
            customColor: '#39ff14'
        },
        { 
            id: 6, 
            title: 'It Takes Two', 
            rating: 5, 
            description: 'Кооперативное приключение о паре, превращенной в кукол', 
            image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/5Np_2hBxQcQ',
            status: 'completed',
            genres: ['adventure', 'coop', 'platformer'],
            customColor: '#39ff14'
        }
    ];

    const moviesData = [
        { 
            id: 1, 
            title: 'Аватар: Путь воды', 
            rating: 5, 
            description: 'Продолжение истории об Пандоре и народе Нави', 
            image: 'https://images.unsplash.com/photo-1489599809519-364a47ae3cde?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/d9MyW72ELq0',
            status: 'watched',
            genres: ['fantasy', 'adventure'],
            customColor: '#39ff14'
        },
        { 
            id: 2, 
            title: 'Человек-паук: Паутина вселенных', 
            rating: 5, 
            description: 'Мультфильм о мультивселенной Человека-паука', 
            image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/8VYLV5_AKaM',
            status: 'watched',
            genres: ['animation', 'crossover'],
            customColor: '#39ff14'
        },
        { 
            id: 3, 
            title: 'Оппенгеймер', 
            rating: 4, 
            description: 'Биографический фильм о создателе атомной бомбы', 
            image: 'https://images.unsplash.com/photo-1585951237318-9ea5e175b891?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/uYPbbksJxIg',
            status: 'watching',
            genres: ['drama', 'history'],
            customColor: '#ff2d95'
        },
        { 
            id: 4, 
            title: 'Барби', 
            rating: 4, 
            description: 'Комедия о знаменитой кукле Барби', 
            image: 'https://images.unsplash.com/photo-1598890777033-351f2e6f5b7c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            video: 'https://www.youtube.com/embed/8zIf0XvoL9Y',
            status: 'on-hold',
            genres: ['comedy', 'fantasy'],
            customColor: '#ffd700'
        }
    ];

    // ========== РЕНДЕРИНГ КАРТОЧЕК ==========
    function renderGameCards(data, container) {
        if (!container) return;
        
        const filteredData = filterData(data);
        const sortedData = sortData(filteredData);
        
        container.innerHTML = sortedData.map(item => `
            <div class="game-card ${item.status}" 
                 data-id="${item.id}" 
                 data-status="${item.status}"
                 data-genres="${item.genres.join(',')}"
                 style="${item.customColor ? `--custom-hover-color: ${item.customColor}` : ''}">
                <div class="game-image-container">
                    <img src="${item.image}" alt="${item.title}" class="game-image">
                </div>
                <div class="game-info">
                    <h3 class="game-title">${item.title}</h3>
                    <div class="game-rating">
                        ${renderStars(item.rating)}
                        <span>${item.rating}/5</span>
                    </div>
                    <p class="game-description">${item.description}</p>
                    <div class="game-genres">
                        ${item.genres.map(genre => `<span class="game-genre">${getGenreName(genre)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        // Добавляем обработчики событий для карточек
        const cards = container.querySelectorAll('.game-card');
        cards.forEach(card => {
            card.addEventListener('click', () => openModal(card.dataset.id));
        });
    }

    function renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    function getGenreName(genre) {
        const genreNames = {
            'horror': 'Хоррор',
            'adventure': 'Приключения',
            'shooter': 'Шутер',
            'simulator': 'Симулятор',
            'puzzle': 'Головоломка',
            'coop': 'Кооператив',
            'platformer': 'Платформер',
            'rpg': 'RPG',
            'animation': 'Анимация',
            'fantasy': 'Фэнтези',
            'crossover': 'Кроссовер',
            'drama': 'Драма',
            'history': 'История',
            'comedy': 'Комедия'
        };
        return genreNames[genre] || genre;
    }

    // ========== ФИЛЬТРАЦИЯ И СОРТИРОВКА ==========
    function filterData(data) {
        return data.filter(item => {
            const statusFilter = activeFilters[currentTab].some(filter => 
                filter.includes('status-') && filter !== 'status-all' ? 
                item.status === filter.replace('status-', '') : true
            );
            
            const genreFilter = activeFilters[currentTab].some(filter => 
                !filter.includes('status-') && filter !== 'all' ? 
                item.genres.includes(filter) : true
            );

            return statusFilter && genreFilter;
        });
    }

    function sortData(data) {
        return [...data].sort((a, b) => {
            switch (currentSort) {
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                default:
                    return a.title.localeCompare(b.title);
            }
        });
    }

    // ========== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ==========
    const gamesTabs = document.querySelectorAll('.games-tab');
    const gamesContents = document.querySelectorAll('.games-content');
    const tabSlider = document.querySelector('.tab-slider');

    gamesTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            
            // Обновляем активную вкладку
            gamesTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Обновляем слайдер
            if (tabSlider) {
                const index = Array.from(gamesTabs).indexOf(tab);
                tabSlider.style.transform = `translateX(${index * 100}%)`;
            }
            
            // Переключаем контент
            switchTab(tabType);
        });
    });

    function switchTab(tabType) {
        currentTab = tabType;
        
        // Скрываем все контенты
        gamesContents.forEach(content => {
            content.classList.remove('active');
            content.classList.add('fade-out');
        });

        // Показываем активный контент
        const activeContent = document.getElementById(`${tabType}-content`);
        if (activeContent) {
            setTimeout(() => {
                activeContent.classList.remove('fade-out');
                activeContent.classList.add('fade-in');
                setTimeout(() => {
                    activeContent.classList.add('active');
                    activeContent.classList.remove('fade-in');
                }, 50);
            }, 300);
        }

        // Обновляем фильтры
        updateFilterDisplay();
        
        // Рендерим соответствующие данные
        const container = activeContent ? activeContent.querySelector('.games-grid') : null;
        const data = tabType === 'games' ? gamesData : moviesData;
        renderGameCards(data, container);
    }

    // ========== ФИЛЬТРЫ ==========
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');
    const filterCheckboxes = document.querySelectorAll('.filter-option input');

    if (filterToggle && filterDropdown) {
        filterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('active');
        });

        // Закрытие фильтров при клике вне
        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && e.target !== filterToggle) {
                filterDropdown.classList.remove('active');
            }
        });

        // Обработка чекбоксов фильтров
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const filter = checkbox.dataset.filter;
                const type = checkbox.dataset.type;
                
                if (filter === 'all' || filter === 'status-all') {
                    // Если выбран "Все", снимаем другие выборы
                    if (checkbox.checked) {
                        document.querySelectorAll(`.filter-option input[data-type="${type}"]`).forEach(cb => {
                            if (cb !== checkbox && (cb.dataset.filter === 'all' || cb.dataset.filter === 'status-all')) {
                                cb.checked = false;
                            }
                        });
                    }
                } else {
                    // Если выбран конкретный фильтр, снимаем "Все"
                    if (checkbox.checked) {
                        document.querySelectorAll(`.filter-option input[data-type="${type}"][data-filter="${filter.includes('status-') ? 'status-all' : 'all'}"]`).forEach(cb => {
                            cb.checked = false;
                        });
                    }
                }
                
                updateFilters();
            });
        });
    }

    function updateFilters() {
        activeFilters = { games: [], movies: [] };
        
        filterCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const type = checkbox.dataset.type;
                activeFilters[type].push(checkbox.dataset.filter);
            }
        });

        // Если нет активных фильтров, добавляем "Все"
        Object.keys(activeFilters).forEach(type => {
            if (activeFilters[type].length === 0) {
                activeFilters[type].push('all');
                if (type === 'games' || type === 'movies') {
                    activeFilters[type].push('status-all');
                }
            }
        });

        // Перерисовываем карточки
        const container = document.querySelector(`#${currentTab}-content .games-grid`);
        const data = currentTab === 'games' ? gamesData : moviesData;
        renderGameCards(data, container);
    }

    function updateFilterDisplay() {
        const gamesFilters = document.querySelector('.games-filters');
        const moviesFilters = document.querySelector('.movies-filters');
        
        if (gamesFilters && moviesFilters) {
            if (currentTab === 'games') {
                gamesFilters.style.display = 'block';
                moviesFilters.style.display = 'none';
            } else {
                gamesFilters.style.display = 'none';
                moviesFilters.style.display = 'block';
            }
        }
    }

    // ========== СОРТИРОВКА ==========
    const sortTabs = document.querySelectorAll('.sort-tab');
    const sortSlider = document.querySelector('.sort-slider');

    sortTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sortType = tab.dataset.sort;
            
            sortTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (sortSlider) {
                const index = Array.from(sortTabs).indexOf(tab);
                sortSlider.style.transform = `translateX(${index * 100}%)`;
            }
            
            currentSort = sortType;
            
            const container = document.querySelector(`#${currentTab}-content .games-grid`);
            const data = currentTab === 'games' ? gamesData : moviesData;
            renderGameCards(data, container);
        });
    });

    // ========== РАЗВЕРТЫВАНИЕ СЕТКИ ==========
    const toggleGames = document.getElementById('toggle-games');
    const gamesGrid = document.querySelector('.games-grid');

    if (toggleGames && gamesGrid) {
        toggleGames.addEventListener('click', () => {
            isGamesExpanded = !isGamesExpanded;
            gamesGrid.classList.toggle('expanded');
            toggleGames.textContent = isGamesExpanded ? 'Свернуть' : 'Развернуть';
        });
    }

    // ========== МОДАЛЬНОЕ ОКНО ==========
    const modal = document.getElementById('gameModal');
    const closeModal = document.querySelector('.close-modal');

    function openModal(id) {
        const data = currentTab === 'games' ? gamesData : moviesData;
        const item = data.find(i => i.id == id);
        
        if (!item || !modal) return;

        document.getElementById('modalGameTitle').textContent = item.title;
        document.getElementById('modalGameRating').innerHTML = 
            `${renderStars(item.rating)} <span>${item.rating}/5</span>`;
        document.getElementById('modalGameDescription').textContent = item.description;
        
        const video = document.getElementById('modalGameVideo');
        if (video) {
            video.src = item.video;
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            const video = document.getElementById('modalGameVideo');
            if (video) {
                video.src = '';
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            const video = document.getElementById('modalGameVideo');
            if (video) {
                video.src = '';
            }
        }
    });

    // ========== КОПИРОВАНИЕ НОМЕРА КАРТЫ ==========
    const cardNumber = document.getElementById('card-number');
    if (cardNumber) {
        cardNumber.addEventListener('click', async () => {
            const text = '4276 1805 5058 1960';
            try {
                await navigator.clipboard.writeText(text);
                const tooltip = document.getElementById('copy-tooltip');
                if (tooltip) {
                    tooltip.textContent = 'Скопировано!';
                    setTimeout(() => {
                        tooltip.textContent = 'Нажмите чтобы скопировать';
                    }, 2000);
                }
            } catch (err) {
                console.error('Ошибка копирования: ', err);
            }
        });
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        // Инициализация первой вкладки
        switchTab('games');
        
        // Инициализация сортировки
        if (sortSlider) {
            sortSlider.style.transform = 'translateX(0%)';
        }
        
        // Инициализация слайдера вкладок
        if (tabSlider) {
            tabSlider.style.transform = 'translateX(0%)';
        }
        
        // Плавная прокрутка для якорей
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    init();
});

// ========== EASTER EGG - ИСТОРИЯ КОМЬЮНИТИ ==========
let clickCount = 0;
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.querySelector('.close-history-modal');

document.addEventListener('DOMContentLoaded', function() {
    const heroImage = document.getElementById('hero-image-click');
    
    if (heroImage) {
        heroImage.addEventListener('click', () => {
            clickCount++;
            heroImage.classList.add('clicked');
            
            setTimeout(() => {
                heroImage.classList.remove('clicked');
            }, 300);
            
            if (clickCount >= 5) {
                if (historyModal) {
                    historyModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                    clickCount = 0;
                }
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
});

