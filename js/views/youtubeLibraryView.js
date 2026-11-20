/* js/views/youtubeLibraryView.js */
export function getYoutubeLibraryView() {
  return `
    <div id="yt-library-page" class="yt-library-page-wrapper">
      <div class="yt-library-cinematic-bg" id="yt-library-cinematic-bg"></div>

      <!-- СТЕКЛЯННАЯ ПРИЛИПАЮЩАЯ ШАПКА -->
      <header class="yt-library-header-sticky">
        <div class="container">
          <div class="yt-library-top-bar">
            <div class="yt-lib-action-area">
              <button id="btn-yt-library-back" class="cyber-btn btn-yt-lib-back"><i class="fas fa-chevron-left"></i> ХАБ</button>
              <div class="yt-lib-counter" id="yt-lib-counter">
                <span class="yt-lib-counter-label">ВИДЕО:</span> <span class="yt-lib-counter-val" id="yt-lib-video-count">0</span>
              </div>
            </div>
            <div class="yt-lib-logo-area">
              <i class="fab fa-youtube"></i> YOUTUBE АРХИВ
            </div>
            <!-- ПОИСК: разметку генерирует единый SearchBox (красный модификатор) -->
            <div class="yt-lib-search-area">
              <div id="yt-lib-search-mount" class="search-mount"></div>
            </div>
          </div>
        </div>
      </header>

      <section class="container yt-library-container" aria-label="Видеозаписи">
        <!-- БЕСКОНЕЧНАЯ СЕТКА -->
        <div id="yt-library-grid-main" class="yt-library-full-grid"></div>
      </section>
    </div>
  `;
}