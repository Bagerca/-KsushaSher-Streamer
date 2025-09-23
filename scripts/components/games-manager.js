import { DOM, Api, Time, NumberUtils } from '../utils/helpers.js';
import { MESSAGES, CSS_CLASSES, GAMES_CONFIG } from '../utils/constants.js';

export class GamesManager {
    constructor(containerId) {
        this.container = DOM.getElement(containerId);
        this.games = [];
        this.movies = [];
        this.currentCategory = 'games';
        this.filteredItems = [];
        this.searchTerm = '';
        this.currentFilter = 'all';
        this.sortBy = 'title';
        this.sortOrder = 'asc';
        this.isLoading = false;
        this.currentPage = 1;
    }

    async init() {
        if (!this.container) {
            console.error('Games container not found:', this.container);
            return;
        }

        await this.loadData();
        this.render();
        this.setupEventListeners();
        
        console.log('🎮 GamesManager initialized successfully');
    }

    async loadData() {
        this.setLoading(true);

        try {
            const [gamesData, moviesData] = await Promise.all([
                Api.fetchData('/data/games.json'),
                Api.fetchData('/data/movies.json')
            ]);

            this.games = gamesData || [];
            this.movies = moviesData || [];
            this.filterItems();

            console.log(`📊 Loaded: ${this.games.length} games, ${this.movies.length} movies`);

        } catch (error) {
            console.error('Error loading games/movies data:', error);
            this.games = [];
            this.movies = [];
        }

        this.setLoading(false);
    }

    setLoading(loading) {
        this.isLoading = loading;
        if (this.container) {
            if (loading) {
                DOM.addClass(this.container, CSS_CLASSES.loading);
            } else {
                DOM.removeClass(this.container, CSS_CLASSES.loading);
            }
        }
    }

    setupEventListeners() {
        // Переключение категорий
        const categoryButtons = DOM.getElements('[data-category]');
        categoryButtons.forEach(button => {
            DOM.on(button, 'click', (e) => {
                this.switchCategory(e.target.dataset.category);
            });
        });

        // Поиск
        const searchInput = DOM.getElement('#search-input');
        if (searchInput) {
            DOM.on(searchInput, 'input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Фильтры
        const filterButtons = DOM.getElements('[data-filter]');
        filterButtons.forEach(button => {
            DOM.on(button, 'click', (e) => {
                this.applyFilter(e.target.dataset.filter);
            });
        });

        // Сортировка
        const sortSelect = DOM.getElement('#sort-select');
        if (sortSelect) {
            DOM.on(sortSelect, 'change', (e) => {
                this.applySort(e.target.value);
            });
        }

        // Обработчики для пагинации (делегирование событий)
        DOM.on(this.container, 'click', (e) => {
            if (e.target.classList.contains('pagination-next')) {
                e.preventDefault();
                this.nextPage();
            } else if (e.target.classList.contains('pagination-prev')) {
                e.preventDefault();
                this.previousPage();
            }
        });
    }

    switchCategory(category) {
        if (this.currentCategory === category) return;

        this.currentCategory = category;
        this.currentPage = 1;
        this.filterItems();
        this.render();

        // Обновляем активную кнопку
        const buttons = DOM.getElements('[data-category]');
        buttons.forEach(btn => DOM.removeClass(btn, CSS_CLASSES.active));
        const activeBtn = DOM.getElement(`[data-category="${category}"]`);
        if (activeBtn) {
            DOM.addClass(activeBtn, CSS_CLASSES.active);
        }
    }

    handleSearch(term) {
        this.searchTerm = term.toLowerCase().trim();
        this.currentPage = 1;
        this.filterItems();
        this.render();
    }

    applyFilter(filterType) {
        this.currentFilter = filterType;
        this.currentPage = 1;
        this.filterItems();
        this.render();
    }

    applySort(sortType) {
        const [field, order] = sortType.split('_');
        this.sortBy = field;
        this.sortOrder = order;
        this.filterItems();
        this.render();
    }

    filterItems() {
        let items = this.currentCategory === 'games' ? [...this.games] : [...this.movies];
        
        // Поиск
        if (this.searchTerm) {
            items = items.filter(item => 
                item.title.toLowerCase().includes(this.searchTerm) ||
                (item.description && item.description.toLowerCase().includes(this.searchTerm)) ||
                (item.genre && item.genre.toLowerCase().includes(this.searchTerm))
            );
        }

        // Фильтрация по жанру
        if (this.currentFilter !== 'all') {
            items = items.filter(item => item.genre === this.currentFilter);
        }

        // Сортировка
        items.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            if (this.sortBy === 'rating') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredItems = items;
    }

    render() {
        if (!this.container) return;

        if (this.isLoading) {
            DOM.setHTML(this.container, this.createLoadingHTML());
            return;
        }

        if (this.filteredItems.length === 0) {
            DOM.setHTML(this.container, this.createEmptyHTML());
            return;
        }

        DOM.setHTML(this.container, this.createItemsHTML());
    }

    createLoadingHTML() {
        return `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${MESSAGES.loading}</p>
            </div>
        `;
    }

    createEmptyHTML() {
        return `
            <div class="empty-state">
                <p>${MESSAGES.noData}</p>
                ${this.searchTerm ? '<p>Попробуйте изменить поисковый запрос</p>' : ''}
            </div>
        `;
    }

    createItemsHTML() {
        const startIndex = (this.currentPage - 1) * GAMES_CONFIG.itemsPerPage;
        const paginatedItems = this.filteredItems.slice(startIndex, startIndex + GAMES_CONFIG.itemsPerPage);

        const itemsHTML = paginatedItems.map((item) => `
            <div class="item-card" data-id="${item.id}">
                <div class="item-image">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.title}" loading="lazy">` : 
                        '<div class="item-image-placeholder">🎮</div>'
                    }
                </div>
                <div class="item-content">
                    <h3 class="item-title">${item.title}</h3>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                    
                    <div class="item-meta">
                        ${item.genre ? `<span class="item-genre">${item.genre}</span>` : ''}
                        ${item.platform ? `<span class="item-platform">${item.platform}</span>` : ''}
                        ${item.rating ? `<div class="item-rating">⭐ ${item.rating}/10</div>` : ''}
                        ${item.duration ? `<div class="item-duration">⏱ ${Time.formatDuration(item.duration)}</div>` : ''}
                    </div>
                    
                    ${item.tags && item.tags.length > 0 ? `
                        <div class="item-tags">
                            ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        return `
            <div class="items-grid">
                ${itemsHTML}
            </div>
            ${this.createPaginationHTML()}
        `;
    }

    createPaginationHTML() {
        const totalPages = Math.ceil(this.filteredItems.length / GAMES_CONFIG.itemsPerPage);
        if (totalPages <= 1) return '';

        return `
            <div class="pagination">
                <button class="pagination-btn pagination-prev ${this.currentPage === 1 ? 'disabled' : ''}" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                    ← Назад
                </button>
                
                <span class="pagination-info">
                    Страница ${this.currentPage} из ${totalPages}
                </span>
                
                <button class="pagination-btn pagination-next ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Вперед →
                </button>
            </div>
        `;
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredItems.length / GAMES_CONFIG.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
        }
    }

    getItemById(id) {
        const items = this.currentCategory === 'games' ? this.games : this.movies;
        return items.find(item => item.id === id);
    }

    async refresh() {
        await this.loadData();
        this.render();
    }

    destroy() {
        const searchInput = DOM.getElement('#search-input');
        if (searchInput) {
            DOM.off(searchInput, 'input', this.handleSearch);
        }
    }
}
