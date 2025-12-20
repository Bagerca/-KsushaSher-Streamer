/* js/app.js */

// UI & Components
import { initializeUI } from './ui-components.js';
import { initMediaArchive } from './media-manager.js';
import { initModalSystem } from './media-modal.js';

// Visual Effects
import { startReptileProtocol, stopReptileProtocol } from './reptile-engine.js';
import { startDragonProtocol, stopDragonProtocol } from './dragon-engine.js';
import { initCometSystem, triggerCometShower, stopCometShower } from './comets.js';

// Data Modules
import { initSchedule } from './schedule.js';
import { initStats } from './stats.js';
import { initSubscribers } from './subscribers.js';

// Music Player (NEW)
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
        
        // 3. Запуск визуальных эффектов (Кометы)
        initCometSystem();

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

/**
 * Добавляет строку в лог.
 * EXPORT добавлен, чтобы вызывать из music-player.js
 * @param {string} html - HTML контент строки (системный)
 * @param {boolean} isTyping - эффект печатания
 * @param {boolean} forceScroll - принудительно скроллить вниз (для ответов на команды)
 */
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
    
    // --- УМНЫЙ СКРОЛЛ ---
    if (terminalBox) {
        // Расстояние от текущей позиции до самого низа
        const distanceToBottom = terminalBox.scrollHeight - terminalBox.scrollTop - terminalBox.clientHeight;
        const threshold = 100; // Если мы ближе 100px к низу, то скроллим
        
        // Скроллим, если это ответ на команду (forceScroll) ИЛИ если пользователь уже внизу
        if (forceScroll || distanceToBottom < threshold) {
            terminalBox.scrollTop = terminalBox.scrollHeight;
        }
    }
    
    return p;
}

/**
 * Управление состоянием системного шума.
 * Вызывается из music-player при смене режима.
 */
export function setSystemNoiseState(isEnabled) {
    isSystemNoiseAllowed = isEnabled;
}

// Загрузка системы (визуальный эффект)
async function runTerminalBoot() {
    if (!terminalHistory) return;
    
    terminalHistory.innerHTML = '';
    
    await delay(500);
    // При загрузке используем forceScroll=true, чтобы пользователь видел процесс
    let line = addLogLine("INITIALIZING TETLA_OS v5.6...", true, true);
    await delay(800);
    line.style.borderRight = 'none';
    
    line = addLogLine("CHECKING MEMORY... <span class='terminal-ok'>OK</span>", false, true);
    await delay(400);
    
    line = addLogLine("LOADING CORE MODULES...", false, true);
    await delay(600);
    
    line = addLogLine("CONNECTING TO TWITCH API... <span class='terminal-ok'>CONNECTED</span>", false, true);
    await delay(600);
    
    line = addLogLine("> ПРОТОКОЛЫ ЗАЩИТЫ: <span class='terminal-ok'>АКТИВНЫ</span>", false, true);
    await delay(400);
    
    line = addLogLine("> МОДЕРАЦИЯ ЧАТА: <span class='terminal-ok'>АКТИВНА</span>", false, true);
    await delay(400);
    
    line = addLogLine("<span style='opacity:0.7'>Введите 'help' для списка команд...</span>", false, true);
    
    startSystemNoise();
}

// Случайные системные сообщения
function startSystemNoise() {
    let lastIndex = -1;

    const messages = [
        // --- СИСТЕМА И ЖЕЛЕЗО ---
        "[SYS] Ping: 24ms check ok",
        "[SYS] CPU Temp: 45°C",
        "[SYS] CPU Temp: 52°C (Rising)",
        "[SYS] GPU Load: 89% [Rendering]",
        "[SYS] RAM Usage: 12.4GB / 16GB",
        "[BG] Garbage collection...",
        "[BG] Cooling fans: 2400 RPM",
        "[PWR] Voltage stable: 1.2V",
        "[DRV] NVIDIA Drivers: Up to date",
        
        // --- СЕТЬ И СТРИМ ---
        "[NET] Packet received from 127.0.0.1",
        "[NET] Upload bitrate: 6000 kbps",
        "[OBS] Dropped frames: 0 (0%)",
        "[OBS] Encoding profile: High",
        "[OBS] Scene switched: 'Just Chatting'",
        "[NET] Handshake established",
        "[WARN] Bitrate fluctuation detected",
        
        // --- БОТ И ЧАТ ---
        "[TETLA] Scanning chat logs...",
        "[TETLA] Syncing BTTV/7TV emotes...",
        "[TETLA] Moderation filter: ON",
        "[TETLA] Analysing cringe levels...",
        "[CHAT] Connecting to IRC...",
        "[CHAT] Spam protection active",
        
        // --- ЛОР И ПРИКОЛЫ ---
        "[SEC] Unauthorized access blocked",
        "[SYS] Detecting coffee levels... LOW",
        "[BIO] Streamer heart rate: Normal",
        "[GAME] Injecting overlays...",
        "[SYS] Protocol 'Horror' standing by",
        "[WARN] Entity 'Lizard' dormant",
        "[WARN] Entity 'Dragon' dormant"
    ];

    const wrapLog = (text) => `<span style='color:#666; font-size:0.8rem'>${text}</span>`;

    setInterval(() => {
        // ПРОВЕРКА ФЛАГА: Если шум разрешен (не режим музыки), пишем логи
        if (isSystemNoiseAllowed && Math.random() > 0.7 && terminalHistory) {
            let index;
            do {
                index = Math.floor(Math.random() * messages.length);
            } while (index === lastIndex && messages.length > 1);
            
            lastIndex = index;

            // Здесь forceScroll = false, чтобы не дергать скролл, если пользователь читает историю
            addLogLine(wrapLog(messages[index]));
            
            if (terminalHistory.children.length > 50) {
                terminalHistory.removeChild(terminalHistory.firstChild);
            }
        }
    }, 8000);
}

/**
 * Обработка ввода команд + Клик по командам
 */
function initTerminalInput() {
    const input = document.getElementById('cmd-input');

    if (!input || !terminalBox || !terminalHistory) return;

    // Фокус на инпут при клике на терминал
    terminalBox.addEventListener('click', (e) => {
        if (!e.target.closest('.interactive-cmd')) {
            input.focus();
        }
    });

    // --- ЛОГИКА КЛИКА ПО КОМАНДЕ (КОПИРОВАНИЕ) ---
    terminalHistory.addEventListener('click', (e) => {
        const cmdEl = e.target.closest('.interactive-cmd');
        if (cmdEl) {
            const commandText = cmdEl.dataset.cmd;
            
            // Копируем и вставляем в инпут без "OK" эффекта
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

    // --- ОБРАБОТКА ВВОДА (ENTER) ---
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rawValue = input.value;
            const command = rawValue.trim().toLowerCase();
            
            if (!rawValue.trim()) return;

            // --- FIX Self-XSS: Используем textContent вместо innerHTML ---
            const cmdLine = document.createElement('p');
            cmdLine.textContent = `> ${rawValue}`; 
            cmdLine.style.color = '#fff'; 
            cmdLine.style.margin = '0 0 5px 0';
            terminalHistory.appendChild(cmdLine);
            
            // Принудительный скролл при вводе команды
            if(terminalBox) terminalBox.scrollTop = terminalBox.scrollHeight;
            
            let responseText = '';
            
            // --- ОБРАБОТКА КОМАНД ---
            
            if (command === 'lizard' || command === 'protocol 66') {
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

            } else if (command === 'music' || command === 'player' || command === 'pod') {
                // НОВАЯ КОМАНДА: МУЗЫКАЛЬНЫЙ ПЛЕЕР
                // Функция toggleMusicMode внутри себя вызывает setSystemNoiseState(false/true)
                const resultMsg = toggleMusicMode();
                responseText = resultMsg;

            } else if (command === 'msu' || command === 'building') {
                // ПАСХАЛКА: ЗДАНИЕ (Выровненное CSS)
                const buildingArt = `
<div style="width: 100%; text-align: center;">
    <div style="display: inline-block; text-align: left; font-family: 'Courier New', Consolas, monospace; white-space: pre; line-height: 1.0; color: #a0a0a0; font-size: 14px; font-weight: bold; text-shadow: none;">
          <span style="color: #ff4444; text-shadow: 0 0 8px #ff4444;">★</span>
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
                responseText = buildingArt;

            } else if (command === 'coffee' || command === 'tea') {
                // ПАСХАЛКА: КОФЕ
                const coffeeArt = `
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
                responseText = coffeeArt;

            } else if (command === 'cat' || command === 'kitty') {
                // ПАСХАЛКА: КОТ
                const catArt = `
<div style="width: 100%; text-align: center;">
    <div style="display: inline-block; text-align: left; font-family: 'Courier New', monospace; white-space: pre; line-height: 1.1; color: #fff; font-size: 14px;">
      |\\__/,|   (\`\\
    _.|o o  |_   ) )
   -(((---(((--------
    </div>
    <div style="color:var(--neon-green); font-size: 0.8em; margin-top:5px;">Meow_Protocol v.1.0 initiated</div>
</div>`;
                responseText = catArt;

            } else if (command === 'hack' || command === 'sudo') {
                // ПАСХАЛКА: ВЗЛОМ
                const hackArt = `
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
                responseText = hackArt;

            } else if (command === 'moose' || command === 'skull' || command === 'exploit') {
                // ПАСХАЛКА: ХАКЕРСКИЙ ЛОСЬ/ЧЕРЕП
                const mooseArt = `
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
    <div style="margin-top: 10px; color: #ccc; font-family: 'Courier New', monospace; font-size: 12px;">
        Enumerating Target.....................<span style="color: var(--neon-green); font-weight: bold;">[COMPLETE]</span>
    </div>
</div>`;
                responseText = mooseArt;

            } else if (command === 'wizard' || command === 'magic') {
                // ПАСХАЛКА: ВОЛШЕБНИК
                const wizardArt = `
<div style="width: 100%; text-align: center;">
    <div style="display: inline-block; text-align: left; font-family: 'Courier New', monospace; white-space: pre; line-height: 1.0; color: #b19cd9; font-size: 10px; font-weight: bold;">
         .m.                                   ,_
         ' ;M;                                ,;m \`
           ;M;.           ,      ,           ;SMM;
          ;;Mm;         ,;  ____  ;,         ;SMM;
         ;;;MM;        ; (.MMMMMM.) ;       ,SSMM;;
       ,;;;mMp'        l  ';mmmm;/  j       SSSMM;;
     .;;;;;MM;         .\\,.mmSSSm,,/,      ,SSSMM;;;
    ;;;;;;mMM;        .;MMmSSSSSSSmMm;     ;MSSMM;;;;
   ;;;;;;mMSM;     ,_ ;MMmS;;;;;;mmmM;  -,;MMMMMMm;;;;
  ;;;;;;;MMSMM;     \\"* ;M;( ( '') );m;*"/ ;MMMMMM;;;;;,
 .;;;;;;mMMSMM;      \\(@;! _     _ !;@)/ ;MMMMMMMM;;;;;,
 ;;;;;;;MMSSSM;       ;,;.*o*> <*o*.;m; ;MMMMMMMMM;;;;;;,
.;;;;;;;MMSSSMM;     ;Mm;           ;M;,MMMMMMMMMMm;;;;;;.
;;;;;;;mmMSSSMMMM,   ;Mm;,   '-    ,;M;MMMMMMMSMMMMm;;;;;;;
;;;;;;;MMMSSSMMMMMMMm;Mm;;,  ___  ,;SmM;MMMMMMSSMMMM;;;;;;;;
;;'";;;MMMSSSSMMMMMM;MMmS;;,  "  ,;SmMM;MMMMMMSSMMMM;;;;;;;;.
!   ;;;MMMSSSSSMMMMM;MMMmSS;;._.;;SSmMM;MMMMMMSSMMMM;;;;;;;;;
    ;;;;*MSSSSSSMMMP;Mm*"'q;'   \`;p*"*M;MMMMMSSSSMMM;;;;;;;;;
    ';;;  ;SS*SSM*M;M;'     \`-.        ;;MMMMSSSSSMM;;;;;;;;;,
     ;;;. ;P  \`q; qMM.                 ';MMMMSSSSSMp' ';;;;;;;
     ;;;; ',    ; .mm!     \\.   \`.   /  ;MMM' \`qSS'    ';;;;;;
     ';;;       ' mmS';     ;     ,  \`. ;'M'   \`S       ';;;;;
      \`;;.        mS;; \`;    ;     ;    ;M,!     '  luk   ';;;;
       ';;       .mS;;, ;   '. o  ;   oMM;                ;;;;
        ';;      MMmS;; \`,   ;._.' -_.'MM;                 ;;;
         \`;;     MMmS;;; ;   ;      ;  MM;                 ;;;
           \`'.   'MMmS;; \`;) ',    .' ,M;'                 ;;;
              \\    '' ''; ;   ;    ;  ;'                   ;;
               ;        ; \`,  ;    ;  ;                   ;;
                        |. ;  ; (. ;  ;      _.-.         ;;
           .-----..__  /   ;  ;   ;' ;\\  _.-" .- \`.      ;;
         ;' ___      \`*;   \`; ';  ;  ; ;'  .-'    :      ;
         ;     """*-.   \`.  ;  ;  ;  ; ' ,'      /       |
         ',          \`-_    (.--',\`--'..'      .'        ',
           \`-_          \`*-._'.\\\\\\;||\\\\)     ,'
              \`"*-._        "* \`-ll_ll'l    ,'
                 ,==;*-._           "-.  .'
              _-'    "*-=\`*;-._        ;'
            ."            ;'  ;"*-.    \`
            ;   ____      ;//'     "-   \`,
            \`+   .-/                 ".\\\\;
              \`*" /                    "'
    </div>
</div>`;
                responseText = wizardArt;
                
            } else if (command === 'help') {
                const commands = [
                    { cmd: 'HELP', desc: 'Список команд' },
                    { cmd: 'CLEAR', desc: 'Очистить терминал' },
                    { cmd: 'STATUS', desc: 'Состояние систем' },
                    { cmd: 'LIZARD', desc: 'Запуск симуляции' },
                    { cmd: 'DRAGON', desc: 'Призвать сущность' },
                    { cmd: 'COMET', desc: 'Метеоритный дождь' },
                    { cmd: 'MUSIC', desc: 'Музыкальный модуль' },
                    { cmd: 'MSU', desc: 'Архитектура' },
                    { cmd: 'COFFEE', desc: 'Заправка' },
                    { cmd: 'CAT', desc: 'Meow' },
                    { cmd: 'HACK', desc: 'Взлом жопы' },
                    { cmd: 'MOOSE', desc: 'Die Human' },
                    { cmd: 'WIZARD', desc: 'Magic' }
                ];

                let html = '<div style="margin-bottom:5px; color:#888; border-bottom:1px dashed #444; padding-bottom:5px;">ДОСТУПНЫЕ КОМАНДЫ (Нажми чтобы скопировать):</div>';
                
                commands.forEach(item => {
                    html += `
                        <div class="cmd-list-row">
                            <span class="interactive-cmd" data-cmd="${item.cmd}" title="Скопировать">${item.cmd}</span>
                            <span class="cmd-desc">- ${item.desc}</span>
                        </div>
                    `;
                });
                responseText = html;
                
            } else if (command === 'status') {
                responseText = 'СИСТЕМЫ В НОРМЕ. TETLA V5.6 АКТИВНА.';
                
            } else if (command === 'clear') {
                terminalHistory.innerHTML = '';
                stopReptileProtocol(); // Остановка ящерицы
                stopDragonProtocol();  // Остановка дракона
                stopCometShower();     // Остановка комет
                responseText = ''; 
                
            } else {
                // Безопасный вывод ошибки без эха команды
                responseText = `<span style="color:#ff4444">ОШИБКА: КОМАНДА НЕ РАСПОЗНАНА</span>`;
            }

            if (responseText) {
                // forceScroll = true, так как это прямой ответ на действие пользователя
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