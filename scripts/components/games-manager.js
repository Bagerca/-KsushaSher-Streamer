import { DOM, Api, Storage } from '../utils/helpers.js';
import { MESSAGES, CSS_CLASSES } from '../utils/constants.js';

export class GamesManager {
    constructor(containerId) {
        this.container = DOM.getElement(containerId);
        this.games = [];
        this.movies = [];
        this.currentCategory = 'games';
        this.filteredItems = [];
        this.searchTerm = '';
        this.isLoading = false;
    }

    async init() {
        await this.loadData();
        this.render();
        this.setupEventListeners();
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

        } catch (error) {
            console.error('Error loading data:', error);
            this.games = [];
            this.movies = [];
        }

        this.setLoading(false);
    }

    setLoading(loading) {
        this.isLoading = loading;
        DOM.toggleClass(this.container, CSS_CLASSES.loading, loading);
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
    }

    switchCategory(category) {
        if (this.currentCategory === category) return;

        this.currentCategory = category;
        this.filterItems();
        this.render();

        // Обновляем активную кнопку
        const buttons = DOM.getElements('[data-category]');
        buttons.forEach(btn => DOM.removeClass(btn, CSS_CLASSES.active));
        const activeBtn = DOM.getElement(`[data-category="${category}"]`);
        DOM.addClass(activeBtn, CSS_CLASSES.active);
    }

    handleSearch(term) {
        this.searchTerm = term.toLowerCase().trim();
        this.filterItems();
        this.render();
    }

    applyFilter(filterType) {
        console.log('Applying filter:', filterType);
        this.filterItems();
        this.render();
    }

    filterItems() {
        const items = this.currentCategory === 'games' ? this.games : this.movies;
        
        this.filteredItems = items.filter(item => {
            const matchesSearch = !this.searchTerm || 
                item.title.toLowerCase().includes(this.searchTerm) ||
                (item.description && item.description.toLowerCase().includes(this.searchTerm));
            
            return matchesSearch;
        });
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
        const itemsHTML = this.filteredItems.map((item, index) => `
            <div class="item-card" data-id="${item.id}">
                <div class="item-image">
                    ${item.image ? `<img src="${item.image}" alt="${item.title}">` : ''}
                </div>
                <div class="item-content">
                    <h3 class="item-title">${item.title}</h3>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                    ${item.genre ? `<span class="item-genre">${item.genre}</span>` : ''}
                    ${item.platform ? `<span class="item-platform">${item.platform}</span>` : ''}
                    ${item.rating ? `<div class="item-rating">⭐ ${item.rating}</div>` : ''}
                </div>
            </div>
        `).join('');

        return `
            <div class="items-grid">
                ${itemsHTML}
            </div>
        `;
    }

    addGame(gameData) {
        this.games.push({
            id: Date.now(),
            ...gameData
        });
        this.filterItems();
        this.render();
        this.saveGames();
    }

    addMovie(movieData) {
        this.movies.push({
            id: Date.now(),
            ...movieData
        });
        this.filterItems();
        this.render();
        this.saveMovies();
    }

    async saveGames() {
        try {
            await Api.saveData('/data/games.json', this.games);
        } catch (error) {
            console.error('Error saving games:', error);
        }
    }

    async saveMovies() {
        try {
            await Api.saveData('/data/movies.json', this.movies);
        } catch (error) {
            console.error('Error saving movies:', error);
        }
    }

    getItemById(id) {
        const items = this.currentCategory === 'games' ? this.games : this.movies;
        return items.find(item => item.id === id);
    }

    destroy() {
        const searchInput = DOM.getElement('#search-input');
        if (searchInput) {
            DOM.off(searchInput, 'input', this.handleSearch);
        }
    }
}
