/* js/app.js */

// UI & Components
import { initializeUI } from './ui-components.js';
import { initMediaArchive } from './media-manager.js';
import { initModalSystem } from './media-modal.js';

// Visual Effects
import { startReptileProtocol, stopReptileProtocol } from './reptile-engine.js';
import { startDragonProtocol, stopDragonProtocol } from './dragon-engine.js';
import { initCometSystem, triggerCometShower } from './comets.js';

// Data Modules
import { initSchedule } from './schedule.js';
import { initStats } from './stats.js';
import { initSubscribers } from './subscribers.js';

// Application state
const AppState = {
    initialized: false
};

// DOM Elements for Terminal
const terminalHistory = document.getElementById('terminal-history');
const terminalBox = document.getElementById('terminal-box');

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
        
        // 4. Инициализация терминала
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

function addLogLine(html, isTyping = false) {
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
    
    if (terminalBox) terminalBox.scrollTop = terminalBox.scrollHeight;
    
    return p;
}

// Загрузка системы (визуальный эффект)
async function runTerminalBoot() {
    if (!terminalHistory) return;
    
    terminalHistory.innerHTML = '';
    
    await delay(500);
    let line = addLogLine("INITIALIZING TETLA_OS v5.6...", true);
    await delay(800);
    line.style.borderRight = 'none';
    
    line = addLogLine("CHECKING MEMORY... <span class='terminal-ok'>OK</span>");
    await delay(400);
    
    line = addLogLine("LOADING CORE MODULES...");
    await delay(600);
    
    line = addLogLine("CONNECTING TO TWITCH API... <span class='terminal-ok'>CONNECTED</span>");
    await delay(600);
    
    line = addLogLine("> ПРОТОКОЛЫ ЗАЩИТЫ: <span class='terminal-ok'>АКТИВНЫ</span>");
    await delay(400);
    
    line = addLogLine("> МОДЕРАЦИЯ ЧАТА: <span class='terminal-ok'>АКТИВНА</span>");
    await delay(400);
    
    line = addLogLine("<span style='opacity:0.7'>Введите 'help' для списка команд...</span>");
    
    startSystemNoise();
}

// Случайные системные сообщения (Расширенная версия без повторов)
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
        if (Math.random() > 0.7 && terminalHistory) {
            let index;
            // Генерируем индекс пока он не станет отличаться от предыдущего
            do {
                index = Math.floor(Math.random() * messages.length);
            } while (index === lastIndex && messages.length > 1);
            
            lastIndex = index;

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
        // Если кликнули не по интерактивной команде, фокусим инпут
        if (!e.target.closest('.interactive-cmd')) {
            input.focus();
        }
    });

    // --- ЛОГИКА КЛИКА ПО КОМАНДЕ (КОПИРОВАНИЕ) ---
    terminalHistory.addEventListener('click', (e) => {
        const cmdEl = e.target.closest('.interactive-cmd');
        if (cmdEl) {
            const commandText = cmdEl.dataset.cmd;
            
            // 1. Копируем в буфер обмена
            navigator.clipboard.writeText(commandText).then(() => {
                // 2. Визуальный эффект (подтверждение)
                const originalText = cmdEl.innerText;
                cmdEl.innerHTML = `${commandText} <span style="color:var(--neon-green); font-size:0.7em;">[OK]</span>`;
                
                // 3. Вставляем в поле ввода
                input.value = commandText;
                input.focus();

                // Возвращаем текст обратно через 1 сек
                setTimeout(() => {
                    cmdEl.innerText = originalText;
                }, 1000);
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
            
            // Лог введенной команды
            const cmdLine = document.createElement('p');
            cmdLine.innerHTML = `> ${rawValue}`;
            cmdLine.style.color = '#fff'; 
            cmdLine.style.margin = '0 0 5px 0';
            terminalHistory.appendChild(cmdLine);
            
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
                
            } else if (command === 'help') {
                // --- ВЕРТИКАЛЬНЫЙ СПИСОК КОМАНД ---
                const commands = [
                    { cmd: 'HELP', desc: 'Список команд' },
                    { cmd: 'CLEAR', desc: 'Очистить терминал' },
                    { cmd: 'STATUS', desc: 'Состояние систем' },
                    { cmd: 'LIZARD', desc: 'Запуск симуляции' },
                    { cmd: 'DRAGON', desc: 'Призвать сущность' },
                    { cmd: 'COMET', desc: 'Метеоритный дождь' }
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
                stopReptileProtocol();
                stopDragonProtocol();
                responseText = ''; 
                
            } else if (command === '') {
                responseText = ''; 
            } else {
                responseText = `<span style="color:#ff4444">ОШИБКА: КОМАНДА "${command}" НЕ РАСПОЗНАНА</span>`;
            }

            if (responseText) {
                addLogLine(responseText);
            }

            input.value = '';
            // Прокрутка вниз
            setTimeout(() => {
                if(terminalBox) terminalBox.scrollTop = terminalBox.scrollHeight;
            }, 10);
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