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
    alexey: {
        name: "Алексей",
        role: "Главный модератор",
        avatar: "https://i.redd.it/f2jbra8kopg81.jpg",
        description: "Помогает поддерживать порядок в чате с самого первого дня. Всегда справедлив и внимателен к комьюнити. Организует ивенты и конкурсы.",
        stats: { months: "24+", messages: "8.7K", streams: "156" }
    },
    maria: {
        name: "Мария", 
        role: "Легенда комьюнити",
        avatar: "https://img.championat.com/s/732x488/news/big/a/c/dzhejson-devid-frenk_16690405271591211867.jpg",
        description: "С нами с первых трансляций. Всегда поддерживает теплую атмосферу и помогает новичкам освоиться. Настоящая душа нашего сообщества.",
        stats: { months: "32+", messages: "12.4K", streams: "210" }
    },
    dmitry: {
        name: "Дмитрий",
        role: "Технический специалист",
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9DeuKODbRaE6Gdhem6unM5GKOPKyGXBqCAw&s",
        description: "Помогал с настройкой оборудования и делился профессиональными советами по стримингу. Всегда готов помочь с техническими вопросами.",
        stats: { months: "18+", messages: "3.2K", streams: "89" }
    },
    olga: {
        name: "Ольга",
        role: "Талантливый художник", 
        avatar: "https://static.wikia.nocookie.net/powerrangers/images/5/51/17-blue.jpg/revision/latest?cb=20170326191809&path-prefix=ru",
        description: "Создала уникальный стиль для канала и продолжает радовать нас потрясающими работами. Её арты стали визитной карточкой сообщества.",
        stats: { months: "14+", messages: "2.1K", streams: "67" }
    },
    ivan: {
        name: "Иван",
        role: "Активный саппорт",
        avatar: "https://static.wikia.nocookie.net/powerrangers/images/d/d9/17-red.jpg/revision/latest?cb=20170325124238&path-prefix=ru",
        description: "Постоянно поддерживает канал и помогает развиваться. Его донаты и конструктивные предложения помогают делать контент лучше.",
        stats: { months: "21+", messages: "5.6K", streams: "134" }
    },
    sergey: {
        name: "Сергей",
        role: "Ветеран сообщества",
        avatar: "https://avatars.mds.yandex.net/get-shedevrum/12733905/72aaedc8d4d311eea810fe19746b188b/orig",
        description: "Присоединился одним из первых и с тех пор не пропустил почти ни одного стрима. Его опыт и мудрость помогают сообществу расти.",
        stats: { months: "36+", messages: "15.8K", streams: "245" }
    }
};

// Initialize all UI components
export function initializeUI() {
    initMobileMenu();
    initHeaderHover();
    initFilters();
    initHologramInterface();
    initCardCopy();
    initSmoothScroll();
    
    console.log('🎨 UI components initialized successfully');
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');

    if (!mobileMenu || !navMenu) return;

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
}

// Header hover functionality
function initHeaderHover() {
    const header = document.querySelector('header');
    if (!header) return;

    // Create hover zone at top of page
    const hoverZone = document.createElement('div');
    hoverZone.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 30px;
        background: transparent;
        z-index: 999;
        pointer-events: auto;
    `;
    document.body.appendChild(hoverZone);

    let hideTimeout;
    let isHeaderHovered = false;

    // Show header on hover zone enter
    hoverZone.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        header.classList.add('header-expanded');
    });

    // Hide header on hover zone leave
    hoverZone.addEventListener('mouseleave', () => {
        if (!isHeaderHovered) {
            hideTimeout = setTimeout(() => {
                header.classList.remove('header-expanded');
            }, 500);
        }
    });

    // Track header hover
    header.addEventListener('mouseenter', () => {
        isHeaderHovered = true;
        clearTimeout(hideTimeout);
        header.classList.add('header-expanded');
    });

    header.addEventListener('mouseleave', () => {
        isHeaderHovered = false;
        hideTimeout = setTimeout(() => {
            header.classList.remove('header-expanded');
        }, 500);
    });

    // Mobile handling
    if (window.innerWidth <= 768) {
        hoverZone.remove();
        header.classList.add('header-expanded');
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            hoverZone.remove();
            header.classList.add('header-expanded');
        } else {
            if (!document.body.contains(hoverZone)) {
                document.body.appendChild(hoverZone);
            }
        }
    });
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
                    top: targetElement.offsetTop - 80,
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
    initSubscriberInteractivity();
    initHeroImageEasterEgg();
}

// Initialize subscriber interactivity
function initSubscriberInteractivity() {
    const nodes = document.querySelectorAll('.data-node');
    
    nodes.forEach(node => {
        const userId = node.getAttribute('data-user');
        
        node.addEventListener('mouseenter', function() {
            showSubscriberInfo(userId);
        });
        
        node.addEventListener('mouseleave', function() {
            hideSubscriberInfo();
        });
    });
}

// Show subscriber information
function showSubscriberInfo(userId) {
    const userData = subscribersData[userId];
    if (!userData) return;
    
    const infoPanel = document.getElementById('subscriberInfo');
    document.getElementById('subscriberName').textContent = userData.name;
    document.getElementById('subscriberRole').textContent = userData.role;
    document.getElementById('subscriberAvatar').src = userData.avatar;
    document.getElementById('subscriberDetails').textContent = userData.description;
    document.getElementById('statMonths').textContent = userData.stats.months;
    document.getElementById('statMessages').textContent = userData.stats.messages;
    document.getElementById('statStreams').textContent = userData.stats.streams;
    
    infoPanel.classList.add('show');
}

// Hide subscriber information
function hideSubscriberInfo() {
    const infoPanel = document.getElementById('subscriberInfo');
    infoPanel.classList.remove('show');
}

// Hero image easter egg
function initHeroImageEasterEgg() {
    const mainPhoto = document.querySelector('.hologram-main');
    let clickCount = 0;

    if (mainPhoto) {
        mainPhoto.addEventListener('click', (e) => {
            e.stopPropagation();
            clickCount++;
            
            if (clickCount >= 7) {
                // Could add special effect here
                console.log('🎉 Easter egg activated!');
                clickCount = 0;
            }
        });
    }
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
