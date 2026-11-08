/* js/library/LibrarySearch.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { AppRouter } from '../router.js';
import { SearchEngine } from '../services/SearchEngine.js';
import { optimizeImageUrl } from '../utils.js';
import { normalizeStatus } from './library-utils.js';

export class LibrarySearch {
    constructor(ctrl) {
        this.ctrl = ctrl;
        
        this.searchDebounce = null;
        this.currentSearchMatches = [];
        this.selectedIndex = -1;

        this.bindEvents();
    }

    bindEvents() {
        this.ctrl.els.searchInput.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
        this.ctrl.els.searchInput.addEventListener('keydown', (e) => this.handleSearchKeyDown(e));

        this.ctrl.els.searchIcon.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            this.executeSearch(this.ctrl.els.searchInput.value);
        });

        document.addEventListener('click', (e) => {
            if (!this.ctrl.els.searchModule.contains(e.target)) this.toggleSuggestions(false);
        });

        this.ctrl.els.suggestionsBox.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.suggestion-item');
            if (itemEl) {
                const index = parseInt(itemEl.dataset.index);
                if (!isNaN(index) && this.currentSearchMatches[index]) {
                    this.applySearchSelection(this.currentSearchMatches[index]);
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                if (AppStore.getState().route.path.startsWith('/library')) {
                    e.preventDefault();
                    this.ctrl.els.searchInput.focus();
                }
            }
        });
    }

    executeSearch(query) {
        this.toggleSuggestions(false);
        AppRouter.updateQuery({ search: query.trim() ? query : null });
    }

    handleSearchInput(text) {
        const query = text.toLowerCase().trim();
        if (this.ctrl.els.searchHotkey) this.ctrl.els.searchHotkey.style.display = query.length > 0 ? 'none' : 'flex';

        clearTimeout(this.searchDebounce);
        
        if (query.length < 1) {
            this.toggleSuggestions(false);
            this.toggleLoading(false);
            if (this.ctrl.localSearchQuery !== '') {
                this.executeSearch('');
            }
            return;
        }

        this.toggleLoading(true);
        
        this.searchDebounce = setTimeout(() => {
            const state = AppStore.getState();
            if (!state.data.isMediaLoaded) {
                this.toggleLoading(false);
                return;
            }

            let flattenedList = [];
            state.data.media.forEach(item => {
                if (item.type !== state.media.type) return; 
                if (item.format === 'youtube') return; 
                
                if (item.format === 'collection' && item.items) {
                    item.items.forEach(sub => {
                        if (normalizeStatus(sub.status || item.status) === this.ctrl.activeTab) {
                            flattenedList.push({ ...sub, status: sub.status || item.status });
                        }
                    });
                } else if (normalizeStatus(item.status) === this.ctrl.activeTab) {
                    flattenedList.push(item);
                }
            });

            const uniqueMap = new Map();
            flattenedList.forEach(item => uniqueMap.set(item.id, item));
            flattenedList = Array.from(uniqueMap.values());

            let matches = flattenedList.map(item => ({
                ...item,
                score: SearchEngine.scoreItemForSuggestions(item.title, query)
            })).filter(item => item.score > 15);

            matches = matches.sort((a, b) => b.score - a.score).slice(0, 5);
            this.currentSearchMatches = matches;
            
            this.renderSuggestions(matches);
            this.toggleLoading(false);
        }, 300);
    }

    handleSearchKeyDown(e) {
        const isDropdownOpen = this.ctrl.els.searchModule.classList.contains('suggestions-open');
        
        if (!isDropdownOpen || this.currentSearchMatches.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                EventBus.emit('PLAY_SOUND', 'click');
                this.executeSearch(this.ctrl.els.searchInput.value);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.currentSearchMatches.length;
            this.updateSelectionUI();
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.currentSearchMatches.length) % this.currentSearchMatches.length;
            this.updateSelectionUI();
        } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && this.currentSearchMatches[this.selectedIndex]) {
                this.applySearchSelection(this.currentSearchMatches[this.selectedIndex]);
            } else {
                EventBus.emit('PLAY_SOUND', 'click');
                this.executeSearch(this.ctrl.els.searchInput.value);
            }
        } 
        else if (e.key === 'Escape') {
            this.toggleSuggestions(false);
        }
    }

    updateSelectionUI() {
        const items = this.ctrl.els.suggestionsBox.querySelectorAll('.suggestion-item');
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add('keyboard-focus');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('keyboard-focus');
            }
        });
    }

    applySearchSelection(item) {
        EventBus.emit('PLAY_SOUND', 'click');
        this.ctrl.els.searchInput.value = item.title;
        if (this.ctrl.els.searchHotkey) this.ctrl.els.searchHotkey.style.display = 'none';
        
        this.executeSearch(item.title);
    }

    toggleSuggestions(isOpen) {
        this.ctrl.els.suggestionsBox.classList.toggle('active', isOpen);
        this.ctrl.els.searchModule.classList.toggle('suggestions-open', isOpen);
        if (!isOpen) this.selectedIndex = -1; 
    }

    toggleLoading(isLoading) {
        if (!this.ctrl.els.searchIcon || !this.ctrl.els.searchLoading) return;
        this.ctrl.els.searchIcon.style.display = isLoading ? 'none' : 'flex';
        this.ctrl.els.searchLoading.style.display = isLoading ? 'flex' : 'none';
    }

    renderSuggestions(matches) {
        if (matches.length === 0) {
            this.ctrl.els.suggestionsBox.innerHTML = '<div class="suggestion-empty"><i class="fas fa-search"></i>Совпадений не найдено</div>';
        } else {
            this.ctrl.els.suggestionsBox.innerHTML = matches.map((item, idx) => {
                const img = item.image || (item.images ? item.images[0] : '') || 'https://via.placeholder.com/45x65?text=NO+IMG';
                return `
                    <div class="suggestion-item" data-index="${idx}">
                        <div class="sugg-left">
                            <div class="sugg-thumb-wrapper">
                                <img src="${optimizeImageUrl(img, 100, 70)}" class="sugg-thumb">
                            </div>
                            <span class="sugg-title">${item.title}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        this.toggleSuggestions(true);
    }
}