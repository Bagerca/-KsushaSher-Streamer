/* js/terminal-core.js */
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';

/**
 * Класс визуальных эффектов терминала.
 */
class TerminalFX {
    constructor(terminalCtrl) {
        this.ctrl = terminalCtrl;
        this.lastNoiseIndex = -1;
        this.noiseInterval = null;
        this.messages = AppConfig.texts.terminalNoise || ["[SYS] Ping: OK"];
    }

    async runBootSequence() {
        const { ctrl } = this;
        if (!ctrl.historyEl) return;
        ctrl.historyEl.innerHTML = '';
        
        await this.delay(500);
        let line = ctrl.addLogLine(`INITIALIZING ${AppConfig.system.osName} ${AppConfig.system.osVersion}...`, true, true);
        await this.delay(800);
        line.style.borderRight = 'none';
        
        ctrl.addLogLine("CHECKING MEMORY... <span class='terminal-ok'>OK</span>", false, true);
        await this.delay(300);
        
        const loadingLine = ctrl.addLogLine("", false, true);
        await new Promise((resolve) => {
            this.runProgressBarAnimation(loadingLine, () => {
                loadingLine.innerHTML = "CORE MODULES: <span class='terminal-ok'>LOADED</span>";
                resolve();
            }, "LOADING KERNEL");
        });

        ctrl.addLogLine("CONNECTING TO TWITCH API... <span class='terminal-ok'>CONNECTED</span>", false, true);
        await this.delay(400);
        ctrl.addLogLine("> ПРОТОКОЛЫ ЗАЩИТЫ: <span class='terminal-ok'>АКТИВНЫ</span>", false, true);
        await this.delay(200);
        ctrl.addLogLine("> МОДЕРАЦИЯ ЧАТА: <span class='terminal-ok'>АКТИВНА</span>", false, true);
        await this.delay(200);
        ctrl.addLogLine("<span style='opacity:0.7'>Введите 'help' для списка команд...</span>", false, true);
    }

    startSystemNoise() {
        const wrapLog = (text) => `<span style='font-size:0.85rem; color:#888;'>${this.ctrl.colorizeLog(text)}</span>`;
        
        this.noiseInterval = setInterval(() => {
            if (this.ctrl.isSystemNoiseAllowed && this.ctrl.historyEl) {
                const rand = Math.random();
                if (rand > 0.7 && rand < 0.95) {
                    let index;
                    do { index = Math.floor(Math.random() * this.messages.length); } 
                    while (index === this.lastNoiseIndex && this.messages.length > 1);
                    this.lastNoiseIndex = index;
                    this.ctrl.addLogLine(wrapLog(this.messages[index]));
                }
                if (this.ctrl.historyEl.children.length > 50) {
                    this.ctrl.historyEl.removeChild(this.ctrl.historyEl.firstChild);
                }
            }
        }, 8000);
    }

    runProgressBarAnimation(logLine, onComplete, label) {
        let percent = 0;
        const barWidth = 15; 
        const speed = label === "LOADING KERNEL" ? 30 : 50;

        const interval = setInterval(() => {
            percent += 4; 
            const filledCount = Math.floor(barWidth * (percent / 100));
            const bar = '█'.repeat(filledCount) + '░'.repeat(barWidth - filledCount);
            
            logLine.innerHTML = `> ${label}... [${bar}] ${percent}%`;
            
            if (percent >= 100) {
                clearInterval(interval);
                setTimeout(onComplete, 200);
            }
        }, speed);
    }

    delay(ms) { return new Promise(res => setTimeout(res, ms)); }
}

/**
 * Основной контроллер терминала.
 */
export class TerminalController {
    constructor() {
        this.historyEl = document.getElementById('terminal-history');
        this.boxEl = document.getElementById('terminal-box');
        this.inputEl = document.getElementById('cmd-input');
        
        this.isSystemNoiseAllowed = true;
        this.fx = new TerminalFX(this);
        
        // --- НОВЫЙ БЛОК: ЮЗАБИЛИТИ ---
        this.cmdHistory = []; // История введенных команд
        this.historyIndex = -1;
        this.availableCommands = [
            'help', 'clear', 'status', 'music', 'player', 'dragon', 'lizard', 
            'comet', 'godmode', 'whoami', 'neofetch', 'ping', 'sudo', 
            'socials', 'schedule', 'specs', 'hack', '8ball', 'roll', 'angel', 'bagerca'
        ];
        
        this.init();
    }

    init() {
        if (!this.historyEl || !this.boxEl || !this.inputEl) return;
        this.setupEventListeners();
        this.fx.runBootSequence();
        this.fx.startSystemNoise();
    }
    
    colorizeLog(text) {
        return text.replace(/^\[(.*?)\]/, (match, prefix) => {
            let color = '#888'; 
            if (['ERR', 'BAGERCA'].includes(prefix)) color = '#ff4444';
            else if (['WARN', 'ANGEL'].includes(prefix)) color = '#ffd700';
            else if (['OK', 'SYS'].includes(prefix)) color = 'var(--neon-green)';
            else if (['NET', 'TWITCH', 'CHAT', 'KIRIKI'].includes(prefix)) color = '#00ccff';
            else if (['TETLA', 'LETHAL', 'PHASMO'].includes(prefix)) color = 'var(--neon-pink)';
            
            return `<span style="color:${color}; font-weight:bold;">[${prefix}]</span>`;
        });
    }

    setupEventListeners() {
        this.boxEl.addEventListener('click', (e) => {
            if (!e.target.closest('.interactive-cmd')) this.inputEl.focus();
        });

        this.historyEl.addEventListener('click', (e) => {
            const cmdEl = e.target.closest('.interactive-cmd');
            if (cmdEl) {
                this.inputEl.value = cmdEl.dataset.cmd;
                this.inputEl.focus();
            }
        });

        this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));

        this.boxEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.boxEl.scrollTop += e.deltaY * 0.3;
        }, { passive: false });

        EventBus.on('SYS_LOG', (payload) => {
            this.addLogLine(payload.html, payload.isTyping, payload.forceScroll);
        });

        // --- НОВЫЙ ИВЕНТ: Текстовый спиннер загрузки ---
        EventBus.on('SYS_SPINNER', async ({ text, duration, finalHtml }) => {
            const line = this.addLogLine(`${text} [ | ]`, false, true);
            const frames = ['|', '/', '-', '\\'];
            let i = 0;
            
            const interval = setInterval(() => {
                i = (i + 1) % frames.length;
                line.innerHTML = `${text} <span style="color:var(--neon-pink)">[ ${frames[i]} ]</span>`;
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                if (finalHtml) {
                    line.innerHTML = finalHtml;
                    this.scrollToBottom();
                } else {
                    line.remove();
                }
            }, duration);
        });
    }

    // --- НОВАЯ ЛОГИКА ОБРАБОТКИ КЛАВИШ ---
    handleKeyDown(e) {
        // 1. Автодополнение (Tab)
        if (e.key === 'Tab') {
            e.preventDefault();
            const currentVal = this.inputEl.value.toLowerCase().trim();
            if (!currentVal) return;
            
            const match = this.availableCommands.find(cmd => cmd.startsWith(currentVal));
            if (match) this.inputEl.value = match + ' ';
            return;
        }

        // 2. История вверх
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.cmdHistory.length > 0) {
                this.historyIndex = Math.max(0, this.historyIndex - 1);
                this.inputEl.value = this.cmdHistory[this.historyIndex];
            }
            return;
        }

        // 3. История вниз
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.cmdHistory.length - 1) {
                this.historyIndex++;
                this.inputEl.value = this.cmdHistory[this.historyIndex];
            } else {
                this.historyIndex = this.cmdHistory.length;
                this.inputEl.value = '';
            }
            return;
        }

        // 4. Отправка команды (Enter)
        if (e.key === 'Enter') {
            const rawValue = this.inputEl.value;
            const commandParts = rawValue.trim().split(/\s+/);
            const command = commandParts[0].toLowerCase();
            
            if (!rawValue.trim()) return;

            // Записываем в историю
            if (this.cmdHistory[this.cmdHistory.length - 1] !== rawValue.trim()) {
                this.cmdHistory.push(rawValue.trim());
            }
            this.historyIndex = this.cmdHistory.length;

            // Вывод введенной команды
            const cmdLine = document.createElement('p');
            cmdLine.innerHTML = `<span style="color:var(--neon-green); margin-right:8px;">></span>${rawValue}`;
            cmdLine.style.color = '#fff'; 
            cmdLine.style.margin = '0 0 5px 0';
            this.historyEl.appendChild(cmdLine);
            this.scrollToBottom();
            
            const eventName = `CMD_${command.toUpperCase()}`;
            
            if (EventBus.listeners[eventName] && EventBus.listeners[eventName].length > 0) {
                EventBus.emit(eventName, commandParts.slice(1));
            } else {
                this.addLogLine(`<span style="color:#ff4444">[ERR]</span> НЕИЗВЕСТНАЯ КОМАНДА: ${command}`, false, true);
            }
            
            this.inputEl.value = '';
        }
    }

    addLogLine(html, isTyping = false, forceScroll = false) {
        if (!this.historyEl) return null;
        
        const p = document.createElement('p');
        p.innerHTML = html;
        p.style.margin = '0 0 5px 0';
        
        if (isTyping) {
            p.style.borderRight = '7px solid var(--neon-green)';
            p.style.width = 'fit-content';
            p.style.animation = 'blink 0.5s step-end infinite';
        }
        
        this.historyEl.appendChild(p);
        
        if (forceScroll || this.isNearBottom()) this.scrollToBottom();
        
        return p;
    }

    isNearBottom() {
        if (!this.boxEl) return false;
        return (this.boxEl.scrollHeight - this.boxEl.scrollTop - this.boxEl.clientHeight) < 100;
    }

    scrollToBottom() {
        if (this.boxEl) this.boxEl.scrollTop = this.boxEl.scrollHeight;
    }

    setSystemNoiseState(isEnabled) {
        this.isSystemNoiseAllowed = isEnabled;
    }
}