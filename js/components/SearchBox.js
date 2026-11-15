/* js/components/SearchBox.js */
import EventBus from '../event-bus.js';
import { SearchEngine } from '../services/SearchEngine.js';
import { getSearchableItems } from '../services/search-scope.js';
import { optimizeImageUrl } from '../utils.js';
import { replaceIcons } from '../utils/icons.js';

/**
 * ЕДИНЫЙ ПОИСКОВЫЙ КОМПОНЕНТ.
 * Владеет разметкой, debounce, клавиатурной навигацией, Ctrl+K,
 * подсветкой совпадений и рендером подсказок.
 *
 * Ничего не знает про роутер: наружу отдаёт только события
 * onSubmit(query) и onSelect(item). Навигацию решает адаптер страницы.
 *
 * Конфиг:
 *  - mount: HTMLElement        — контейнер, куда внедряется разметка
 *  - scope: 'standard'|'youtube'|'custom'
 *  - source: () => items[]     — источник для scope 'custom'
 *  - getType / getTab          — геттеры контекста (тип медиа / вкладка)
 *  - variant: 'rich'|'compact' — подсказки со статусом/рейтингом или минимальные
 *  - accent: 'green'|'youtube'|'tab' — CSS-модификатор темы
 *  - size: 'md'|'sm'
 *  - placeholder, maxSuggestions, minScore, debounceMs
 *  - isHotkeyActive: () => bool — гард Ctrl+K (активный роут / режим)
 *  - onSubmit(query), onSelect(item)
 */
let instanceCounter = 0;

const ACCENT_CLASSES = {
    green: '',
    youtube: 'search-module--youtube',
    tab: 'search-module--tab'
};

const STATUS_META = {
    'completed': { label: 'ПРОЙДЕНО', color: 'var(--color-neon-green)', icon: 'fas fa-status-completed' },
    'watched':   { label: 'ПОСМОТРЕНО', color: 'var(--color-neon-green)', icon: 'fas fa-status-completed' },
    'playing':   { label: 'В ПРОЦЕССЕ', color: 'var(--color-accent-blue)', icon: 'fas fa-status-playing' },
    'watching':  { label: 'СМОТРИМ', color: 'var(--color-accent-blue)', icon: 'fas fa-status-playing' },
    'on-hold':   { label: 'НА ПАУЗЕ', color: 'var(--color-warning-yellow)', icon: 'fas fa-status-onhold' },
    'dropped':   { label: 'БРОШЕНО', color: 'var(--color-danger-red)', icon: 'fas fa-status-dropped' },
    'suggested': { label: 'ПРЕДЛОЖКА', color: 'var(--color-neon-pink)', icon: 'fas fa-status-suggested' }
};

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Подсветка совпадения: индексы ищем по сырой строке, экранируем куски отдельно. */
function highlight(title, query) {
    const raw = String(title == null ? '' : title);
    const needle = String(query == null ? '' : query).trim();
    if (!needle) return escapeHtml(raw);
    const index = raw.toLowerCase().indexOf(needle.toLowerCase());
    if (index < 0) return escapeHtml(raw);
    return escapeHtml(raw.slice(0, index))
        + `<span class="search-match">${escapeHtml(raw.slice(index, index + needle.length))}</span>`
        + escapeHtml(raw.slice(index + needle.length));
}

export class SearchBox {
    constructor(config = {}) {
        this.config = {
            scope: 'standard',
            variant: 'compact',
            accent: 'green',
            size: 'md',
            placeholder: 'Поиск...',
            maxSuggestions: 6,
            minScore: 15,
            debounceMs: 300,
            source: null,
            getType: null,
            getTab: null,
            isHotkeyActive: () => true,
            onSubmit: null,
            onSelect: null,
            ...config
        };
        this.mount = config.mount || null;
        this.isReady = false;
        if (!this.mount) {
            console.warn(`⚠️ [SearchBox] Не передан mount-контейнер (scope: ${this.config.scope}). Компонент отключён.`);
            return;
        }
        this.uid = ++instanceCounter;
        this.listId = `search-box-list-${this.uid}`;
        this.debounceTimer = null;
        this.currentMatches = [];
        this.selectedIndex = -1;
        this.appliedQuery = '';
        try {
            this.render();
            this.bindEvents();
            console.log(`🔎 [SearchBox] #${this.uid} инициализирован (scope: ${this.config.scope}, variant: ${this.config.variant}, accent: ${this.config.accent})`);
        } catch (error) {
            console.error(`🚨 [SearchBox] Ошибка инициализации #${this.uid}:`, error);
        }
    }

    /* ==================== РАЗМЕТКА ==================== */
    render() {
        const accentClass = ACCENT_CLASSES[this.config.accent];
        if (accentClass === undefined) {
            console.warn(`⚠️ [SearchBox] Неизвестный accent "${this.config.accent}" — использую дефолтный.`);
        }
        const sizeClass = this.config.size === 'sm' ? 'search-module--sm' : '';
        this.mount.innerHTML = `
            <div class="search-module ${accentClass || ''} ${sizeClass}" role="search" data-search-scope="${escapeHtml(this.config.scope)}">
                <i class="fas fa-search search-icon" data-search-role="icon" aria-hidden="true"></i>
                <i class="fas fa-circle-notch search-icon loading-icon" data-search-role="loading" style="display: none;" aria-hidden="true"></i>
                <input type="text" data-search-role="input"
                    placeholder="${escapeHtml(this.config.placeholder)}"
                    aria-label="${escapeHtml(this.config.placeholder)}"
                    autocomplete="off" spellcheck="false"
                    role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="${this.listId}">
                <div class="search-hotkey" data-search-role="hotkey">Ctrl+K</div>
                <div class="search-suggestions" data-search-role="suggestions" role="listbox" id="${this.listId}"></div>
            </div>
        `;
        replaceIcons(this.mount);
        this.module = this.mount.querySelector('.search-module');
        this.input = this.mount.querySelector('[data-search-role="input"]');
        this.icon = this.mount.querySelector('[data-search-role="icon"]');
        this.loading = this.mount.querySelector('[data-search-role="loading"]');
        this.hotkey = this.mount.querySelector('[data-search-role="hotkey"]');
        this.suggestionsBox = this.mount.querySelector('[data-search-role="suggestions"]');
        this.isReady = true;
    }

    /* ==================== СОБЫТИЯ ==================== */
    bindEvents() {
        this.input.addEventListener('input', (e) => this.handleInput(e.target.value));
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.icon.addEventListener('click', () => {
            EventBus.emit('PLAY_SOUND', 'click');
            this.submit(this.input.value);
        });
        this.suggestionsBox.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.suggestion-item');
            if (!itemEl) return;
            const index = parseInt(itemEl.dataset.index, 10);
            if (Number.isFinite(index) && this.currentMatches[index]) {
                this.select(this.currentMatches[index]);
            }
        });
        this.onDocClick = (e) => {
            if (this.module && !this.module.contains(e.target)) this.toggleSuggestions(false);
        };
        this.onDocKeyDown = (e) => {
            if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return;
            let active = false;
            try {
                active = Boolean(this.config.isHotkeyActive());
            } catch (error) {
                console.warn(`⚠️ [SearchBox#${this.uid}] Ошибка гарда хоткея:`, error.message);
            }
            if (!active) return;
            e.preventDefault();
            this.input.focus();
            if (this.input.value.trim().length > 0 && this.currentMatches.length > 0) {
                this.toggleSuggestions(true);
            }
        };
        document.addEventListener('click', this.onDocClick);
        document.addEventListener('keydown', this.onDocKeyDown);
    }

    /* ==================== ПОИСК ==================== */
    handleInput(text) {
        if (!this.isReady) return;
        const query = String(text || '').toLowerCase().trim();
        if (this.hotkey) this.hotkey.style.display = query.length > 0 ? 'none' : 'flex';
        clearTimeout(this.debounceTimer);
        if (query.length < 1) {
            this.toggleSuggestions(false);
            this.toggleLoading(false);
            if (this.appliedQuery !== '') this.submit('');
            return;
        }
        this.toggleLoading(true);
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            try {
                const matches = this.computeMatches(query);
                this.currentMatches = matches;
                this.renderSuggestions(matches, query);
            } catch (error) {
                console.error(`🚨 [SearchBox#${this.uid}] Ошибка поиска:`, error);
                this.currentMatches = [];
                this.renderSuggestions([], query);
            } finally {
                this.toggleLoading(false);
            }
        }, this.config.debounceMs);
    }

    computeMatches(query) {
        const items = getSearchableItems({
            scope: this.config.scope,
            type: this.config.getType ? this.config.getType() : null,
            tab: this.config.getTab ? this.config.getTab() : null,
            source: this.config.source
        });
        const needle = String(query || '').toLowerCase().trim();
        if (!needle || items.length === 0) return [];
        return items
            .map(item => ({ ...item, score: SearchEngine.scoreItemForSuggestions(item.title || '', needle) }))
            .filter(item => item.score > this.config.minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.maxSuggestions);
    }

    /* ==================== ПОДСКАЗКИ ==================== */
    renderSuggestions(matches, query) {
        if (!this.isReady) return;
        if (!matches || matches.length === 0) {
            this.suggestionsBox.innerHTML = '<div class="suggestion-empty"><i class="fas fa-search"></i>Совпадений не найдено</div>';
        } else {
            const builder = this.config.variant === 'rich'
                ? (item, index) => this.buildRichSuggestion(item, index, query)
                : (item, index) => this.buildCompactSuggestion(item, index, query);
            this.suggestionsBox.innerHTML = matches.map(builder).join('');
        }
        replaceIcons(this.suggestionsBox);
        this.toggleSuggestions(true);
    }

    buildThumb(item) {
        const img = item.image || (Array.isArray(item.images) ? item.images[0] : '') || '';
        if (img) {
            return `<img src="${escapeHtml(optimizeImageUrl(img, 100, 70))}" class="sugg-thumb" alt="" loading="lazy" onerror="this.style.display='none'">`;
        }
        const letter = String(item.title || '?').charAt(0).toUpperCase();
        return `<div class="sugg-thumb sugg-thumb--empty">${escapeHtml(letter)}</div>`;
    }

    buildCompactSuggestion(item, index, query) {
        const isYouTube = item.format === 'youtube';
        return `
            <div class="suggestion-item" data-index="${index}" role="option" id="${this.listId}-opt-${index}" aria-selected="false" style="animation-delay:${index * 35}ms">
                <div class="sugg-left">
                    <div class="sugg-thumb-wrapper ${isYouTube ? 'is-youtube' : ''}">${this.buildThumb(item)}</div>
                    <div class="sugg-title">${highlight(item.title, query)}</div>
                </div>
            </div>`;
    }

    buildRichSuggestion(item, index, query) {
        const isCollectionPart = Boolean(item.parentTitle);
        const meta = STATUS_META[item.status] || { label: 'БЕЗ СТАТУСА', color: 'var(--color-text-muted)', icon: 'fas fa-circle-notch' };
        const rating = Number(item.rating) || 0;
        const badge = isCollectionPart
            ? `<div class="sugg-collection-badge" style="border-color: ${meta.color}; color: ${meta.color};"><i class="fas fa-card-pack"></i> ${item.collectionCount}</div>`
            : '';
        const ratingHtml = (item.status !== 'suggested' && rating > 0)
            ? `<div class="sugg-cyber-rating" style="color: ${meta.color};">
                    <div class="segments">${Array.from({ length: 5 }, (_, i) =>
                        `<div class="sugg-cyber-segment ${i < Math.round(rating) ? 'filled' : ''}" style="--seg-color: ${meta.color};"></div>`).join('')}</div>
                    <span class="val">${rating.toFixed(1)}</span>
               </div>`
            : '';
        const subtitle = isCollectionPart
            ? `<div class="sugg-subtitle">${escapeHtml(item.parentTitle)}</div>`
            : '';
        return `
            <div class="suggestion-item" data-index="${index}" role="option" id="${this.listId}-opt-${index}" aria-selected="false" style="animation-delay:${index * 35}ms">
                <div class="sugg-left">
                    <div class="sugg-thumb-wrapper ${isCollectionPart ? 'is-collection' : ''}">
                        ${this.buildThumb(item)}${badge}
                    </div>
                    <div style="min-width:0;">
                        <div class="sugg-title">${highlight(item.title, query)}</div>
                        ${subtitle}
                    </div>
                </div>
                <div class="sugg-right">
                    <div class="sugg-cyber-status" style="color:${meta.color}; border-color:${meta.color};">
                        <i class="${meta.icon}"></i><span class="status-text">${meta.label}</span>
                    </div>
                    ${ratingHtml}
                </div>
            </div>`;
    }

    /* ==================== КЛАВИАТУРА ==================== */
    handleKeyDown(e) {
        if (!this.isReady) return;
        const isOpen = this.module.classList.contains('suggestions-open');
        if (!isOpen || this.currentMatches.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                EventBus.emit('PLAY_SOUND', 'click');
                this.submit(this.input.value);
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.currentMatches.length;
            this.updateSelectionUI();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.currentMatches.length) % this.currentMatches.length;
            this.updateSelectionUI();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && this.currentMatches[this.selectedIndex]) {
                this.select(this.currentMatches[this.selectedIndex]);
            } else {
                EventBus.emit('PLAY_SOUND', 'click');
                this.submit(this.input.value);
            }
        } else if (e.key === 'Escape') {
            this.toggleSuggestions(false);
        }
    }

    updateSelectionUI() {
        const options = this.suggestionsBox.querySelectorAll('.suggestion-item');
        options.forEach((el, index) => {
            const active = index === this.selectedIndex;
            el.classList.toggle('keyboard-focus', active);
            el.setAttribute('aria-selected', active ? 'true' : 'false');
            if (active) {
                this.input.setAttribute('aria-activedescendant', el.id);
                el.scrollIntoView({ block: 'nearest' });
            }
        });
        if (this.selectedIndex < 0) this.input.removeAttribute('aria-activedescendant');
    }

    /* ==================== ПУБЛИЧНОЕ API ==================== */
    submit(query) {
        if (!this.isReady) return;
        const clean = String(query || '').trim();
        this.appliedQuery = clean;
        this.toggleSuggestions(false);
        if (typeof this.config.onSubmit !== 'function') {
            console.warn(`⚠️ [SearchBox#${this.uid}] onSubmit не задан — запрос "${clean}" не отправлен.`);
            return;
        }
        try {
            this.config.onSubmit(clean);
        } catch (error) {
            console.error(`🚨 [SearchBox#${this.uid}] Ошибка onSubmit:`, error);
        }
    }

    select(item) {
        if (!this.isReady || !item) return;
        EventBus.emit('PLAY_SOUND', 'click');
        this.input.value = item.title || '';
        if (this.hotkey) this.hotkey.style.display = 'none';
        try {
            if (typeof this.config.onSelect === 'function') {
                this.appliedQuery = String(item.title || '').trim();
                this.toggleSuggestions(false);
                this.config.onSelect(item);
            } else {
                this.submit(item.title || '');
            }
        } catch (error) {
            console.error(`🚨 [SearchBox#${this.uid}] Ошибка onSelect:`, error);
        }
    }

    toggleSuggestions(isOpen) {
        if (!this.isReady) return;
        this.suggestionsBox.classList.toggle('active', isOpen);
        this.module.classList.toggle('suggestions-open', isOpen);
        this.input.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (!isOpen) {
            this.selectedIndex = -1;
            this.input.removeAttribute('aria-activedescendant');
        }
    }

    toggleLoading(isLoading) {
        if (!this.isReady) return;
        this.icon.style.display = isLoading ? 'none' : 'flex';
        this.loading.style.display = isLoading ? 'flex' : 'none';
    }

    /** Пассивная синхронизация из Store/URL: не стреляет событиями. */
    setQuery(query) {
        if (!this.isReady) return;
        const clean = String(query || '');
        this.appliedQuery = clean.trim();
        if (this.input.value !== clean) this.input.value = clean;
        if (this.hotkey) this.hotkey.style.display = clean ? 'none' : 'flex';
    }

    /** Полный сброс при размонтировании экрана. */
    reset() {
        if (!this.isReady) return;
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
        this.currentMatches = [];
        this.toggleLoading(false);
        this.toggleSuggestions(false);
        this.input.value = '';
        this.appliedQuery = '';
        if (this.hotkey) this.hotkey.style.display = 'flex';
    }

    destroy() {
        if (!this.isReady) return;
        clearTimeout(this.debounceTimer);
        document.removeEventListener('click', this.onDocClick);
        document.removeEventListener('keydown', this.onDocKeyDown);
        this.isReady = false;
        console.log(`🔎 [SearchBox] #${this.uid} уничтожен, слушатели сняты.`);
    }
}