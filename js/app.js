/* js/app.js */

// Main application entry point
import { initializeUI } from './ui-components.js';
import { initializeDataManager } from './data-manager.js';
import { initMediaArchive } from './media-manager.js';
// Импортируем движок пасхалки (убедитесь, что файл reptile-engine.js создан)
import { startReptileProtocol } from './reptile-engine.js';

// Application state
const AppState = {
    initialized: false
};

// Initialize application
async function initializeApplication() {
    if (AppState.initialized) return;
    
    try {
        console.log('🚀 Starting Ksusha Sher website initialization...');
        
        // 1. Инициализация общего UI (Скролл, Копирование номера карты)
        initializeUI();
        
        // 2. Загрузка данных для Hero, Command Center (Статистика, Расписание)
        await initializeDataManager();
        
        // 3. Инициализация нового блока "Цифровой Архив" (Игры и Кино)
        await initMediaArchive();
        
        // 4. Инициализация интерактивного терминала (Новая функция)
        initTerminalInput();
        
        console.log('✅ Ksusha Sher website initialized successfully!');
        AppState.initialized = true;
        
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
    }
}

/**
 * Логика интерактивного терминала в левой панели HUD
 */
function initTerminalInput() {
    const input = document.getElementById('cmd-input');
    const terminalBox = document.getElementById('terminal-box');
    const history = document.getElementById('terminal-history');

    // Если элементов нет, выходим (защита от ошибок)
    if (!input || !terminalBox || !history) return;

    // Фокус на инпут при клике в любое место блока терминала
    terminalBox.addEventListener('click', () => {
        input.focus();
    });

    // Обработка нажатия клавиш
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rawValue = input.value;
            const command = rawValue.trim().toLowerCase();
            
            // 1. Добавляем введенную команду в историю
            const cmdLine = document.createElement('p');
            cmdLine.innerHTML = `> ${rawValue}`;
            cmdLine.style.color = '#fff'; // Цвет пользовательского ввода
            cmdLine.style.margin = '0';
            history.appendChild(cmdLine);
            
            // 2. Обработка команд
            let responseText = '';
            
            if (command === 'lizard' || command === 'protocol 66' || command === 'run creature') {
                // ЗАПУСК ПАСХАЛКИ
                responseText = '<span style="color:var(--neon-green)">ЗАПУСК ПРОТОКОЛА "РЕПТИЛИЯ"...</span>';
                startReptileProtocol();
                
            } else if (command === 'help') {
                responseText = 'ДОСТУПНЫЕ КОМАНДЫ: HELP, CLEAR, LIZARD, STATUS';
                
            } else if (command === 'status') {
                responseText = 'СИСТЕМЫ В НОРМЕ. TETLA V4.2 АКТИВНА.';
                
            } else if (command === 'clear') {
                history.innerHTML = '';
                responseText = ''; // Ничего не пишем после очистки
                
            } else if (command === '') {
                responseText = ''; 
                
            } else {
                responseText = `<span style="color:#ff4444">ОШИБКА: КОМАНДА "${command}" НЕ РАСПОЗНАНА</span>`;
            }

            // 3. Вывод ответа системы
            if (responseText) {
                const respLine = document.createElement('p');
                respLine.innerHTML = `> ${responseText}`;
                respLine.style.margin = '0 0 10px 0';
                history.appendChild(respLine);
            }

            // 4. Очистка поля и автоскролл вниз
            input.value = '';
            // Небольшая задержка для корректного скролла после рендера
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