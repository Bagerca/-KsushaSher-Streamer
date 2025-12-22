/* js/app.js */

// UI & Components
import { initializeUI } from './ui-components.js';
import { initMediaArchive } from './media-manager.js';
import { initModalSystem } from './media-modal.js';

// Visual Effects
import { startReptileProtocol, stopReptileProtocol } from './reptile-engine.js';
import { startDragonProtocol, stopDragonProtocol } from './dragon-engine.js';
import { initCometSystem, triggerCometShower, stopCometShower } from './comets.js';
import { initMatrixRain, toggleGodMode, isGodModeActive } from './matrix-engine.js'; 

// Data Modules
import { initSchedule } from './schedule.js';
import { initStats } from './stats.js';
import { initSubscribers } from './subscribers.js';

// Music Player
import { initMusicPlayer, toggleMusicMode } from './music-player.js';

// Application state
const AppState = {
    initialized: false
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
        
        // 1. Инициализация UI
        initializeUI();
        
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
        
        // 3. Запуск визуальных эффектов
        initCometSystem(); 
        initMatrixRain();  

        // 4. Инициализация музыкального плеера
        initMusicPlayer();
        
        // 5. Инициализация терминала
        initTerminalInput();
        runTerminalBoot();
        
        console.log('✅ Ksusha Sher website initialized successfully!');
        AppState.initialized = true;
        
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
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
    
    // Анимированная загрузка
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
        "[OBS] Dropped frames: 0 (0%)",
        "[OBS] Encoding profile: High",
        "[TETLA] Scanning chat logs...",
        "[TETLA] Syncing BTTV/7TV emotes...",
        "[TETLA] Moderation filter: ON",
        "[SEC] Unauthorized access blocked",
        "[SYS] Detecting coffee levels... LOW",
        "[BIO] Streamer heart rate: Normal",
        "[WARN] Entity 'Lizard' dormant",
        "[WARN] Entity 'Dragon' dormant"
    ];

    const asciiArts = [
        // MSU
        `<div style="font-family: 'Courier New', monospace; white-space: pre; line-height: 1.0; color: #a0a0a0; font-size: 10px; text-align: left; opacity: 0.7;">      <span style="color:#ff4444">★</span>\n      |\n     |:|\n    /:::\\\n   |:::::|\n   |::|::|\n  /|::|::|\\\n | |::|::| |\n_| |::|::| |_\n|   |::|::|   |\n|___|::|::|___|\n| H |==|==| H |\n_|___|__|__|___|_\n|:::::::::::::::::|</div>`,
        // CAT
        `<div style="font-family: 'Courier New', monospace; white-space: pre; line-height: 1.0; color: #fff; font-size: 12px; text-align: left; opacity: 0.7;">  |\\__/,|   (\`\\\n_.|o o  |_   ) )\n-(((---(((--------</div>`,
        // MOOSE
        `<div style="font-family: 'Courier New', monospace; white-space: pre; line-height: 1.0; color: #e0e0e0; font-size: 10px; text-align: left; opacity: 0.7;">   .n      .      .n\n  d  P    d  P   d|b\n 9   |   d|  '  d| P\n90000000b.     d0000000p\n ''900000' DIE 00P'</div>`
    ];

    const wrapLog = (text) => `<span style='color:#666; font-size:0.8rem'>${text}</span>`;

    setInterval(() => {
        if (isSystemNoiseAllowed && terminalHistory) {
            const rand = Math.random();

            if (rand > 0.7 && rand < 0.95) {
                let index;
                do {
                    index = Math.floor(Math.random() * messages.length);
                } while (index === lastIndex && messages.length > 1);
                
                lastIndex = index;
                addLogLine(wrapLog(messages[index]));
            }
            
            else if (rand >= 0.95) {
                const art = asciiArts[Math.floor(Math.random() * asciiArts.length)];
                addLogLine(`<span style="color:var(--neon-pink)">[SYSTEM GLITCH DETECTED]</span><br>${art}`, false, true);
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
            }).catch(err => {
                console.error('Ошибка копирования:', err);
                input.value = commandText;
                input.focus();
            });
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rawValue = input.value;
            const command = rawValue.trim().toLowerCase();
            
            if (!rawValue.trim()) return;

            const cmdLine = document.createElement('p');
            // Делаем галочку в истории зеленой для красоты
            cmdLine.innerHTML = `<span style="color:var(--neon-green); margin-right:8px;">></span>${rawValue}`;
            cmdLine.style.color = '#fff'; 
            cmdLine.style.margin = '0 0 5px 0';
            terminalHistory.appendChild(cmdLine);
            
            if(terminalBox) terminalBox.scrollTop = terminalBox.scrollHeight;
            
            let responseText = '';
            const godMode = isGodModeActive(); 

            // --- ОБРАБОТКА КОМАНД ---
            
            if (command === 'god' || command === 'godmode') {
                toggleGodMode();
                const isNowGod = isGodModeActive();
                
                const progressLine = addLogLine('', false, true);
                
                if (isNowGod) {
                    progressLine.style.color = 'var(--neon-pink)';
                    runProgressBarAnimation(progressLine, () => {
                        progressLine.innerHTML = '<span style="text-shadow: 0 0 10px var(--neon-pink); font-weight:bold;">⚠ REALITY INTEGRITY: 0% [MATRIX VISIBLE]</span><br><span style="color:#fff; opacity:0.7">Доступ к скрытым протоколам получен.</span>';
                    }, "OVERRIDING REALITY");
                } else {
                    progressLine.style.color = 'var(--neon-green)';
                    runProgressBarAnimation(progressLine, () => {
                        progressLine.innerHTML = 'REALITY INTEGRITY: RESTORED [NORMAL MODE]';
                    }, "RESTORING BACKUP");
                }

            } 
            else if (command === 'music' || command === 'player') {
                responseText = toggleMusicMode();
            }
            
            // --- СПИСОК КОМАНД (HELP) ---
            else if (command === 'help') {
                // 1. СИСТЕМА
                const sysCommands = [
                    { cmd: 'HELP', desc: 'Список команд' },
                    { cmd: 'CLEAR', desc: 'Очистить терминал' },
                    { cmd: 'STATUS', desc: 'Состояние систем' },
                    { cmd: 'GOD', desc: 'Режим доступа (Root)' },
                    { cmd: 'COFFEE', desc: 'Заправка' }
                ];

                // 2. ВИЗУАЛ
                const visCommands = [
                    { cmd: 'LIZARD', desc: 'Запуск: Рептилия' },
                    { cmd: 'DRAGON', desc: 'Запуск: Дракон' },
                    { cmd: 'COMET', desc: 'Запуск: Метеоры' }
                ];
                
                // 3. СЕКРЕТНО (Только God Mode)
                const godCommands = [
                    { cmd: 'MUSIC', desc: 'Музыкальный модуль' },
                    { cmd: 'MSU', desc: 'Архитектура' },
                    { cmd: 'CAT', desc: 'Meow Protocol' },
                    { cmd: 'HACK', desc: 'Взлом жопы' },
                    { cmd: 'MOOSE', desc: 'Die Human' },
                    { cmd: 'WIZARD', desc: 'Magic' }
                ];

                const buildCategory = (title, list) => {
                    let catHtml = `
                        <div style="
                            margin-top: 10px; 
                            margin-bottom: 5px; 
                            color: #666; 
                            font-size: 0.75rem; 
                            border-bottom: 1px dashed rgba(255,255,255,0.15); 
                            padding-bottom: 2px;">
                            // ${title} --------------------
                        </div>`;
                    
                    list.forEach(item => {
                        catHtml += `
                            <div class="cmd-list-row">
                                <span class="interactive-cmd" data-cmd="${item.cmd}" title="Скопировать">${item.cmd}</span>
                                <span class="cmd-desc">- ${item.desc}</span>
                            </div>
                        `;
                    });
                    return catHtml;
                };

                let html = '<div style="margin-bottom:5px; color:#888;">ДОСТУПНЫЕ ПРОТОКОЛЫ:</div>';
                
                html += buildCategory('SYSTEM', sysCommands);
                html += buildCategory('VISUALS', visCommands);

                if (godMode) {
                    html += buildCategory('CLASSIFIED [ROOT]', godCommands);
                }

                responseText = html;
                
            }
            // --- СКРЫТЫЕ АРТ-КОМАНДЫ (ТОЛЬКО В GOD MODE) ---
            else if (godMode && (command === 'msu' || command === 'building')) {
                responseText = `
<div style="width: 100%; text-align: center;">
    <div style="display: inline-block; text-align: left; font-family: 'Courier New', Consolas, monospace; white-space: pre; line-height: 1.0; color: #a0a0a0; font-size: 14px; font-weight: bold;">
          <span style="color: #ff4444;">★</span>
          |
         |:|
        /:::\\
       |:::::|
       |::|::|
      /|::|::|\\
     | |::|::| |
    _| |::|::| |_
   |   |::|::|   |
   |___|::|::|___|
   | H |==|==| H |
  _|___|__|__|___|_
 |:::::::::::::::::|
    </div>
</div>`;
            } else if (godMode && (command === 'cat' || command === 'kitty')) {
                responseText = `
<div style="width: 100%; text-align: center;">
    <div style="display: inline-block; text-align: left; font-family: 'Courier New', monospace; white-space: pre; line-height: 1.1; color: #fff; font-size: 14px;">
      |\\__/,|   (\`\\
    _.|o o  |_   ) )
   -(((---(((--------
    </div>
    <div style="color:var(--neon-green); font-size: 0.8em; margin-top:5px;">Meow_Protocol v.1.0 initiated</div>
</div>`;
            } else if (godMode && (command === 'hack' || command === 'sudo')) {
                responseText = `
<div style="width: 100%; text-align: left; font-family: 'Courier New', monospace; color: var(--neon-green); font-size: 13px;">
> INITIATING BRUTE FORCE...
> ACCESSING MAINFRAME...
> BYPASSING FIREWALL... [████████░░] 80%
<br>
<span style="color: #ff4444;">[ERROR]</span> SECURITY SYSTEM ALERT
<span style="color: #ff4444;">[ERROR]</span> NOT ENOUGH MANA
> TRYING AGAIN...
<span style="color: var(--neon-pink);">ACCESS GRANTED. WELCOME, ADMIN.</span>
</div>`;
            } else if (godMode && (command === 'moose' || command === 'skull')) {
                responseText = `
<div style="width: 100%; text-align: center;">
    <div style="display: inline-block; text-align: left; font-family: 'Courier New', monospace; white-space: pre; line-height: 1.0; color: #e0e0e0; font-size: 11px; font-weight: bold;">
       .n                   .                 .n
      d  P                 d  P              d|b
     9   |                d|  '             d| P
    90000000b.          .d000b .           d0000000p
   900000000000b'~     ~'0000b  d000b.~   ~x0000000000p
  9000000000000'         '900b d00P'         '0000000000P
     ''900000'   DIE      HUMAN      00P'
         9X.      .       .d|b.       .      .XP
          '9b.  .db       d000b       db.  .dP'
            '900000       '000'       00000P'
              '900         dib         00P'
                '          d|b          '
                    .      XXX      .
                  .d0b.  .d000b.  .d0b.
                 .d0000bd0000000bd0000b.
                 d000000000000000000000b
    </div>
</div>`;
            } else if (godMode && (command === 'wizard' || command === 'magic')) {
                responseText = `<div style="text-align: center; color: #b19cd9; font-size: 12px;">* MAGIC SPELL CASTED *</div>`;
            
            // --- ОБЫЧНЫЕ КОМАНДЫ ---
            } else if (command === 'lizard' || command === 'protocol 66') {
                stopDragonProtocol();
                startReptileProtocol();
                responseText = '<span style="color:var(--neon-green)">ЗАПУСК ПРОТОКОЛА "РЕПТИЛИЯ"...</span>';
                
            } else if (command === 'dragon' || command === 'dracarys') {
                stopReptileProtocol();
                startDragonProtocol();
                responseText = '<span style="color:var(--neon-pink); font-weight:bold; text-shadow:0 0 10px var(--neon-pink);">ВНИМАНИЕ: СУЩНОСТЬ "ДРАКОН" АКТИВИРОВАНА!</span>';
                
            } else if (command === 'comet' || command === 'meteor') {
                triggerCometShower();
                responseText = '<span style="color:var(--neon-pink)">ВНИМАНИЕ: ОБНАРУЖЕН МЕТЕОРИТНЫЙ ПОТОК!</span>';

            } else if (command === 'coffee' || command === 'tea') {
                responseText = `
<div style="width: 100%; text-align: center;">
    <div style="display: inline-block; text-align: left; font-family: 'Courier New', monospace; white-space: pre; line-height: 1.1; color: #d4a373; font-size: 14px; font-weight: bold;">
      (  )   (   )  )
       ) (   )  (  (
       ..........
       |        |]
       \\      /    
        \`----'
    </div>
    <div style="margin-top:5px; color:#fff; font-size: 0.9em;">Система заправлена кофеином.</div>
</div>`;

            } else if (command === 'status') {
                responseText = 'СИСТЕМЫ В НОРМЕ. TETLA V5.6 АКТИВНА.';
                
            } else if (command === 'clear') {
                terminalHistory.innerHTML = '';
                stopReptileProtocol(); 
                stopDragonProtocol();  
                stopCometShower();     
                responseText = ''; 
                
            } else {
                responseText = `<span style="color:#ff4444">ОШИБКА: КОМАНДА НЕ РАСПОЗНАНА</span>`;
            }

            if (responseText) {
                addLogLine(responseText, false, true);
            }

            input.value = '';
        }
    });
}

// Global Error Handlers
window.addEventListener('error', function(e) {
    console.error('🚨 Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled promise rejection:', e.reason);
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