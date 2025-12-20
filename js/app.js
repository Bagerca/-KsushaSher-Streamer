/* js/app.js */

// UI & Components
import { initializeUI } from './ui-components.js';
import { initMediaArchive } from './media-manager.js';
import { initModalSystem } from './media-modal.js';

// Visual Effects
// Импортируем управление Ящерицей
import { startReptileProtocol, stopReptileProtocol } from './reptile-engine.js';
// Импортируем управление Драконом
import { startDragonProtocol, stopDragonProtocol } from './dragon-engine.js';
// Импортируем Кометы
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

// Случайные системные сообщения
function startSystemNoise() {
    const messages = [
        "<span style='color:#666; font-size:0.8rem'>[SYS] Ping: 24ms check ok</span>",
        "<span style='color:#666; font-size:0.8rem'>[BG] Garbage collection...</span>",
        "<span style='color:#666; font-size:0.8rem'>[NET] Packet received from 127.0.0.1</span>",
        "<span style='color:#666; font-size:0.8rem'>[TETLA] Scanning chat logs...</span>",
        "<span style='color:#666; font-size:0.8rem'>[SYS] CPU Temp: 45°C</span>"
    ];

    setInterval(() => {
        if (Math.random() > 0.7 && terminalHistory) {
            const msg = messages[Math.floor(Math.random() * messages.length)];
            addLogLine(msg);
            if (terminalHistory.children.length > 50) {
                terminalHistory.removeChild(terminalHistory.firstChild);
            }
        }
    }, 8000);
}

/**
 * Обработка ввода команд
 */
function initTerminalInput() {
    const input = document.getElementById('cmd-input');

    if (!input || !terminalBox || !terminalHistory) return;

    terminalBox.addEventListener('click', () => {
        input.focus();
    });

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
                // 1. Выключаем Дракона
                stopDragonProtocol();
                // 2. Включаем Ящерицу
                startReptileProtocol();
                responseText = '<span style="color:var(--neon-green)">ЗАПУСК ПРОТОКОЛА "РЕПТИЛИЯ"...</span>';
                
            } else if (command === 'dragon' || command === 'dracarys') {
                // 1. Выключаем Ящерицу
                stopReptileProtocol();
                // 2. Включаем Дракона
                startDragonProtocol();
                responseText = '<span style="color:var(--neon-pink); font-weight:bold; text-shadow:0 0 10px var(--neon-pink);">ВНИМАНИЕ: СУЩНОСТЬ "ДРАКОН" АКТИВИРОВАНА!</span>';
                
            } else if (command === 'comet' || command === 'meteor') {
                triggerCometShower();
                responseText = '<span style="color:var(--neon-pink)">ВНИМАНИЕ: ОБНАРУЖЕН МЕТЕОРИТНЫЙ ПОТОК!</span>';
                
            } else if (command === 'help') {
                responseText = 'ДОСТУПНЫЕ КОМАНДЫ: HELP, CLEAR, STATUS, LIZARD, DRAGON, COMET';
                
            } else if (command === 'status') {
                responseText = 'СИСТЕМЫ В НОРМЕ. TETLA V5.6 АКТИВНА.';
                
            } else if (command === 'clear') {
                terminalHistory.innerHTML = '';
                // Очистка экрана от существ
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
            requestAnimationFrame(() => {
                terminalBox.scrollTop = terminalBox.scrollHeight;
            });
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