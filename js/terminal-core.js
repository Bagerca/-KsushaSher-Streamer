/* js/terminal-core.js */
import EventBus from './event-bus.js';

export class TerminalController {
    constructor() {
        this.historyEl = document.getElementById('terminal-history');
        this.boxEl = document.getElementById('terminal-box');
        this.inputEl = document.getElementById('cmd-input');
        
        this.isSystemNoiseAllowed = true;
        this.lastNoiseIndex = -1;
        this.noiseInterval = null;
        
        this.init();
    }

    init() {
        if (!this.historyEl || !this.boxEl || !this.inputEl) {
            console.warn('⚠️ [Terminal] DOM элементы не найдены. Терминал отключен.');
            return;
        }

        this.setupEventListeners();
        this.runBootSequence();
        this.startSystemNoise();
        
        console.log('💻 [Terminal] Контроллер инициализирован');
    }

    setupEventListeners() {
        // Фокус на инпут при клике по области терминала
        this.boxEl.addEventListener('click', (e) => {
            if (!e.target.closest('.interactive-cmd')) {
                this.inputEl.focus();
            }
        });

        // Копирование команд по клику
        this.historyEl.addEventListener('click', (e) => {
            const cmdEl = e.target.closest('.interactive-cmd');
            if (cmdEl) {
                const commandText = cmdEl.dataset.cmd;
                navigator.clipboard.writeText(commandText).finally(() => {
                    this.inputEl.value = commandText;
                    this.inputEl.focus();
                });
            }
        });

        // Обработка ввода
        this.inputEl.addEventListener('keydown', (e) => this.handleInput(e));

        // Кастомный плавный скролл
        const SCROLL_FACTOR = 0.3; 
        this.boxEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.boxEl.scrollTop += e.deltaY * SCROLL_FACTOR;
        }, { passive: false });

        // Подписка на внешние логи (чтобы другие компоненты могли писать в терминал)
        EventBus.on('SYS_LOG', (payload) => {
            this.addLogLine(payload.html, payload.isTyping, payload.forceScroll);
        });
    }

    handleInput(e) {
        if (e.key !== 'Enter') return;

        const rawValue = this.inputEl.value;
        const commandParts = rawValue.trim().split(/\s+/);
        const command = commandParts[0].toLowerCase();
        
        if (!rawValue.trim()) return;

        // Вывод самой команды в лог
        const cmdLine = document.createElement('p');
        cmdLine.innerHTML = `<span style="color:var(--neon-green); margin-right:8px;">></span>${rawValue}`;
        cmdLine.style.color = '#fff'; 
        cmdLine.style.margin = '0 0 5px 0';
        this.historyEl.appendChild(cmdLine);
        this.scrollToBottom();
        
        const eventName = `CMD_${command.toUpperCase()}`;
        
        // ПРОВЕРКА: Существует ли обработчик для этой команды?
        if (EventBus.listeners[eventName] && EventBus.listeners[eventName].length > 0) {
            EventBus.emit(eventName, commandParts.slice(1));
        } else {
            // Если команды нет — выводим оригинальную красную ошибку
            this.addLogLine(`<span style="color:#ff4444">ОШИБКА: НЕИЗВЕСТНАЯ КОМАНДА</span>`, false, true);
        }
        
        this.inputEl.value = '';
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
        
        if (forceScroll || this.isNearBottom()) {
            this.scrollToBottom();
        }
        
        return p;
    }

    isNearBottom() {
        if (!this.boxEl) return false;
        const distanceToBottom = this.boxEl.scrollHeight - this.boxEl.scrollTop - this.boxEl.clientHeight;
        return distanceToBottom < 100;
    }

    scrollToBottom() {
        if (this.boxEl) this.boxEl.scrollTop = this.boxEl.scrollHeight;
    }

    setSystemNoiseState(isEnabled) {
        this.isSystemNoiseAllowed = isEnabled;
    }

    // --- Boot & Animations ---

    runProgressBarAnimation(logLine, onComplete, label = "PROCESSING") {
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

    async delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    async runBootSequence() {
        if (!this.historyEl) return;
        this.historyEl.innerHTML = '';
        
        await this.delay(500);
        let line = this.addLogLine("INITIALIZING TETLA_OS v5.6...", true, true);
        await this.delay(800);
        line.style.borderRight = 'none';
        
        this.addLogLine("CHECKING MEMORY... <span class='terminal-ok'>OK</span>", false, true);
        await this.delay(300);
        
        const loadingLine = this.addLogLine("", false, true);
        await new Promise((resolve) => {
            this.runProgressBarAnimation(loadingLine, () => {
                loadingLine.innerHTML = "CORE MODULES: <span class='terminal-ok'>LOADED</span>";
                resolve();
            }, "LOADING KERNEL");
        });

        this.addLogLine("CONNECTING TO TWITCH API... <span class='terminal-ok'>CONNECTED</span>", false, true);
        await this.delay(400);
        this.addLogLine("> ПРОТОКОЛЫ ЗАЩИТЫ: <span class='terminal-ok'>АКТИВНЫ</span>", false, true);
        await this.delay(200);
        this.addLogLine("> МОДЕРАЦИЯ ЧАТА: <span class='terminal-ok'>АКТИВНА</span>", false, true);
        await this.delay(200);
        this.addLogLine("<span style='opacity:0.7'>Введите 'help' для списка команд...</span>", false, true);
    }

    startSystemNoise() {
        const messages = [
            "[SYS] Ping: 24ms check ok", "[SYS] CPU Temp: 45°C", "[SYS] GPU Load: 89% [Rendering]",
            "[SYS] RAM Usage: 12.4GB / 16GB", "[BG] Garbage collection...", "[BG] Cooling fans: 2400 RPM",
            "[PWR] Voltage stable: 1.2V", "[DRV] NVIDIA Drivers: Up to date", "[NET] Packet received from 127.0.0.1",
            "[NET] Upload bitrate: 6000 kbps", "[TETLA] Scanning chat logs...", "[TETLA] Syncing BTTV/7TV emotes...",
            "[SEC] Unauthorized access blocked", "[WARN] Entity 'Lizard' dormant"
        ];
        const wrapLog = (text) => `<span style='color:#666; font-size:0.8rem'>${text}</span>`;

        this.noiseInterval = setInterval(() => {
            if (this.isSystemNoiseAllowed && this.historyEl) {
                const rand = Math.random();
                if (rand > 0.7 && rand < 0.95) {
                    let index;
                    do { index = Math.floor(Math.random() * messages.length); } 
                    while (index === this.lastNoiseIndex && messages.length > 1);
                    this.lastNoiseIndex = index;
                    this.addLogLine(wrapLog(messages[index]));
                }
                if (this.historyEl.children.length > 50) {
                    this.historyEl.removeChild(this.historyEl.firstChild);
                }
            }
        }, 8000);
    }
}