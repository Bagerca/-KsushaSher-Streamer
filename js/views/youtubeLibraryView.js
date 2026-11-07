/* js/views/youtubeLibraryView.js */

export function getYoutubeLibraryView() {
    return `
    <div id="yt-library-page" class="yt-library-page-wrapper">
        <div class="yt-library-cinematic-bg" id="yt-library-cinematic-bg"></div>
        
        <!-- СТЕКЛЯННАЯ ПРИЛИПАЮЩАЯ ШАПКА -->
        <div class="yt-library-header-sticky">
            <div class="container">
                <div class="yt-library-top-bar">
                    
                    <div class="yt-lib-action-area">
                        <button id="btn-yt-library-back" class="cyber-btn btn-yt-lib-back"><i class="fas fa-chevron-left"></i> ХАБ</button>
                        <!-- ИСПРАВЛЕНИЕ: Счетчик перенесен сюда, sub-bar удален -->
                        <div class="yt-lib-counter" id="yt-lib-counter">
                            <span class="yt-lib-counter-label">ВИДЕО:</span> <span class="yt-lib-counter-val">0</span>
                        </div>
                    </div>

                    <div class="yt-lib-logo-area">
                        <i class="fab fa-youtube"></i> YOUTUBE АРХИВ
                    </div>

                    <div class="yt-lib-search-area">
                        <div class="search-module" id="yt-lib-search-module">
                            <i class="fas fa-search search-icon" id="yt-lib-search-icon"></i>
                            <i class="fas fa-circle-notch fa-spin search-icon loading-icon" id="yt-lib-search-loading" style="display: none; color: #ff0000;"></i>
                            <input type="text" id="yt-lib-search-input" placeholder="Поиск по видеозаписям..." autocomplete="off">
                            <div class="search-hotkey" id="yt-lib-search-hotkey">Ctrl+K</div>
                            <div class="search-suggestions" id="yt-lib-search-suggestions"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="container yt-library-container">
            <!-- БЕСКОНЕЧНАЯ СЕТКА -->
            <div id="yt-library-grid-main" class="yt-library-full-grid"></div>
        </div>
    </div>
    `;
}