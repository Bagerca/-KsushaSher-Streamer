/* js/archive/SearchController.js */
import EventBus from '../event-bus.js';
import { STATUS_MAP } from '../media-store.js';
import { getYouTubeId } from '../utils.js';

export class SearchController {
    constructor(store) {
        this.store = store;
        this.els = {
            input: document.getElementById('archive-search'),
            module: document.querySelector('.search-module')
        };
        this.debounceTimer = null;
        this.init();
    }

    init() {
        if (!this.els.input || !this.els.module) return;

        this.suggestionsBox = document.createElement('div');
        this.suggestionsBox.className = 'search-suggestions';
        this.els.module.appendChild(this.suggestionsBox);

        this.els.input.addEventListener('input', (e) => this.handleInput(e.target.value));
        this.els.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                EventBus.emit('PLAY_SOUND', 'click');
                this.toggleSugg(false);
                this.store.setSearchQuery(this.els.input.value);
            }
        });

        this.suggestionsBox.addEventListener('click', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (item) {
                EventBus.emit('PLAY_SOUND', 'click');
                const title = item.dataset.title;
                this.els.input.value = title;
                this.toggleSugg(false);
                this.store.setSearchQuery(title);
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.els.module.contains(e.target)) this.toggleSugg(false);
        });

        EventBus.on('MEDIA_STORE_LOADED', () => { this.els.input.value = ''; });
    }

    toggleSugg(isOpen) {
        this.suggestionsBox.classList.toggle('active', isOpen);
        this.els.module.classList.toggle('suggestions-open', isOpen);
    }

    handleInput(query) {
        clearTimeout(this.debounceTimer);

        if (query.length < 1) {
            this.toggleSugg(false);
            if (this.store.searchQuery !== '') this.store.setSearchQuery('');
            return;
        }

        this.debounceTimer = setTimeout(() => {
            const matches = this.store.getSearchSuggestions(query);
            this.renderSuggestions(matches, query);
            this.toggleSugg(true);
        }, 200);
    }

    renderSuggestions(matches, query) {
        if (matches.length === 0) {
            this.suggestionsBox.innerHTML = `<div class="suggestion-empty"><i class="far fa-sad-tear"></i><span>По запросу "${query}" ничего не найдено</span></div>`;
            return;
        }

        const cleanQuery = query.toLowerCase();
        this.suggestionsBox.innerHTML = matches.map(item => {
            const titleText = item.title || "";
            const index = titleText.toLowerCase().indexOf(cleanQuery);
            let titleHtml = titleText;
            if (index !== -1) {
                titleHtml = titleText.substring(0, index) + 
                           `<mark class="search-match">${titleText.substring(index, index + query.length)}</mark>` + 
                           titleText.substring(index + query.length);
            }

            let thumbUrl = item.image;
            if (item.format === 'collection' && item.items && item.items.length > 0) {
                 thumbUrl = thumbUrl || item.items[0].image;
            } else if (item.videos && item.videos.length > 0) {
                 thumbUrl = `https://img.youtube.com/vi/${getYouTubeId(typeof item.videos[0] === 'string' ? item.videos[0] : item.videos[0].url)}/mqdefault.jpg`;
            }

            return `
                <div class="suggestion-item" data-title="${item.title}">
                    <img src="${thumbUrl}" class="sugg-thumb" onerror="this.src='https://via.placeholder.com/6x85'">
                    <div class="sugg-info">
                        <span class="sugg-title">${titleHtml}</span>
                        <div class="sugg-meta">
                            <span class="sugg-status" data-status="${item.status}">${STATUS_MAP[item.status] || item.status}</span>
                            <span class="sugg-rating"><i class="fas fa-star"></i> ${item.rating || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}