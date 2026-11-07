/* js/views/tierlistView.js */

export function getTierlistView() {
    return `
    <div id="tierlist-app" class="view-mode">
        <main class="tier-board-wrapper">
            <div id="capture-zone" class="capture-container">
                <!-- Водяной знак для скриншота -->
                <div class="watermark-export">TETLA_OS // TIER MAKER</div>
                
                <div class="tier-board" id="tier-board">
                    <!-- Ряды генерируются через JS -->
                </div>
                
                <button id="btn-add-row" class="add-row-btn no-capture edit-only">
                    <i class="fas fa-plus"></i> ДОБАВИТЬ КАТЕГОРИЮ
                </button>
            </div>
        </main>

        <!-- ПОДВАЛ (Скрыт в режиме просмотра) -->
        <footer class="tier-pool-wrapper edit-only">
            <div class="pool-header">
                <div class="pool-controls-group">
                    <button id="btn-load-games" class="cyber-btn active"><i class="fas fa-gamepad"></i> ИГРЫ</button>
                    <button id="btn-load-movies" class="cyber-btn"><i class="fas fa-film"></i> КИНО</button>
                    <div class="divider"></div>
                    
                    <!-- Кнопки РЕДАКТИРОВАНИЯ -->
                    <button id="btn-reset" class="cyber-btn danger edit-only" title="Сбросить"><i class="fas fa-trash"></i></button>
                    <button id="btn-export-json" class="cyber-btn warning edit-only" title="Сохранить JSON"><i class="fas fa-file-code"></i></button>
                    <button id="btn-export-png" class="cyber-btn success edit-only" title="Сохранить скриншот"><i class="fas fa-camera"></i> PNG</button>
                </div>
                
                <div class="pool-title edit-only">
                    <span class="pool-counter" id="pool-counter">ОСТАЛОСЬ: 0</span>
                </div>
                
                <div class="search-module edit-only" id="search-module">
                    <i class="fas fa-search search-icon" id="search-icon-default"></i>
                    <input type="text" id="pool-search" placeholder="Поиск по базе..." autocomplete="off">
                    <div class="search-hotkey" id="search-hotkey-hint">Ctrl+K</div>
                    <div class="search-suggestions" id="search-suggestions"></div>
                </div>
            </div>
            
            <div class="tier-pool dropzone edit-only" id="tier-pool"></div>
        </footer>

        <!-- ПАНЕЛЬ УПРАВЛЕНИЯ РЕЖИМАМИ (Фиксированная сверху справа) -->
        <div class="mode-controls">
            <!-- КНОПКА ВОЗВРАТА НА ДАШБОРД (Зачищены инлайновые стили) -->
            <button id="btn-back-home" class="cyber-btn btn-home-return"><i class="fas fa-home"></i> ВЕРНУТЬСЯ НА БАЗУ</button>
            <div class="divider"></div>
            
            <button id="btn-enable-edit" class="cyber-btn warning view-only"><i class="fas fa-pen"></i> ИЗМЕНИТЬ</button>
            <button id="btn-exit-edit" class="cyber-btn danger edit-only"><i class="fas fa-times"></i> ОТМЕНА</button>
        </div>
    </div>
    `;
}