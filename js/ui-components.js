// UI interactions, filters, and hologram functionality

// Filter and sort state
const FilterState = {
    currentGameFilters: ['all'],
    currentGameStatusFilters: ['status-all'],
    currentMovieFilters: ['all'],
    currentMovieStatusFilters: ['status-all'],
    currentSort: 'name',
    currentTab: 'games'
};

// Subscribers data for hologram interface
const subscribersData = {
    kirik: {
        name: "Кирик",
        role: "Технический гений",
        avatar: "assets/images/kirik.jpg",
        description: "Мастер настройки оборудования и решения технических проблем. Всегда помогает с оптимизацией стримов.",
        stats: { 
            attack: 85, 
            defense: 70, 
            speed: 90, 
            accuracy: 78 
        },
        color: "#007bff",
        ability: "Техническая поддержка"
    },
    bagerka: {
        name: "Багерка", 
        role: "Стратег комьюнити",
        avatar: "assets/images/bagerka.jpg",
        description: "Разрабатывает стратегии развития сообщества и организует внутренние мероприятия.",
        stats: { 
            attack: 75, 
            defense: 85, 
            speed: 65, 
            accuracy: 92 
        },
        color: "#ff6464",
        ability: "Стратегическое планирование"
    },
    angel: {
        name: "Ангел",
        role: "Хранитель атмосферы",
        avatar: "assets/images/angel.jpg",
        description: "Создает и поддерживает дружескую атмосферу в чате. Помогает новичкам освоиться.",
        stats: { 
            attack: 60, 
            defense: 95, 
            speed: 80, 
            accuracy: 88 
        },
        color: "#ffa500",
        ability: "Поддержка комьюнити"
    },
    sanya: {
        name: "Саня",
        role: "Активный донатер",
        avatar: "assets/images/sanya.jpg",
        description: "Постоянно поддерживает развитие канала. Его донаты помогают улучшать качество контента.",
        stats: { 
            attack: 88, 
            defense: 72, 
            speed: 75, 
            accuracy: 85 
        },
        color: "#ff2d95",
        ability: "Финансовая поддержка"
    },
    max: {
        name: "Макс",
        role: "Мем-лорд",
        avatar: "assets/images/max.jpg",
        description: "Создает лучшие мемы и развлекает чат. Его шутки становятся легендами комьюнити.",
        stats: { 
            attack: 92, 
            defense: 68, 
            speed: 85, 
            accuracy: 95 
        },
        color: "#39ff14",
        ability: "Создание мемов"
    }
};

// Initialize all UI components
export function initializeUI() {
    initFilters();
    initHologramInterface();
    initCardCopy();
    initSmoothScroll();
    
    console.log('🎨 UI components initialized successfully');
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize filters and sorting
function initFilters() {
    initTabSwitching();
    initFilterDropdown();
    initSortTabs();
    initGridToggle();
    
    // Set initial filters state
    document.querySelectorAll('.filter-option input[data-filter="all"]').forEach(input => {
        input.checked = true;
    });
    document.querySelectorAll('.filter-option input[data-filter="status-all"]').forEach(input => {
        input.checked = true;
    });
    
    // Update sliders position
    updateTabSliders();
    
    console.log('🎛️ Filters initialized');
}

// Tab switching between games and movies
function initTabSwitching() {
    const gamesTabs = document.querySelectorAll('.games-tab');
    const tabSlider = document.querySelector('.tab-slider');

    if (!gamesTabs.length || !tabSlider) return;

    gamesTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            gamesTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            updateTabSliders();
            
            const previousContent = document.querySelector('.games-content.active');
            if (previousContent) {
                previousContent.classList.add('fade-out');
            }
            
            FilterState.currentTab = tab.dataset.tab;
            
            setTimeout(async () => {
                if (FilterState.currentTab === 'movies') {
                    await switchToMoviesTab(previousContent);
                } else {
                    await switchToGamesTab(previousContent);
                }
            }, 300);
        });
    });
}

// Switch to movies tab
async function switchToMoviesTab(previousContent) {
    document.querySelector('.games-filters').style.display = 'none';
    document.querySelector('.movies-filters').style.display = 'block';
    
    const gamesContent = document.getElementById('games-content');
    const moviesContent = document.getElementById('movies-content');
    
    gamesContent.classList.remove('active');
    moviesContent.classList.add('fade-in');
    
    // Import and load movies data
    const { loadMovies, currentMoviesData } = await import('./data-manager.js');
    let moviesData = currentMoviesData;
    
    if (moviesData.length === 0) {
        moviesData = await loadMovies();
    }
    
    // Apply current filters and sort
    applyFiltersAndRender(moviesData, 'movies');
    
    setTimeout(() => {
        moviesContent.classList.remove('fade-in');
        moviesContent.classList.add('active');
        if (previousContent) {
            previousContent.classList.remove('fade-out');
            previousContent.classList.remove('active');
        }
    }, 300);
}

// Switch to games tab
async function switchToGamesTab(previousContent) {
    document.querySelector('.movies-filters').style.display = 'none';
    document.querySelector('.games-filters').style.display = 'block';
    
    const gamesContent = document.getElementById('games-content');
    const moviesContent = document.getElementById('movies-content');
    
    moviesContent.classList.remove('active');
    gamesContent.classList.add('fade-in');
    
    // Import and load games data
    const { loadGames, currentGamesData } = await import('./data-manager.js');
    let gamesData = currentGamesData;
    
    if (gamesData.length === 0) {
        gamesData = await loadGames();
    }
    
    // Apply current filters and sort
    applyFiltersAndRender(gamesData, 'games');
    
    setTimeout(() => {
        gamesContent.classList.remove('fade-in');
        gamesContent.classList.add('active');
        if (previousContent) {
            previousContent.classList.remove('fade-out');
            previousContent.classList.remove('active');
        }
    }, 300);
}

// Initialize filter dropdown
function initFilterDropdown() {
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');

    if (!filterToggle || !filterDropdown) return;

    filterToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        filterDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('active');
        }
    });

    // Filter option event listeners
    const filterOptions = document.querySelectorAll('.filter-option input');
    filterOptions.forEach(option => {
        option.addEventListener('change', function() {
            handleFilterChange(this);
        });
    });
}

// Handle filter checkbox changes
function handleFilterChange(checkbox) {
    const filter = checkbox.getAttribute('data-filter');
    const type = checkbox.getAttribute('data-type');
    
    const isStatusFilter = ['status-all', 'completed', 'playing', 'dropped', 'on-hold', 'watched', 'watching'].includes(filter);
    
    if (type === 'games') {
        updateGameFilters(filter, isStatusFilter, checkbox.checked);
    } else {
        updateMovieFilters(filter, isStatusFilter, checkbox.checked);
    }
    
    applyCurrentFilters();
}

// Update game filters
function updateGameFilters(filter, isStatusFilter, isChecked) {
    if (isStatusFilter) {
        if (filter === 'status-all') {
            if (isChecked) {
                FilterState.currentGameStatusFilters = ['status-all'];
                document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                    if (opt.getAttribute('data-filter') !== 'status-all' && 
                        ['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                        opt.checked = false;
                    }
                });
            }
        } else {
            if (isChecked) {
                FilterState.currentGameStatusFilters = FilterState.currentGameStatusFilters.filter(f => f !== 'status-all');
                document.querySelector('.games-filters input[data-filter="status-all"]').checked = false;
                FilterState.currentGameStatusFilters.push(filter);
            } else {
                FilterState.currentGameStatusFilters = FilterState.currentGameStatusFilters.filter(f => f !== filter);
            }
        }
    } else {
        if (filter === 'all') {
            if (isChecked) {
                FilterState.currentGameFilters = ['all'];
                document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                    if (opt !== this && !['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                        opt.checked = false;
                    }
                });
            }
        } else {
            if (isChecked) {
                FilterState.currentGameFilters = FilterState.currentGameFilters.filter(f => f !== 'all');
                document.querySelector('.games-filters input[data-filter="all"]').checked = false;
                FilterState.currentGameFilters.push(filter);
            } else {
                FilterState.currentGameFilters = FilterState.currentGameFilters.filter(f => f !== filter);
            }
        }
    }
}

// Update movie filters
function updateMovieFilters(filter, isStatusFilter, isChecked) {
    if (isStatusFilter) {
        if (filter === 'status-all') {
            if (isChecked) {
                FilterState.currentMovieStatusFilters = ['status-all'];
            }
        } else {
            if (isChecked) {
                FilterState.currentMovieStatusFilters = FilterState.currentMovieStatusFilters.filter(f => f !== 'status-all');
                document.querySelector('.movies-filters input[data-filter="status-all"]').checked = false;
                FilterState.currentMovieStatusFilters.push(filter);
            }
        }
    } else {
        if (filter === 'all') {
            if (isChecked) {
                FilterState.currentMovieFilters = ['all'];
            }
        } else {
            if (isChecked) {
                FilterState.currentMovieFilters = FilterState.currentMovieFilters.filter(f => f !== 'all');
                document.querySelector('.movies-filters input[data-filter="all"]').checked = false;
                FilterState.currentMovieFilters.push(filter);
            }
        }
    }
}

// Initialize sort tabs
function initSortTabs() {
    const sortTabs = document.querySelectorAll('.sort-tab');
    const sortSlider = document.querySelector('.sort-slider');

    if (!sortTabs.length || !sortSlider) return;

    sortTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const sort = this.getAttribute('data-sort');
            
            sortTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            updateTabSliders();
            
            // Add sorting animation
            const activeContent = document.querySelector('.games-content.active');
            if (activeContent) {
                const activeGrid = activeContent.querySelector('.games-grid');
                activeGrid.classList.add('sorting');
                
                FilterState.currentSort = sort;
                
                setTimeout(() => {
                    applyCurrentFilters();
                    setTimeout(() => {
                        activeGrid.classList.remove('sorting');
                    }, 300);
                }, 300);
            }
        });
    });
}

// Apply current filters and render
function applyCurrentFilters() {
    import('./data-manager.js').then(({ currentGamesData, currentMoviesData, renderCards }) => {
        const data = FilterState.currentTab === 'games' ? [...currentGamesData] : [...currentMoviesData];
        applyFiltersAndRender(data, FilterState.currentTab);
    });
}

// Apply filters and sort to data then render
function applyFiltersAndRender(data, type) {
    const filteredData = applyFiltersAndSort(data, type);
    const container = type === 'games' 
        ? document.querySelector('#games-content .games-grid') 
        : document.querySelector('#movies-content .games-grid');
        
    if (container) {
        import('./data-manager.js').then(({ renderCards }) => {
            renderCards(container, filteredData, type === 'games' ? 'game' : 'movie');
        });
    }
}

// Apply filters and sort to data
function applyFiltersAndSort(data, type) {
    const currentFilters = type === 'games' ? FilterState.currentGameFilters : FilterState.currentMovieFilters;
    const currentStatusFilters = type === 'games' ? FilterState.currentGameStatusFilters : FilterState.currentMovieStatusFilters;
    
    let filteredData = [...data];
    
    // Apply status filter
    if (!currentStatusFilters.includes('status-all')) {
        filteredData = filteredData.filter(item => currentStatusFilters.includes(item.status));
    }
    
    // Apply genre filter
    if (!currentFilters.includes('all')) {
        filteredData = filteredData.filter(item => 
            item.genres.some(genre => currentFilters.includes(genre))
        );
    }
    
    // Apply sorting
    if (FilterState.currentSort === 'name') {
        filteredData.sort((a, b) => a.title.localeCompare(b.title));
    } else if (FilterState.currentSort === 'rating') {
        filteredData.sort((a, b) => b.rating - a.rating);
    }
    
    return filteredData;
}

// Initialize grid toggle
function initGridToggle() {
    const toggleGamesBtn = document.getElementById('toggle-games');
    let isExpanded = false;

    if (!toggleGamesBtn) return;

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

// Update tab sliders position
function updateTabSliders() {
    const gamesTabElement = document.querySelector('.games-tabs');
    const gamesTabSlider = document.querySelector('.tab-slider');
    const sortTabElement = document.querySelector('.sort-tabs');
    const sortTabSlider = document.querySelector('.sort-slider');
    
    if (gamesTabElement && gamesTabSlider) {
        const activeTab = gamesTabElement.querySelector('.active');
        if (activeTab) {
            gamesTabSlider.style.width = `${activeTab.offsetWidth}px`;
            gamesTabSlider.style.left = `${activeTab.offsetLeft}px`;
        }
    }
    
    if (sortTabElement && sortTabSlider) {
        const activeSortTab = sortTabElement.querySelector('.active');
        if (activeSortTab) {
            sortTabSlider.style.width = `${activeSortTab.offsetWidth}px`;
            sortTabSlider.style.left = `${activeSortTab.offsetLeft}px`;
        }
    }
}

// Hologram interface functionality
export function initHologramInterface() {
    initOrbitalInteractivity();
    initMainPhotosInteractivity();
    
    console.log('🎮 Голографическая система инициализирована');
}

// Инициализация взаимодействия с орбитальными узлами
function initOrbitalInteractivity() {
    const nodes = document.querySelectorAll('.orbital-node');
    
    nodes.forEach(node => {
        const userId = node.getAttribute('data-user');
        
        node.addEventListener('mouseenter', function() {
            showHologramCard(userId);
            highlightOrbitalNode(this);
        });
        
        node.addEventListener('mouseleave', function() {
            hideHologramCard();
            unhighlightOrbitalNode(this);
        });
        
        node.addEventListener('click', function(e) {
            e.stopPropagation();
            // Дополнительные действия при клике
            console.log(`Selected: ${userId}`);
        });
    });
}

// Инициализация взаимодействия с основными фото
function initMainPhotosInteractivity() {
    const mainPhotos = document.querySelectorAll('.main-photo');
    
    mainPhotos.forEach(photo => {
        photo.addEventListener('click', function() {
            const isKsusha = this.classList.contains('ksusha-photo');
            showMainCharacterCard(isKsusha ? 'ksusha' : 'tetla');
        });
        
        photo.addEventListener('mouseenter', function() {
            this.style.zIndex = '15';
        });
        
        photo.addEventListener('mouseleave', function() {
            this.style.zIndex = '10';
        });
    });
}

// Показать голографическую карточку
function showHologramCard(userId) {
    const userData = subscribersData[userId];
    if (!userData) return;
    
    const card = document.getElementById('hologramCard');
    const cardFrame = document.getElementById('cardFrame');
    
    // Заполняем данные карточки
    document.getElementById('cardAvatar').src = userData.avatar;
    document.getElementById('cardName').textContent = userData.name;
    document.getElementById('cardRank').textContent = userData.role;
    document.getElementById('cardDescription').textContent = userData.description;
    document.getElementById('statAttack').textContent = userData.stats.attack;
    document.getElementById('statDefense').textContent = userData.stats.defense;
    document.getElementById('statSpeed').textContent = userData.stats.speed;
    document.getElementById('statAccuracy').textContent = userData.stats.accuracy;
    document.getElementById('cardAbility').querySelector('.ability-text').textContent = userData.ability;
    
    // Устанавливаем цветовую тему
    card.style.borderColor = userData.color;
    cardFrame.style.borderColor = userData.color;
    cardFrame.style.boxShadow = `0 0 20px ${userData.color}`;
    
    // Анимируем progress bars
    animateProgressBars(userData.stats);
    
    // Показываем карточку
    card.classList.add('show');
}

// Скрыть голографическую карточку
function hideHologramCard() {
    const card = document.getElementById('hologramCard');
    card.classList.remove('show');
}

// Анимировать progress bars
function animateProgressBars(stats) {
    setTimeout(() => {
        document.querySelectorAll('.stat-progress').forEach(progress => {
            const statType = progress.closest('.stat-row').querySelector('.stat-label').textContent.toLowerCase();
            let value = 0;
            
            switch(statType) {
                case 'атака': value = stats.attack; break;
                case 'защита': value = stats.defense; break;
                case 'скорость': value = stats.speed; break;
                case 'точность': value = stats.accuracy; break;
            }
            
            progress.style.width = `${value}%`;
            progress.setAttribute('data-value', value);
        });
    }, 300);
}

// Подсветить орбитальный узел
function highlightOrbitalNode(node) {
    node.style.transform = 'scale(1.4) translateZ(50px)';
    node.style.zIndex = '25';
    node.style.filter = 'brightness(1.3)';
}

// Убрать подсветку орбитального узла
function unhighlightOrbitalNode(node) {
    node.style.transform = '';
    node.style.zIndex = '5';
    node.style.filter = '';
}

// Показать карточку главного персонажа
function showMainCharacterCard(character) {
    const card = document.getElementById('hologramCard');
    const cardFrame = document.getElementById('cardFrame');
    
    if (character === 'ksusha') {
        document.getElementById('cardAvatar').src = 'assets/images/ksusha.jpg';
        document.getElementById('cardName').textContent = 'Ksusha Sher';
        document.getElementById('cardRank').textContent = 'Главный стример';
        document.getElementById('cardDescription').textContent = 'Создатель этого удивительного комьюнити. Профессиональный стример с более чем 3 годами опыта. Специализируется на играх и создании качественного развлекательного контента.';
        document.getElementById('statAttack').textContent = '95';
        document.getElementById('statDefense').textContent = '88';
        document.getElementById('statSpeed').textContent = '92';
        document.getElementById('statAccuracy').textContent = '98';
        document.getElementById('cardAbility').querySelector('.ability-text').textContent = 'Создание контента';
        
        card.style.borderColor = '#ff2d95';
        cardFrame.style.borderColor = '#ff2d95';
    } else {
        document.getElementById('cardAvatar').src = 'assets/images/tetla.jpg';
        document.getElementById('cardName').textContent = 'TetlaBot';
        document.getElementById('cardRank').textContent = 'Помощник стримера';
        document.getElementById('cardDescription').textContent = 'Искусственный интеллект, помогающий в модерации чата и автоматизации процессов на стриме. Всегда на страже порядка и развлечений.';
        document.getElementById('statAttack').textContent = '82';
        document.getElementById('statDefense').textContent = '95';
        document.getElementById('statSpeed').textContent = '99';
        document.getElementById('statAccuracy').textContent = '100';
        document.getElementById('cardAbility').querySelector('.ability-text').textContent = 'Автоматизация';
        
        card.style.borderColor = '#39ff14';
        cardFrame.style.borderColor = '#39ff14';
    }
    
    animateProgressBars({
        attack: parseInt(document.getElementById('statAttack').textContent),
        defense: parseInt(document.getElementById('statDefense').textContent),
        speed: parseInt(document.getElementById('statSpeed').textContent),
        accuracy: parseInt(document.getElementById('statAccuracy').textContent)
    });
    
    card.classList.add('show');
}

// Card number copy functionality
function initCardCopy() {
    const cardNumberElement = document.getElementById('card-number');
    if (cardNumberElement) {
        cardNumberElement.addEventListener('click', copyCardNumber);
    }
}

// Copy card number to clipboard
function copyCardNumber() {
    const cardNumber = '4276 1805 5058 1960';
    
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''))
        .then(() => {
            const tooltip = document.getElementById('copy-tooltip');
            if (tooltip) {
                const originalText = tooltip.textContent;
                tooltip.textContent = 'Скопировано!';
                tooltip.style.color = '#39ff14';
                
                setTimeout(() => {
                    tooltip.textContent = originalText;
                    tooltip.style.color = '';
                }, 2000);
            }
            
            // Visual feedback
            const cardElement = document.getElementById('card-number');
            if (cardElement) {
                cardElement.style.background = 'rgba(57, 255, 20, 0.2)';
                setTimeout(() => {
                    cardElement.style.background = '';
                }, 500);
            }
        })
        .catch(err => {
            console.error('Ошибка при копировании: ', err);
            const tooltip = document.getElementById('copy-tooltip');
            if (tooltip) {
                tooltip.textContent = 'Ошибка копирования';
                tooltip.style.color = '#ff6464';
                setTimeout(() => {
                    tooltip.textContent = 'Нажмите чтобы скопировать';
                    tooltip.style.color = '';
                }, 2000);
            }
        });
}

// Listen for card click events from data manager
document.addEventListener('cardClick', (event) => {
    const { item, type } = event.detail;
    showItemModal(item, type);
});

// Show item modal (could be expanded for games/movies details)
function showItemModal(item, type) {
    console.log(`Opening ${type} modal:`, item.title);
    // Modal implementation can be added here
    // For now, just log to console
}

// Export filter state for external use
export { FilterState };
