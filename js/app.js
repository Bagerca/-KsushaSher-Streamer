/* js/app.js */

// UI & Components
import { initializeUI } from './ui-components.js';
import { initMediaArchive } from './media-manager.js';
import { initModalSystem } from './media-modal.js';

// Visual Effects
import { startReptileProtocol, stopReptileProtocol } from './reptile-engine.js';
import { startDragonProtocol, stopDragonProtocol } from './dragon-engine.js';
import { initCometSystem, triggerCometShower, stopCometShower } from './comets.js';
import { initMatrixRain, stopMatrix, toggleGodMode, isGodModeActive } from './matrix-engine.js'; 

// Data Modules
import { initSchedule } from './schedule.js';
import { initStats } from './stats.js';
import { initSubscribers } from './subscribers.js';

// Music Player
import { initMusicPlayer, toggleMusicMode } from './music-player.js';

// Application state
const AppState = {
    initialized: false,
    fxMode: 0 // 0=All On, 1=No Comets, 2=No Stars, 3=All Off
};

// DOM Elements for Terminal
const terminalHistory = document.getElementById('terminal-history');
const terminalBox = document.getElementById('terminal-box');

// Флаг для управления системным шумом (спамом)
let isSystemNoiseAllowed = true;

// Initialize application
async function initializeApplication() {
    if (AppState.initialized) return;
    
    try {
        console.log('🚀 Starting Ksusha Sher website initialization...');
        
        // 1. Инициализация UI и Меню Настроек
        initializeUI();
        initMagicMenu(); 
        
        // 2. Загрузка данных
        await Promise.all([
            initSchedule(),
            initStats(),
            initSubscribers(),
            initMediaArchive(),
            initModalSystem()
        ]);
        
        // Автообновление данных каждые 5 минут
        setInterval(() => {
            initSchedule();
            initStats();
        }, 300000);
        
        // 3. Запуск визуальных эффектов (По умолчанию ВКЛ)
        initCometSystem(); 
        initMatrixRain();  

        // 4. Инициализация музыкального плеера
        initMusicPlayer();
        
        // 5. Инициализация терминала
        initTerminalInput();
        initTerminalCustomScroll(); 
        runTerminalBoot();
        
        console.log('✅ Ksusha Sher website initialized successfully!');
        AppState.initialized = true;
        
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
    }
}

/**
 * --- ЛОГИКА MAGIC MENU (SETTINGS HUD) ---
 */
function initMagicMenu() {
    const menuContainer = document.querySelector('.magic-menu-container');
    const toggleBtn = document.querySelector('.magic-toggle');

    if (menuContainer && toggleBtn) {
        // Открытие/Закрытие меню
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuContainer.classList.toggle('active');
        });
        
        // Закрыть при клике вне меню
        document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target) && menuContainer.classList.contains('active')) {
                menuContainer.classList.remove('active');
            }
        });

        // --- КНОПКА 1: ОЧИСТКА СУЩЕСТВ (Skull) ---
        const btnClear = document.getElementById('btn-clear-creatures');
        if (btnClear) {
            btnClear.addEventListener('click', (e) => {
                e.preventDefault();
                // Останавливаем существ
                stopReptileProtocol();
                stopDragonProtocol();
                
                // Лог в терминал
                addLogLine("<span style='color:var(--neon-pink)'>[SYSTEM]</span> CREATURE PROTOCOLS TERMINATED.", false, true);
                
                // Визуальный фидбек нажатия (мигание розовым)
                btnClear.classList.add('active-state'); // Временно добавляем стиль
                btnClear.style.color = 'var(--neon-pink)';
                setTimeout(() => {
                    btnClear.classList.remove('active-state');
                    btnClear.style.color = '';
                }, 300);
            });
        }

        // --- КНОПКА 2: ЦИКЛ ВИЗУАЛЬНЫХ ЭФФЕКТОВ (Eye) ---
        const btnFx = document.getElementById('btn-toggle-fx');
        if (btnFx) {
            btnFx.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Переключаем режим: 0 -> 1 -> 2 -> 3 -> 0
                AppState.fxMode = (AppState.fxMode + 1) % 4;
                
                const body = document.body;
                let logMsg = "";

                // Сначала очищаем все классы модификаторов
                body.classList.remove('state-no-comets', 'state-no-stars');

                switch (AppState.fxMode) {
                    case 0: // ВСЕ ВКЛЮЧЕНО
                        // Матрицу включаем, если была выключена
                        initMatrixRain();
                        logMsg = "VISUALS: <span class='terminal-ok'>ALL SYSTEMS ONLINE</span>";
                        btnFx.classList.remove('disabled-state');
                        btnFx.classList.add('active-state');
                        break;
                        
                    case 1: // ТОЛЬКО ЗВЕЗДЫ (БЕЗ КОМЕТ)
                        body.classList.add('state-no-comets');
                        logMsg = "VISUALS: <span style='color:#ffd700'>COMETS DISABLED</span>";
                        break;
                        
                    case 2: // ТОЛЬКО КОМЕТЫ (БЕЗ ЗВЕЗД/ФОНА)
                        body.classList.add('state-no-stars');
                        logMsg = "VISUALS: <span style='color:#007bff'>STARS DISABLED</span>";
                        break;
                        
                    case 3: // ВСЕ ВЫКЛЮЧЕНО (ПРОИЗВОДИТЕЛЬНОСТЬ)
                        body.classList.add('state-no-comets', 'state-no-stars');
                        stopMatrix(); // Останавливаем матрицу для макс. производительности
                        logMsg = "VISUALS: <span style='color:#555'>PERFORMANCE MODE (ALL OFF)</span>";
                        btnFx.classList.remove('active-state');
                        btnFx.classList.add('disabled-state');
                        break;
                }
                
                addLogLine(`[SYS] ${logMsg}`, false, true);
            });
        }

        // --- КНОПКА 3: МУЗЫКАЛЬНЫЙ РЕЖИМ (Headphones) ---
        const btnMusic = document.getElementById('btn-toggle-music');
        if (btnMusic) {
            btnMusic.addEventListener('click', (e) => {
                e.preventDefault();
                const msg = toggleMusicMode(); 
                if(msg) addLogLine(msg, false, true);
                
                // Переключаем визуальное состояние кнопки
                // (Сама логика переключения классов есть внутри toggleMusicMode, но для надежности можно и тут)
                if (btnMusic.classList.contains('active-state')) {
                    btnMusic.classList.remove('active-state');
                } else {
                    btnMusic.classList.add('active-state');
                }
            });
        }

        // --- КНОПКА 4: ОБНОВИТЬ ДАННЫЕ (Sync) ---
        const btnRefresh = document.getElementById('btn-refresh-data');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', async (e) => {
                e.preventDefault();
                const loaderLine = addLogLine("SYNCING DATABASE...", false, true);
                
                // Добавляем анимацию вращения
                const icon = btnRefresh.querySelector('i');
                icon.style.transition = 'transform 1s ease';
                icon.style.transform = 'rotate(360deg)';
                
                try {
                    await initSchedule();
                    await initStats();
                    loaderLine.innerHTML = "DATABASE SYNC: <span class='terminal-ok'>COMPLETED</span>";
                } catch(e) {
                    loaderLine.innerHTML = "DATABASE SYNC: <span class='terminal-err'>FAILED</span>";
                }
                
                setTimeout(() => {
                    icon.style.transition = 'none';
                    icon.style.transform = 'rotate(0deg)';
                }, 1000);
            });
        }
    }
}

/**
 * --- ЛОГИКА ТЕРМИНАЛА ---
 */

const delay = ms => new Promise(res => setTimeout(res, ms));

export function addLogLine(html, isTyping = false, forceScroll = false) {
    if (!terminalHistory) return;
    
    const p = document.createElement('p');
    p.innerHTML = html;
    p.style.margin = '0 0 5px 0';
    
    if (isTyping) {
        p.style.borderRight = '7px solid var(--neon-green)';
        p.style.width = 'fit-content';
        p.style.animation = 'blink 0.5s step-end infinite';
    }
    
    terminalHistory.appendChild(p);
    
    if (terminalBox) {
        const distanceToBottom = terminalBox.scrollHeight - terminalBox.scrollTop - terminalBox.clientHeight;
        const threshold = 100; 
        
        if (forceScroll || distanceToBottom < threshold) {
            terminalBox.scrollTop = terminalBox.scrollHeight;
        }
    }
    
    return p;
}

export function setSystemNoiseState(isEnabled) {
    isSystemNoiseAllowed = isEnabled;
}

// Анимация прогресс-бара
function runProgressBarAnimation(logLine, onComplete, label = "PROCESSING") {
    let percent = 0;
    const barWidth = 15; 
    const speed = label === "LOADING KERNEL" ? 30 : 50;

    const interval = setInterval(() => {
        percent += 4; 
        
        const filledCount = Math.floor(barWidth * (percent / 100));
        const emptyCount = barWidth - filledCount;
        
        const bar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
        
        logLine.innerHTML = `> ${label}... [${bar}] ${percent}%`;
        
        if (percent >= 100) {
            clearInterval(interval);
            setTimeout(onComplete, 200);
        }
    }, speed);
}

// Загрузка системы (Boot Sequence)
async function runTerminalBoot() {
    if (!terminalHistory) return;
    
    terminalHistory.innerHTML = '';
    
    await delay(500);
    let line = addLogLine("INITIALIZING TETLA_OS v5.6...", true, true);
    await delay(800);
    line.style.borderRight = 'none';
    
    addLogLine("CHECKING MEMORY... <span class='terminal-ok'>OK</span>", false, true);
    await delay(300);
    
    const loadingLine = addLogLine("", false, true);
    await new Promise((resolve) => {
        runProgressBarAnimation(loadingLine, () => {
            loadingLine.innerHTML = "CORE MODULES: <span class='terminal-ok'>LOADED</span>";
            resolve();
        }, "LOADING KERNEL");
    });

    addLogLine("CONNECTING TO TWITCH API... <span class='terminal-ok'>CONNECTED</span>", false, true);
    await delay(400);
    addLogLine("> ПРОТОКОЛЫ ЗАЩИТЫ: <span class='terminal-ok'>АКТИВНЫ</span>", false, true);
    await delay(200);
    addLogLine("> МОДЕРАЦИЯ ЧАТА: <span class='terminal-ok'>АКТИВНА</span>", false, true);
    await delay(200);
    addLogLine("<span style='opacity:0.7'>Введите 'help' для списка команд...</span>", false, true);
    
    startSystemNoise();
}

function startSystemNoise() {
    let lastIndex = -1;
    const messages = [
        "[SYS] Ping: 24ms check ok",
        "[SYS] CPU Temp: 45°C",
        "[SYS] GPU Load: 89% [Rendering]",
        "[SYS] RAM Usage: 12.4GB / 16GB",
        "[BG] Garbage collection...",
        "[BG] Cooling fans: 2400 RPM",
        "[PWR] Voltage stable: 1.2V",
        "[DRV] NVIDIA Drivers: Up to date",
        "[NET] Packet received from 127.0.0.1",
        "[NET] Upload bitrate: 6000 kbps",
        "[TETLA] Scanning chat logs...",
        "[TETLA] Syncing BTTV/7TV emotes...",
        "[SEC] Unauthorized access blocked",
        "[WARN] Entity 'Lizard' dormant"
    ];

    const wrapLog = (text) => `<span style='color:#666; font-size:0.8rem'>${text}</span>`;

    setInterval(() => {
        if (isSystemNoiseAllowed && terminalHistory) {
            const rand = Math.random();
            if (rand > 0.7 && rand < 0.95) {
                let index;
                do { index = Math.floor(Math.random() * messages.length); } 
                while (index === lastIndex && messages.length > 1);
                lastIndex = index;
                addLogLine(wrapLog(messages[index]));
            }
            if (terminalHistory.children.length > 50) {
                terminalHistory.removeChild(terminalHistory.firstChild);
            }
        }
    }, 8000);
}

function initTerminalInput() {
    const input = document.getElementById('cmd-input');
    if (!input || !terminalBox || !terminalHistory) return;

    terminalBox.addEventListener('click', (e) => {
        if (!e.target.closest('.interactive-cmd')) {
            input.focus();
        }
    });

    terminalHistory.addEventListener('click', (e) => {
        const cmdEl = e.target.closest('.interactive-cmd');
        if (cmdEl) {
            const commandText = cmdEl.dataset.cmd;
            navigator.clipboard.writeText(commandText).then(() => {
                input.value = commandText;
                input.focus();
            }).catch(() => {
                input.value = commandText;
                input.focus();
            });
        }
    });

    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const rawValue = input.value;
            const commandParts = rawValue.trim().split(/\s+/);
            const command = commandParts[0].toLowerCase();
            
            if (!rawValue.trim()) return;

            const cmdLine = document.createElement('p');
            cmdLine.innerHTML = `<span style="color:var(--neon-green); margin-right:8px;">></span>${rawValue}`;
            cmdLine.style.color = '#fff'; 
            cmdLine.style.margin = '0 0 5px 0';
            terminalHistory.appendChild(cmdLine);
            
            if(terminalBox) terminalBox.scrollTop = terminalBox.scrollHeight;
            
            let responseText = '';
            const godMode = isGodModeActive(); 

            // --- КОМАНДЫ ---
            if (command === 'scan' || command === 'generate') {
                const urls = commandParts.slice(1); 
                if (urls.length === 0) {
                    responseText = `<span style="color:#ffd700">USAGE:</span> scan <url>`;
                } else {
                    responseText = `<span style="color:#ffd700">SCAN:</span> See console for output.`;
                }
            }
            else if (command === 'god' || command === 'godmode') {
                toggleGodMode();
                const isNowGod = isGodModeActive();
                const progressLine = addLogLine('', false, true);
                if (isNowGod) {
                    progressLine.style.color = 'var(--neon-pink)';
                    runProgressBarAnimation(progressLine, () => {
                        progressLine.innerHTML = '<span style="text-shadow: 0 0 10px var(--neon-pink); font-weight:bold;">⚠ REALITY INTEGRITY: 0%</span>';
                    }, "OVERRIDING REALITY");
                } else {
                    progressLine.style.color = 'var(--neon-green)';
                    runProgressBarAnimation(progressLine, () => {
                        progressLine.innerHTML = 'REALITY INTEGRITY: RESTORED';
                    }, "RESTORING BACKUP");
                }
            } 
            else if (command === 'music' || command === 'player') {
                responseText = toggleMusicMode();
            }
            else if (command === 'help') {
                responseText = `
                <div style="color:#888;">ДОСТУПНЫЕ ПРОТОКОЛЫ:</div>
                <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="clear">CLEAR</span> - Очистить / Убрать существ</div>
                <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="lizard">LIZARD</span> - Запуск: Рептилия</div>
                <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="dragon">DRAGON</span> - Запуск: Дракон</div>
                <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="comet">COMET</span> - Запуск: Метеоры</div>
                <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="status">STATUS</span> - Статус систем</div>
                `;
            }
            else if (command === 'lizard') {
                stopDragonProtocol();
                startReptileProtocol();
                responseText = '<span style="color:var(--neon-green)">ЗАПУСК ПРОТОКОЛА "РЕПТИЛИЯ"...</span>';
            } 
            else if (command === 'dragon') {
                stopReptileProtocol();
                startDragonProtocol();
                responseText = '<span style="color:var(--neon-pink); font-weight:bold;">ДРАКОН АКТИВИРОВАН!</span>';
            } 
            else if (command === 'comet') {
                triggerCometShower();
                responseText = '<span style="color:var(--neon-pink)">МЕТЕОРИТНЫЙ ПОТОК!</span>';
            } 
            else if (command === 'status') {
                responseText = 'СИСТЕМЫ В НОРМЕ.';
            } 
            else if (command === 'clear') {
                terminalHistory.innerHTML = '';
                stopReptileProtocol(); 
                stopDragonProtocol();  
                stopCometShower();     
                responseText = 'PROTOCOLS CLEARED.'; 
            } else {
                responseText = `<span style="color:#ff4444">ОШИБКА: НЕИЗВЕСТНАЯ КОМАНДА</span>`;
            }

            if (responseText) {
                addLogLine(responseText, false, true);
            }
            input.value = '';
        }
    });
}

function initTerminalCustomScroll() {
    if (!terminalBox) return;
    const SCROLL_FACTOR = 0.3; 
    terminalBox.addEventListener('wheel', (e) => {
        e.preventDefault();
        terminalBox.scrollTop += e.deltaY * SCROLL_FACTOR;
    }, { passive: false });
}

// Global Error Handlers
window.addEventListener('error', function(e) {
    console.error('🚨 Global error caught:', e.error);
});

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApplication();
    });
} else {
    initializeApplication();
}

window.AppState = AppState;