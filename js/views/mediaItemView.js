/* js/views/mediaItemView.js */

export function getMediaItemView() {
    return `
    <div id="media-item-page" class="media-item-page">
        <!-- Кинематографичный фон -->
        <div class="item-cinematic-bg" id="item-cinematic-bg"></div>
        
        <div class="item-top-nav">
            <button id="btn-item-back" class="cyber-btn btn-item-back"><i class="fas fa-chevron-left"></i> НАЗАД В БАЗУ</button>
            <div class="item-status-badge" id="item-status-badge">STATUS</div>
        </div>

        <div class="item-content-wrapper container">
            <div class="item-layout" id="item-layout">
                
                <!-- ЛЕВАЯ КОЛОНКА: 3D-ПОСТЕРЫ, РЕЙТИНГ, БАРКОД -->
                <aside class="item-sidebar" id="item-sidebar">
                    <div class="item-poster-wrapper" id="item-poster-wrapper">
                        <div class="modal-poster-glow"></div>
                        <!-- Картинки генерируются в JS -->
                    </div>
                    
                    <div class="poster-pagination" id="item-poster-dots">
                        <!-- Точки пагинации -->
                    </div>
                    
                    <div class="item-rating-box" id="item-rating-box">
                        <div class="modal-segments" id="item-segments"></div>
                        <span id="item-rating-val">0.0</span>
                    </div>

                    <div class="modal-tech-barcode" id="item-barcode-container">
                        <div class="barcode-lines"></div>
                        <div class="tech-info">
                            <span>SYS_ID: <span class="t-val" id="item-sys-id">---</span></span>
                            <span>DATATYPE: <span class="t-val" id="item-datatype">---</span></span>
                        </div>
                    </div>
                </aside>

                <!-- ЦЕНТРАЛЬНАЯ КОЛОНКА: ОПИСАНИЕ И ПЛЕЕР -->
                <main class="item-main" id="item-main-zone">
                    <div class="item-text-zone">
                        <h1 class="item-title">
                            <span id="item-title-text">TITLE</span>
                            <a href="#" target="_blank" id="item-google-link" class="title-search-link" title="Искать в Google">
                                <i class="fab fa-google search-icon"></i>
                            </a>
                        </h1>
                        <p class="item-desc" id="item-desc-text">Description</p>
                    </div>

                    <div class="item-video-zone" id="item-video-zone" style="display: none;">
                        <div class="item-video-container">
                            <iframe id="item-iframe" src="" frameborder="0" allowfullscreen></iframe>
                        </div>
                    </div>
                </main>

                <!-- ПРАВАЯ КОЛОНКА: ПЛЕЙЛИСТ (Только если видео > 1) -->
                <aside class="item-playlist-col" id="item-playlist-col" style="display: none;">
                    <div class="item-playlist-header"><i class="fas fa-list"></i> АРХИВ ЗАПИСЕЙ</div>
                    <div class="item-playlist-list" id="item-playlist-list">
                        <!-- Карточки видео генерируются в JS -->
                    </div>
                </aside>
                
            </div>
        </div>
    </div>
    `;
}