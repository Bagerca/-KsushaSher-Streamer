/* js/app.js */

// Main application entry point
import { initializeUI } from './ui-components.js';
import { initializeDataManager } from './data-manager.js';
import { initMediaArchive } from './media-manager.js';
// Импортируем движок пасхалки
import { startReptileProtocol } from './reptile-engine.js';

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
        
        // 1. Инициализация общего UI (Скролл, Копирование номера карты)
        initializeUI();
        
        // 2. Загрузка данных для Hero, Command Center (Статистика, Расписание)
        await initializeDataManager();
        
        // 3. Инициализация блока "Цифровой Архив" (Игры и Кино)
        await initMediaArchive();
        
        // 4. Инициализация ввода в терминал (Обработка команд)
        initTerminalInput();

        // 5. ЗАПУСК БУТ-АНИМАЦИИ ТЕРМИНАЛА
        runTerminalBoot();
        
        console.log('✅ Ksusha Sher website initialized successfully!');
        AppState.initialized = true;
        
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
    }
}

/**
 * --- ЛОГИКА ТЕРМИНАЛА (BOOT & NOISE) ---
 */

// Функция задержки
const delay = ms => new Promise(res => setTimeout(res, ms));

// Функция добавления строки в лог
function addLogLine(html, isTyping = false) {
    if (!terminalHistory) return;
    
    const p = document.createElement('p');
    p.innerHTML = html;
    p.style.margin = '0 0 5px 0';
    
    // Эффект печатания (зеленая каретка справа от строки)
    if (isTyping) {
        p.style.borderRight = '7px solid var(--neon-green)';
        p.style.width = 'fit-content';
        p.style.animation = 'blink 0.5s step-end infinite';
    }
    
    terminalHistory.appendChild(p);
    
    // Автоскролл вниз
    if (terminalBox) terminalBox.scrollTop = terminalBox.scrollHeight;
    
    return p;
}

// 1. ЗАГРУЗКА СИСТЕМЫ (BOOT SEQUENCE)
async function runTerminalBoot() {
    if (!terminalHistory) return;
    
    // Очистка перед стартом (удаляем старый статический текст)
    terminalHistory.innerHTML = '';
    
    // Сценарий загрузки
    await delay(500);
    let line = addLogLine("INITIALIZING TETLA_OS v5.6...", true);
    await delay(800);
    line.style.borderRight = 'none'; // Убираем курсор с прошлой строки
    
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
    
    // Запуск фонового шума после загрузки
    startSystemNoise();
}

// 2. СИСТЕМНЫЙ ШУМ (RANDOM LOGS)
function startSystemNoise() {
    const messages = [
        "<span style='color:#666; font-size:0.8rem'>[SYS] Ping: 24ms check ok</span>",
        "<span style='color:#666; font-size:0.8rem'>[BG] Garbage collection...</span>",
        "<span style='color:#666; font-size:0.8rem'>[NET] Packet received from 127.0.0.1</span>",
        "<span style='color:#666; font-size:0.8rem'>[TETLA] Scanning chat logs...</span>",
        "<span style='color:#666; font-size:0.8rem'>[SYS] CPU Temp: 45°C</span>"
    ];

    setInterval(() => {
        // 30% шанс появления сообщения каждые 8 секунд, если терминал существует
        if (Math.random() > 0.7 && terminalHistory) {
            const msg = messages[Math.floor(Math.random() * messages.length)];
            addLogLine(msg);
            
            // Если строк слишком много - удаляем верхнюю, чтобы не забивать память и DOM
            if (terminalHistory.children.length > 50) {
                terminalHistory.removeChild(terminalHistory.firstChild);
            }
        }
    }, 8000);
}

/**
 * Логика интерактивного терминала (Ввод пользователя)
 */
function initTerminalInput() {
    const input = document.getElementById('cmd-input');

    // Если элементов нет, выходим
    if (!input || !terminalBox || !terminalHistory) return;

    // Фокус на инпут при клике в любое место блока терминала
    terminalBox.addEventListener('click', () => {
        input.focus();
    });

    // Обработка нажатия клавиш
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rawValue = input.value;
            const command = rawValue.trim().toLowerCase();
            
            // 1. Добавляем введенную команду в историю (Белым цветом)
            const cmdLine = document.createElement('p');
            cmdLine.innerHTML = `> ${rawValue}`;
            cmdLine.style.color = '#fff'; 
            cmdLine.style.margin = '0 0 5px 0';
            terminalHistory.appendChild(cmdLine);
            
            // 2. Обработка команд
            let responseText = '';
            
            if (command === 'lizard' || command === 'protocol 66' || command === 'run creature') {
                // ЗАПУСК ПАСХАЛКИ
                responseText = '<span style="color:var(--neon-green)">ЗАПУСК ПРОТОКОЛА "РЕПТИЛИЯ"...</span>';
                startReptileProtocol();
                
            } else if (command === 'help') {
                responseText = 'ДОСТУПНЫЕ КОМАНДЫ: HELP, CLEAR, LIZARD, STATUS';
                
            } else if (command === 'status') {
                responseText = 'СИСТЕМЫ В НОРМЕ. TETLA V5.6 АКТИВНА.';
                
            } else if (command === 'clear') {
                terminalHistory.innerHTML = '';
                responseText = ''; // Ничего не пишем после очистки
                
            } else if (command === '') {
                responseText = ''; 
                
            } else {
                responseText = `<span style="color:#ff4444">ОШИБКА: КОМАНДА "${command}" НЕ РАСПОЗНАНА</span>`;
            }

            // 3. Вывод ответа системы
            if (responseText) {
                addLogLine(responseText);
            }

            // 4. Очистка поля и автоскролл вниз
            input.value = '';
            requestAnimationFrame(() => {
                terminalBox.scrollTop = terminalBox.scrollHeight;
            });
        }
    });
}

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('🚨 Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled promise rejection:', e.reason);
});

// Performance monitoring
function monitorPerformance() {
    if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            console.log('📊 Page load performance:', {
                'DOM Content Loaded': `${(navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart).toFixed(2)}ms`,
                'Full Load': `${(navigationTiming.loadEventEnd - navigationTiming.navigationStart).toFixed(2)}ms`
            });
        }
    }
}

// Wait for complete page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApplication();
        monitorPerformance();
    });
} else {
    initializeApplication();
    monitorPerformance();
}

// Export for debugging
window.AppState = AppState;