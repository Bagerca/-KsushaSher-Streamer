/* js/archive/SearchController.js */
import EventBus from '../event-bus.js';
import { STATUS_MAP } from '../media-store.js';
import { getYouTubeId } from '../utils.js';

export class SearchController {
    constructor(store) {
        this.store = store;
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

        // Лупа работает как кнопка Enter
        if (this.els.iconDefault) {
            this.els.iconDefault.addEventListener('click', () => {
                if (this.els.input.value.trim().length > 0) {
                    EventBus.emit('PLAY_SOUND', 'click');
                    this.store.setSearchQuery(this.els.input.value);
                    this.toggleSugg(false);
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
            this.els.input.value = ''; 
            this.handleInput('');
        });
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
            if (this.store.searchQuery !== '') this.store.setSearchQuery('');
            return;
        }

        this.toggleLoading(true);

        this.debounceTimer = setTimeout(() => {
            this.currentMatches = this.store.getSearchSuggestions(query);
            this.selectedIndex = -1; 
            this.renderSuggestions(this.currentMatches, query);
            this.toggleLoading(false);
            this.toggleSugg(true);
        }, 350); 
    }

    handleKeyDown(e) {
        const isDropdownOpen = this.els.module.classList.contains('suggestions-open');
        
        if (!isDropdownOpen || this.currentMatches.length === 0) {
            if (e.key === 'Enter') {
                EventBus.emit('PLAY_SOUND', 'click');
                this.store.setSearchQuery(this.els.input.value);
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
                this.toggleSugg(false);
                this.store.setSearchQuery(this.els.input.value);
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
        
        this.toggleSugg(false);
        this.store.setSearchQuery(item.title);
    }

    // Подсветка букв в любом месте
    highlightText(text, query) {
        if (!query) return text;
        const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return text.replace(regex, `<mark class="search-match">$1</mark>`);
    }

    renderSuggestions(matches, query) {
        if (matches.length === 0) {
            this.suggestionsBox.innerHTML = `
                <div class="suggestion-empty">
                    <i class="fas fa-satellite-dish"></i>
                    <span>Сигнал не найден. По запросу "${query}" ничего нет.</span>
                </div>`;
            return;
        }
        
        this.suggestionsBox.innerHTML = matches.map((item, index) => {
            const titleText = item.title || "";
            const titleHtml = this.highlightText(titleText, query);
            const color = item.customColor || '#fff';

            // ИЗВЛЕЧЕНИЕ КАРТИНКИ
            let thumbUrl = item.image;
            if (!thumbUrl) {
                if (item.format === 'collection' && item.items && item.items.length > 0) {
                     thumbUrl = item.items[0].image;
                } else if (item.videos && item.videos.length > 0) {
                     const vUrl = typeof item.videos[0] === 'string' ? item.videos[0] : item.videos[0].url;
                     const ytId = getYouTubeId(vUrl);
                     if (ytId) thumbUrl = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
                }
            }
            if (!thumbUrl) thumbUrl = 'https://via.placeholder.com/65x95?text=NO+IMG';

            // ЛОГИКА КОЛЛЕКЦИИ (3D Стек + Бейдж)
            const isCollection = item.format === 'collection';
            const thumbClasses = "sugg-thumb-wrapper" + (isCollection ? " is-collection" : "");
            const collectionBadge = (isCollection && item.items) 
                ? `<div class="sugg-collection-badge" style="border-color:${color};"><i class="fas fa-folder-open" style="color:${color};"></i> <span>${item.items.length}</span></div>` 
                : '';

            // ЛОГИКА СТАТУСА (Хакерские скобки)
            const rawStatus = STATUS_MAP[item.status] || item.status;
            const statusHtml = `<span class="sugg-cyber-status" style="color: ${color}; text-shadow: 0 0 5px ${color}80;">[ ${rawStatus} ]</span>`;

            // ЛОГИКА РЕЙТИНГА (Сегменты)
            let displayRating = item.rating || 0;
            if (isCollection && item.items) {
                let sum = 0, count = 0;
                item.items.forEach(sub => { if (sub.rating && sub.rating > 0) { sum += sub.rating; count++; } });
                if (count > 0) displayRating = sum / count;
            }

            let ratingHtml = '';
            if (displayRating > 0 && item.status !== 'suggested') {
                const rScore = Math.round(displayRating);
                let segments = '';
                for(let i=0; i<5; i++) {
                    segments += `<div class="sugg-cyber-segment ${i < rScore ? 'filled' : ''}" style="--seg-color: ${color}"></div>`;
                }
                ratingHtml = `<div class="sugg-cyber-rating"><div class="segments">${segments}</div><span class="val" style="color:${color}">${displayRating.toFixed(1)}</span></div>`;
            }

            const animDelay = index * 40;

            // НОВАЯ СТРУКТУРА HTML (Левая и Правая части)
            return `
                <div class="suggestion-item" data-index="${index}" style="animation-delay: ${animDelay}ms">
                    <div class="sugg-left">
                        <div class="${thumbClasses}">
                            <img src="${thumbUrl}" class="sugg-thumb" onerror="this.src='https://via.placeholder.com/65x95?text=ERR'">
                            ${collectionBadge}
                        </div>
                        <span class="sugg-title" title="${titleText}">${titleHtml}</span>
                    </div>
                    <div class="sugg-right">
                        ${statusHtml}
                        ${ratingHtml}
                    </div>
                </div>
            `;
        }).join('');
    }
}