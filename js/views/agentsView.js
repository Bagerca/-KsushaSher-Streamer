/* js/views/agentsView.js */

export function getAgentsView() {
    return `
    <div id="agents-page" class="agents-page-wrapper">
        <div class="agents-cinematic-bg" id="agents-cinematic-bg"></div>
        
        <div class="agents-top-nav">
            <button id="btn-agents-back" class="cyber-btn btn-agents-back"><i class="fas fa-chevron-left"></i> НАЗАД В ХАБ</button>
        </div>

        <div class="agents-content-wrapper container">
            <div class="agents-layout" id="agents-layout">
                
                <!-- ЛЕВАЯ КОЛОНКА: ДОСЬЕ -->
                <main class="agent-detail-zone" id="agent-detail-zone">
                    <div class="agent-header-row">
                        <div class="agent-big-avatar" id="agent-big-avatar"></div>
                        <div class="agent-header-info">
                            <h1 class="agent-name" id="agent-name">NAME</h1>
                            <div class="agent-role" id="agent-role">ROLE</div>
                            <div class="agent-stats-row" id="agent-stats-row">
                                <div class="agent-stat-badge" id="agent-lvl-badge"><i class="fas fa-star"></i> <span>LVL.1</span></div>
                                <div class="agent-stat-badge" id="agent-time-badge"><i class="fas fa-clock"></i> <span>0 дн. в сети</span></div>
                                <!-- Сюда JS добавит кнопку твича, если логин известен -->
                            </div>
                            
                            <div class="agent-progress-block">
                                <div class="agent-progress-header">
                                    <span class="ap-title">РАНГОВЫЙ ПРОГРЕСС</span>
                                    <span class="ap-text" id="agent-exp-text">0 / 0 XP</span>
                                </div>
                                <div class="agent-level-bar-container">
                                    <div class="agent-level-fill" id="agent-level-fill" style="width: 0%;"></div>
                                </div>
                                <div class="agent-progress-footer" id="agent-exp-hint">
                                    До следующего уровня: 0 дн.
                                </div>
                            </div>

                        </div>
                    </div>
                    
                    <div class="agent-description" id="agent-desc">
                        Описание отсутствует.
                    </div>
                    
                    <!-- Сюда JS будет вставлять либо секретные данные, либо список фаворитов -->
                    <div id="agent-dynamic-content"></div>
                </main>

                <!-- ПРАВАЯ КОЛОНКА: СПИСОК АГЕНТОВ -->
                <aside class="agents-list-col">
                    <div class="agents-list-header">
                        <span><i class="fas fa-users"></i> БАЗА АГЕНТОВ</span>
                        <span class="agents-count" id="agents-total-count">0</span>
                    </div>
                    <div class="agents-scroll-list" id="agents-scroll-list">
                        <!-- Карточки генерируются в JS -->
                    </div>
                </aside>
                
            </div>
        </div>
    </div>
    `;
}