/* js/tierlist/TierlistSearch.js */

const EN_TO_RU = {'q':'й', 'w':'ц', 'e':'у', 'r':'к', 't':'е', 'y':'н', 'u':'г', 'i':'ш', 'o':'щ', 'p':'з', '[':'х', ']':'ъ', 'a':'ф', 's':'ы', 'd':'в', 'f':'а', 'g':'п', 'h':'р', 'j':'о', 'k':'л', 'l':'д', ';':'ж', "'":'э', 'z':'я', 'x':'ч', 'c':'с', 'v':'м', 'b':'и', 'n':'т', 'm':'ь', ',':'б', '.':'ю'};

function switchLayout(str) {
    let res = '';
    for(let char of str) { res += EN_TO_RU[char] || char; }
    return res;
}

export class TierlistSearch {
    constructor(controller) {
        this.ctrl = controller;
        this.searchModule = document.getElementById('search-module');
        this.searchInput = document.getElementById('pool-search');
        this.suggestionsBox = document.getElementById('search-suggestions');
        
        this.debounceTimer = null;
        this.setupSearch();
    }

    setupSearch() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && this.ctrl.isEditMode) {
                e.preventDefault();
                this.searchInput.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.searchModule.contains(e.target)) {
                this.toggleSuggestions(false);
            }
        });

        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const hotkeyHint = document.getElementById('search-hotkey-hint');
            if (hotkeyHint) hotkeyHint.style.opacity = query.length > 0 ? '0' : '1';

            clearTimeout(this.debounceTimer);

            if (query.length === 0) {
                this.toggleSuggestions(false);
                this.filterGlobalPool(''); 
                return;
            }

            this.debounceTimer = setTimeout(() => { this.renderSuggestions(query); }, 300);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.toggleSuggestions(false);
                this.filterGlobalPool(this.searchInput.value.toLowerCase().trim());
            } else if (e.key === 'Escape') {
                this.toggleSuggestions(false);
            }
        });
    }

    toggleSuggestions(isOpen) {
        this.suggestionsBox.classList.toggle('active', isOpen);
        this.searchModule.classList.toggle('suggestions-open', isOpen);
    }

    renderSuggestions(query) {
        const layoutSwitched = switchLayout(query);
        const poolCards = Array.from(this.ctrl.poolEl.querySelectorAll('.t-card'));
        
        const matches = poolCards.filter(card => {
            const title = card.dataset.title.toLowerCase();
            return title.includes(query) || title.includes(layoutSwitched);
        }).slice(0, 8); 

        if (matches.length === 0) {
            this.suggestionsBox.innerHTML = '<div style="padding: 15px; color: #888; text-align: center;">Ничего не найдено в базе</div>';
        } else {
            this.suggestionsBox.innerHTML = matches.map(card => {
                const title = card.dataset.title;
                const img = card.querySelector('img').src;
                return `
                    <div class="suggestion-item" data-title="${title}">
                        <img src="${img}" class="sugg-thumb">
                        <span class="sugg-title">${title}</span>
                    </div>
                `;
            }).join('');

            this.suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.searchInput.value = item.dataset.title;
                    this.toggleSuggestions(false);
                    this.filterGlobalPool(item.dataset.title.toLowerCase());
                });
            });
        }
        this.toggleSuggestions(true);
    }

    filterGlobalPool(query) {
        const layoutSwitched = switchLayout(query);
        const poolCards = this.ctrl.poolEl.querySelectorAll('.t-card');
        
        poolCards.forEach(card => {
            const title = card.dataset.title.toLowerCase();
            if (query === '' || title.includes(query) || title.includes(layoutSwitched)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}