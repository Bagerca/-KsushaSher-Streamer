/* js/archive/SearchController.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';
import { SearchEngine } from '../services/SearchEngine.js';
import { optimizeImageUrl } from '../utils.js';

export class SearchController {
    constructor() {
        this.els = {
            input: document.getElementById('archive-search'),
            module: document.getElementById('search-module'),
            iconDefault: document.getElementById('search-icon-default'),
            iconLoading: document.getElementById('search-icon-loading'),
            hotkeyHint: document.getElementById('search-hotkey-hint')
        };
        this.debounceTimer = null;
        this.currentMatches = [];
        this.selectedIndex = -1;

        this.init();
    }

    init() {
        if (!this.els.input || !this.els.module) return;

        this.suggestionsBox = document.createElement('div');
        this.suggestionsBox.className = 'search-suggestions';
        this.els.module.appendChild(this.suggestionsBox);

        this.els.input.addEventListener('input', (e) => this.handleInput(e.target.value));
        this.els.input.addEventListener('keydown', (e) => this.handleKeyDown(e));

        if (this.els.iconDefault) {
            this.els.iconDefault.addEventListener('click', () => {
                if (this.els.input.value.trim().length > 0) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    this.executeSearch(this.els.input.value);
                }
            });
        }

        this.suggestionsBox.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.suggestion-item');
            if (itemEl) {
                const index = parseInt(itemEl.dataset.index);
                if (!isNaN(index) && this.currentMatches[index]) {
                    this.applySelection(this.currentMatches[index]);
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.els.module.contains(e.target)) this.toggleSugg(false);
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.els.input.focus();
                if (this.els.input.value.trim().length > 0) this.toggleSugg(true);
            }
        });

        EventBus.on('MEDIA_STORE_LOADED', () => { 
            const stateQuery = AppStore.getState().media.searchQuery;
            this.els.input.value = stateQuery || ''; 
        });
    }

    executeSearch(query) {
        this.toggleSugg(false);
        AppRouter.updateQuery({ search: query.trim() ? query : null });
    }

    toggleSugg(isOpen) {
        this.suggestionsBox.classList.toggle('active', isOpen);
        this.els.module.classList.toggle('suggestions-open', isOpen);
        if (!isOpen) this.selectedIndex = -1; 
    }

    toggleLoading(isLoading) {
        if (!this.els.iconDefault || !this.els.iconLoading) return;
        this.els.iconDefault.style.display = isLoading ? 'none' : 'flex';
        this.els.iconLoading.style.display = isLoading ? 'flex' : 'none';
    }

    handleInput(query) {
        clearTimeout(this.debounceTimer);

        if (this.els.hotkeyHint) {
            const hasText = query.length > 0;
            this.els.hotkeyHint.style.display = hasText ? 'none' : 'flex';
        }

        if (query.trim().length < 1) {
            this.toggleSugg(false);
            this.toggleLoading(false);
            if (AppStore.getState().media.searchQuery !== '') {
                this.executeSearch('');
            }
            return;
        }

        this.toggleLoading(true);

        this.debounceTimer = setTimeout(() => {
            // ИСПРАВЛЕНИЕ: Прямой поиск по центральному хранилищу AppStore
            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) {
                this.toggleLoading(false);
                return;
            }

            const queryLower = query.toLowerCase().trim();
            let flattenedList = [];
            
            state.data.media.forEach(item => {
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => flattenedList.push({ ...sub, status: sub.status || item.status, isSubItem: true }));
                } else {
                    flattenedList.push(item);
                }
            });

            // Убираем дубликаты
            const uniqueMap = new Map();
            flattenedList.forEach(item => uniqueMap.set(item.id, item));
            flattenedList = Array.from(uniqueMap.values());

            let matches = flattenedList.map(item => ({
                ...item,
                score: SearchEngine.scoreItemForSuggestions(item.title, queryLower)
            })).filter(item => item.score > 15);

            matches = matches.sort((a, b) => b.score - a.score).slice(0, 5);

            this.currentMatches = matches;
            this.renderSuggestions(matches);
            this.toggleLoading(false);
        }, 350); 
    }

    renderSuggestions(matches) {
        if (matches.length === 0) {
            this.suggestionsBox.innerHTML = '<div class="suggestion-empty"><i class="fas fa-search"></i>Совпадений не найдено</div>';
        } else {
            this.suggestionsBox.innerHTML = matches.map((item, idx) => {
                const img = item.image || (item.images ? item.images[0] : '') || 'https://via.placeholder.com/45x65?text=NO+IMG';
                return `
                    <div class="suggestion-item" data-index="${idx}">
                        <div class="sugg-left">
                            <div class="sugg-thumb-wrapper ${item.format === 'youtube' ? 'is-youtube' : ''}">
                                <img src="${optimizeImageUrl(img, 100, 70)}" class="sugg-thumb">
                            </div>
                            <span class="sugg-title">${item.title}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        this.toggleSugg(true);
    }

    handleKeyDown(e) {
        const isDropdownOpen = this.els.module.classList.contains('suggestions-open');
        
        if (!isDropdownOpen || this.currentMatches.length === 0) {
            if (e.key === 'Enter') {
                EventBus.emit('PLAY_SOUND', 'click');
                this.executeSearch(this.els.input.value);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.currentMatches.length;
            this.updateSelectionUI();
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.currentMatches.length) % this.currentMatches.length;
            this.updateSelectionUI();
        } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && this.currentMatches[this.selectedIndex]) {
                this.applySelection(this.currentMatches[this.selectedIndex]);
            } else {
                EventBus.emit('PLAY_SOUND', 'click');
                this.executeSearch(this.els.input.value);
            }
        } 
        else if (e.key === 'Escape') {
            this.toggleSugg(false);
        }
    }

    updateSelectionUI() {
        const items = this.suggestionsBox.querySelectorAll('.suggestion-item');
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add('keyboard-focus');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('keyboard-focus');
            }
        });
    }

    applySelection(item) {
        EventBus.emit('PLAY_SOUND', 'click');
        this.els.input.value = item.title;
        if (this.els.hotkeyHint) this.els.hotkeyHint.style.display = 'none';
        
        this.executeSearch(item.title);
    }
}