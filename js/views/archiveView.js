/* js/views/archiveView.js */

export function getArchiveView() {
    return `
    <!-- СЕКЦИЯ 4: ARCHIVE (БАЗА ДАННЫХ) -->
    <section id="media-archive" class="media-archive-section">
        <div class="container">
            <div class="archive-top-bar">
                
                <!-- ЛЕВАЯ ЧАСТЬ: КНОПКА ПЕРЕХОДА В БИБЛИОТЕКУ -->
                <div class="archive-action-area">
                    <a href="#/library" class="cyber-btn-outline library-open-btn">
                        <i class="fas fa-expand-arrows-alt"></i> ПОЛНАЯ БИБЛИОТЕКА
                    </a>
                </div>

                <!-- ЦЕНТР: УПРАВЛЕНИЕ -->
                <div class="archive-tools">
                    <div class="header-control-bar">
                        <div class="sort-switcher">
                            <button class="sort-btn active" data-sort="name" title="По алфавиту"><i class="fas fa-sort-alpha-down sort-icon"></i></button>
                            <button class="sort-btn" data-sort="rating" title="По рейтингу"><i class="fas fa-star sort-icon"></i></button>
                        </div>
                        <div class="type-switcher">
                            <div class="switcher-bg"></div>
                            <button class="switcher-btn active" data-type="games"><i class="fas fa-gamepad"></i> ИГРЫ</button>
                            <button class="switcher-btn" data-type="movies"><i class="fas fa-film"></i> КИНО</button>
                        </div>
                        <div class="density-switcher">
                            <button class="density-btn active" data-mode="detailed" title="Подробная сетка"><i class="fas fa-th-large"></i></button>
                            <button class="density-btn" data-mode="compact" title="Компактная сетка"><i class="fas fa-th"></i></button>
                        </div>
                    </div>
                </div>

                <!-- ПРАВАЯ ЧАСТЬ: ПОИСК -->
                <div class="archive-search-area">
                    <div class="search-row">
                        <div class="search-module" id="search-module">
                            <i class="fas fa-search search-icon" id="search-icon-default"></i>
                            <i class="fas fa-circle-notch fa-spin search-icon loading-icon" id="search-icon-loading" style="display: none; color: var(--color-neon-pink);"></i>
                            <input type="text" id="archive-search" placeholder="Поиск по базе..." autocomplete="off">
                            <div class="search-hotkey" id="search-hotkey-hint">Ctrl+K</div>
                        </div>
                    </div>
                </div>

            </div>
            
            <div class="archive-full-grid-wrapper" id="archive-grid-wrapper">
                <div id="archive-side-pagination" class="archive-side-pagination" style="display: none;">
                    <div class="pagination-dock-vertical">
                        <button id="page-prev-btn" class="cyber-page-btn-vert" title="Предыдущая страница">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <div class="pagination-divider-vert"></div>
                        <div id="page-numbers-container" class="page-numbers-vert"></div>
                        <div class="pagination-divider-vert"></div>
                        <button id="page-next-btn" class="cyber-page-btn-vert" title="Следующая страница">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>

                <div class="archive-grid-content">
                    <div id="archive-grid-main" class="archive-flex-grid transition-layer"></div>
                </div>
            </div>
        </div>
    </section>
    `;
}