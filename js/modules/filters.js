// Filtering and sorting functionality
import { renderCards } from './renderers.js';
import { setTabSliderPosition } from './ui.js';
import { loadGames, loadMovies, currentGamesData, currentMoviesData } from './loaders.js';

// Filter and sort state
let currentGameFilters = ['all'];
let currentGameStatusFilters = ['status-all'];
let currentMovieFilters = ['all'];
let currentMovieStatusFilters = ['status-all'];
let currentSort = 'name';
let currentTab = 'games';

export function initializeFilters() {
    // Wait for DOM to be fully ready
    setTimeout(() => {
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
        setTabSliderPosition(document.querySelector('.games-tabs'), document.querySelector('.tab-slider'));
        setTabSliderPosition(document.querySelector('.sort-tabs'), document.querySelector('.sort-slider'));
        
        console.log('🎛️ Filters initialized');
    }, 300);
}

// Initialize tab switching between games and movies
function initTabSwitching() {
    const gamesTabs = document.querySelectorAll('.games-tab');
    const gamesContent = document.getElementById('games-content');
    const moviesContent = document.getElementById('movies-content');
    const tabSlider = document.querySelector('.tab-slider');

    if (gamesTabs.length > 0 && tabSlider && gamesContent && moviesContent) {
        gamesTabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                gamesTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                setTabSliderPosition(document.querySelector('.games-tabs'), tabSlider);
                
                const previousContent = document.querySelector('.games-content.active');
                if (previousContent) {
                    previousContent.classList.add('fade-out');
                }
                
                currentTab = tab.dataset.tab;
                
                setTimeout(async () => {
                    if (currentTab === 'movies') {
                        await switchToMoviesTab(previousContent);
                    } else {
                        await switchToGamesTab(previousContent);
                    }
                }, 300);
            });
        });
    }
}

// Switch to movies tab
async function switchToMoviesTab(previousContent) {
    document.querySelector('.games-filters').style.display = 'none';
    document.querySelector('.movies-filters').style.display = 'block';
    
    const gamesContent = document.getElementById('games-content');
    const moviesContent = document.getElementById('movies-content');
    
    gamesContent.classList.remove('active');
    moviesContent.classList.add('fade-in');
    
    // Load movies if not loaded
    let moviesData = currentMoviesData;
    if (moviesData.length === 0) {
        moviesData = await loadMovies();
    }
    
    // Apply current filters and sort
    const filteredData = applyFiltersAndSort(moviesData, 'movies');
    const container = document.querySelector('#movies-content .games-grid');
    renderCards(container, filteredData, 'movie');
    
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
    
    // Load games if not loaded
    let gamesData = currentGamesData;
    if (gamesData.length === 0) {
        gamesData = await loadGames();
    }
    
    // Apply current filters and sort
    const filteredData = applyFiltersAndSort(gamesData, 'games');
    const container = document.querySelector('#games-content .games-grid');
    renderCards(container, filteredData, 'game');
    
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
    const filterOptions = document.querySelectorAll('.filter-option input');

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

    // Filter option event listeners
    if (filterOptions.length > 0) {
        filterOptions.forEach(option => {
            option.addEventListener('change', function() {
                handleFilterChange(this);
            });
        });
    }
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
    
    sortAndFilterData();
}

// Update game filters
function updateGameFilters(filter, isStatusFilter, isChecked) {
    if (isStatusFilter) {
        if (filter === 'status-all') {
            if (isChecked) {
                currentGameStatusFilters = ['status-all'];
                document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                    if (opt.getAttribute('data-filter') !== 'status-all' && 
                        ['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                        opt.checked = false;
                    }
                });
            }
        } else {
            if (isChecked) {
                currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== 'status-all');
                document.querySelector('.games-filters input[data-filter="status-all"]').checked = false;
                currentGameStatusFilters.push(filter);
            } else {
                currentGameStatusFilters = currentGameStatusFilters.filter(f => f !== filter);
            }
        }
    } else {
        if (filter === 'all') {
            if (isChecked) {
                currentGameFilters = ['all'];
                document.querySelectorAll('.games-filters input[data-type="games"]').forEach(opt => {
                    if (opt !== this && !['status-all', 'completed', 'playing', 'dropped', 'on-hold'].includes(opt.getAttribute('data-filter'))) {
                        opt.checked = false;
                    }
                });
            }
        } else {
            if (isChecked) {
                currentGameFilters = currentGameFilters.filter(f => f !== 'all');
                document.querySelector('.games-filters input[data-filter="all"]').checked = false;
                currentGameFilters.push(filter);
            } else {
                currentGameFilters = currentGameFilters.filter(f => f !== filter);
            }
        }
    }
}

// Update movie filters
function updateMovieFilters(filter, isStatusFilter, isChecked) {
    // Similar logic for movies (can be expanded)
    if (isStatusFilter) {
        if (filter === 'status-all') {
            if (isChecked) {
                currentMovieStatusFilters = ['status-all'];
                // Uncheck other status filters
            }
        } else {
            if (isChecked) {
                currentMovieStatusFilters = currentMovieStatusFilters.filter(f => f !== 'status-all');
                document.querySelector('.movies-filters input[data-filter="status-all"]').checked = false;
                currentMovieStatusFilters.push(filter);
            }
        }
    } else {
        if (filter === 'all') {
            if (isChecked) {
                currentMovieFilters = ['all'];
                // Uncheck other genre filters
            }
        } else {
            if (isChecked) {
                currentMovieFilters = currentMovieFilters.filter(f => f !== 'all');
                document.querySelector('.movies-filters input[data-filter="all"]').checked = false;
                currentMovieFilters.push(filter);
            }
        }
    }
}

// Initialize sort tabs
function initSortTabs() {
    const sortTabs = document.querySelectorAll('.sort-tab');
    const sortSlider = document.querySelector('.sort-slider');

    if (sortTabs.length > 0 && sortSlider) {
        sortTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const sort = this.getAttribute('data-sort');
                
                sortTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                setTabSliderPosition(document.querySelector('.sort-tabs'), sortSlider);
                
                // Add sorting animation
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
}

// Main filtering and sorting function
export function sortAndFilterData() {
    const data = currentTab === 'games' ? [...currentGamesData] : [...currentMoviesData];
    const filteredData = applyFiltersAndSort(data, currentTab);
    
    const container = currentTab === 'games' 
        ? document.querySelector('#games-content .games-grid') 
        : document.querySelector('#movies-content .games-grid');
        
    if (container) {
        renderCards(container, filteredData, currentTab === 'games' ? 'game' : 'movie');
    }
}

// Apply filters and sort to data
function applyFiltersAndSort(data, type) {
    const currentFilters = type === 'games' ? currentGameFilters : currentMovieFilters;
    const currentStatusFilters = type === 'games' ? currentGameStatusFilters : currentMovieStatusFilters;
    
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
    if (currentSort === 'name') {
        filteredData.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'rating') {
        filteredData.sort((a, b) => b.rating - a.rating);
    }
    
    return filteredData;
}

// Initialize grid toggle
function initGridToggle() {
    const toggleGamesBtn = document.getElementById('toggle-games');
    let isExpanded = false;

    if (toggleGamesBtn) {
        toggleGamesBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            const activeContent = document.querySelector('.games-content.active');
            if (activeContent) {
                const activeGrid = activeContent.querySelector('.games-grid');
                
                if (isExpanded) {
                    activeGrid.classList.add('expanded');
                    toggleGamesBtn.textContent = 'Свернуть';
                } else {
                    activeGrid.classList.remove('expanded');
                    toggleGamesBtn.textContent = 'Развернуть';
                    
                    // Scroll back to section
                    document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
}
