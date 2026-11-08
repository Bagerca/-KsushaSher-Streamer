/* js/views/libraryView.js */

export function getLibraryView() {
    return `
    <div id="library-page" class="library-page-wrapper">
        <div class="library-cinematic-bg" id="library-cinematic-bg"></div>
        
        <div class="library-header-sticky">
            <div class="container">
                
                <div class="library-top-bar">
                    <div class="lib-action-area">
                        <button id="btn-library-back" class="cyber-btn btn-lib-back"><i class="fas fa-chevron-left"></i> ХАБ</button>
                    </div>

                    <div class="lib-tools-area">
                        <div class="header-control-bar">
                            <div class="sort-switcher" id="library-sort-switcher">
                                <button class="sort-btn active" data-sort="name" title="По алфавиту"><i class="fas fa-sort-alpha-down sort-icon"></i></button>
                                <button class="sort-btn" data-sort="rating" title="По рейтингу"><i class="fas fa-sort-numeric-down-alt sort-icon"></i></button>
                            </div>
                            
                            <div class="type-switcher" id="library-type-switcher">
                                <div class="switcher-bg"></div>
                                <button class="switcher-btn active" data-type="games"><i class="fas fa-gamepad"></i> ИГРЫ</button>
                                <button class="switcher-btn" data-type="movies"><i class="fas fa-film"></i> КИНО</button>
                            </div>
                            <div class="density-switcher">
                                <button class="density-btn active" id="lib-grid-detailed" data-mode="detailed" title="Подробная сетка"><i class="fas fa-th-large"></i></button>
                                <button class="density-btn" id="lib-grid-compact" data-mode="compact" title="Компактная сетка"><i class="fas fa-th"></i></button>
                            </div>
                        </div>
                    </div>

                    <div class="lib-search-area">
                        <div class="search-module" id="lib-search-module">
                            <i class="fas fa-search search-icon" id="lib-search-icon"></i>
                            <i class="fas fa-circle-notch fa-spin search-icon loading-icon" id="lib-search-loading" style="display: none; color: var(--color-neon-pink);"></i>
                            <input type="text" id="lib-search-input" placeholder="Поиск по библиотеке..." autocomplete="off">
                            <div class="search-hotkey" id="lib-search-hotkey">Ctrl+K</div>
                            <div class="search-suggestions" id="lib-search-suggestions"></div>
                        </div>
                    </div>
                </div>

                <div class="library-tabs-nav" id="library-tabs-nav">
                    <button class="lib-tab-btn active" data-tab="completed">
                        <div class="tab-icon"><i class="fas fa-status-completed"></i></div>
                        <div class="tab-info">
                            <span class="tab-label" id="label-completed">ПРОЙДЕНО</span>
                            <span class="tab-count" id="count-completed">0</span>
                        </div>
                    </button>
                    
                    <button class="lib-tab-btn" data-tab="playing">
                        <div class="tab-icon"><i class="fas fa-status-playing"></i></div>
                        <div class="tab-info">
                            <span class="tab-label" id="label-playing">В ПРОЦЕССЕ</span>
                            <span class="tab-count" id="count-playing">0</span>
                        </div>
                    </button>
                    
                    <button class="lib-tab-btn" data-tab="on-hold">
                        <div class="tab-icon"><i class="fas fa-status-onhold"></i></div>
                        <div class="tab-info">
                            <span class="tab-label">НА ПАУЗЕ</span>
                            <span class="tab-count" id="count-on-hold">0</span>
                        </div>
                    </button>
                    
                    <button class="lib-tab-btn" data-tab="dropped">
                        <div class="tab-icon"><i class="fas fa-status-dropped"></i></div>
                        <div class="tab-info">
                            <span class="tab-label">БРОШЕНО</span>
                            <span class="tab-count" id="count-dropped">0</span>
                        </div>
                    </button>
                    
                    <button class="lib-tab-btn" data-tab="suggested">
                        <!-- ИСПРАВЛЕНИЕ: Звезда заменена на кастомную иконку предложки -->
                        <div class="tab-icon"><i class="fas fa-status-suggested"></i></div>
                        <div class="tab-info">
                            <span class="tab-label">ПРЕДЛОЖКА</span>
                            <span class="tab-count" id="count-suggested">0</span>
                        </div>
                    </button>
                </div>

            </div>
        </div>

        <div class="container library-container">
            <div id="library-grid-main" class="library-full-grid"></div>
        </div>
    </div>
    `;
}