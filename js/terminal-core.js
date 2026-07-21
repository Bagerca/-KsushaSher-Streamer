/* js/terminal-core.js */
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';

class TerminalFX {
    constructor(terminalCtrl) {
        this.ctrl = terminalCtrl;
        this.noiseInterval = null;
        this.messages = AppConfig.texts.terminalNoise || ["[SYS] System Ready"];
        this.recentIndexes = [];
    }

    async runBootSequence() {
        const { ctrl } = this;
        if (!ctrl.historyEl) return;
        ctrl.historyEl.innerHTML = '';
        
        await this.delay(500);
        
        let line = ctrl.addLogLine(`<div class="term-line"><span class="term-tag boot">[BOOT]</span> <span class="term-text">ЗАПУСК ${AppConfig.system.osName} ${AppConfig.system.osVersion}...</span></div>`, true, true);
        await this.delay(800);
        line.style.borderRight = 'none';
        
        ctrl.addLogLine(`<div class="term-line"><span class="term-tag mem">[MEM]</span> <span class="term-text">ДИАГНОСТИКА ПАМЯТИ...</span> <span class="term-status ok">[ OK ]</span></div>`, false, true);
        await this.delay(300);
        
        const loadingLine = ctrl.addLogLine("", false, true);
        await new Promise((resolve) => {
            this.runProgressBarAnimation(loadingLine, () => {
                loadingLine.innerHTML = `<div class="term-line"><span class="term-tag core">[CORE]</span> <span class="term-text">ЯДРО СИСТЕМЫ...</span> <span class="term-status ok">[ ЗАГРУЖЕНО ]</span></div>`;
                resolve();
            });
        });

        ctrl.addLogLine(`<div class="term-line"><span class="term-tag net">[NET]</span> <span class="term-text">TWITCH API LINK...</span> <span class="term-status ok">[ УСТАНОВЛЕН ]</span></div>`, false, true);
        await this.delay(400);
        
        ctrl.addLogLine(`<div class="term-line"><span class="term-tag sec">[SEC]</span> <span class="term-text">ПРОТОКОЛЫ ЗАЩИТЫ...</span> <span class="term-status active">[ АКТИВНЫ ]</span></div>`, false, true);
        await this.delay(300);
        
        ctrl.addLogLine(`<span class="term-welcome">СИСТЕМА ГОТОВА. Введите <span class="term-cmd-highlight" data-cmd="help">help</span> для вывода списка команд.</span>`, false, true);
    }

    startSystemNoise() {
        this.noiseInterval = setInterval(() => {
            if (this.ctrl.isSystemNoiseAllowed && this.ctrl.historyEl) {
                const rand = Math.random();
                if (rand > 0.7 && rand < 0.95) {
                    let index;
                    do { index = Math.floor(Math.random() * this.messages.length); } 
                    while (this.recentIndexes.includes(index) && this.messages.length > this.recentIndexes.length);
                    
                    this.recentIndexes.push(index);
                    if (this.recentIndexes.length > 6) this.recentIndexes.shift();

                    this.ctrl.addLogLine(this.ctrl.colorizeLog(this.messages[index]));
                }
                
                if (this.ctrl.historyEl.children.length > 60) {
                    this.ctrl.historyEl.removeChild(this.ctrl.historyEl.firstChild);
                }
            }
        }, 8000);
    }

    runProgressBarAnimation(logLine, onComplete) {
        let percent = 0;
        const barWidth = 15; 
        const speed = 30;

        const interval = setInterval(() => {
            percent += 4; 
            const filledCount = Math.floor(barWidth * (percent / 100));
            const bar = '█'.repeat(filledCount) + '░'.repeat(barWidth - filledCount);
            
            logLine.innerHTML = `<div class="term-line"><span class="term-tag core">[CORE]</span> <span class="term-text">РАСПАКОВКА... [${bar}] ${percent}%</span></div>`;
            
            if (percent >= 100) {
                clearInterval(interval);
                setTimeout(onComplete, 200);
            }
        }, speed);
    }

    delay(ms) { return new Promise(res => setTimeout(res, ms)); }
}

export class TerminalController {
    constructor() {
        this.historyEl = document.getElementById('terminal-history');
        this.boxEl = document.getElementById('terminal-box');
        this.inputEl = document.getElementById('cmd-input');
        
        this.isSystemNoiseAllowed = true;
        this.fx = new TerminalFX(this);
        
        this.cmdHistory = []; 
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
    
    // ИСПРАВЛЕНИЕ: Добавлены новые теги в словарь раскраски (REPO, BIOSHOCK и т.д.)
    colorizeLog(text) {
        return text.replace(/^\[(.*?)\]/, (match, prefix) => {
            let color = '#00ccff'; 
            if (['ERR', 'BAGERCA', 'ROULETTE', 'MOUTHWASHING'].includes(prefix)) color = '#ff4444';
            else if (['WARN', 'ANGEL', 'CS2', 'TOMODACHI'].includes(prefix)) color = '#ffd700';
            else if (['OK', 'SYS', 'MINECRAFT', 'REPO'].includes(prefix)) color = 'var(--neon-green)';
            else if (['TETLA', 'LETHAL', 'PHASMO', 'DBD', 'DONATE', 'BIOSHOCK'].includes(prefix)) color = 'var(--neon-pink)';
            
            return `<span style="color:${color}; font-weight:bold; margin-right:6px;">[${prefix}]</span>`;
        });
    }

    setupEventListeners() {
        this.boxEl.addEventListener('click', (e) => {
            if (!e.target.closest('.interactive-cmd') && !e.target.closest('[data-cmd]')) {
                this.inputEl.focus();
            }
        });

        this.historyEl.addEventListener('click', (e) => {
            const cmdEl = e.target.closest('.interactive-cmd, [data-cmd]');
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
            if (payload.type === 'system') {
                const timeStr = new Date().toLocaleTimeString('ru-RU', { hour12: false });
                const color = payload.color || 'var(--neon-green)';
                
                const htmlContent = `
                    <div class="sys-log-row">
                        <span class="sys-time">[${timeStr}]</span>
                        <span class="sys-tag" style="color: ${color}">[${payload.tag}]</span>
                        <span class="sys-action">${payload.action}</span>
                        <div class="sys-dots"></div>
                        <span class="sys-value" style="color: ${color}" title="${payload.value}">${payload.value}</span>
                    </div>
                `;
                this.addLogLine(htmlContent, payload.isTyping, payload.forceScroll);
                return;
            }

            let htmlContent = payload.html;
            
            if (!htmlContent.includes('<') && htmlContent.match(/^\[.*?\]/)) {
                htmlContent = this.colorizeLog(htmlContent);
            }

            this.addLogLine(htmlContent, payload.isTyping, payload.forceScroll);
        });

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

    handleKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const currentVal = this.inputEl.value.toLowerCase().trim();
            if (!currentVal) return;
            
            const match = this.availableCommands.find(cmd => cmd.startsWith(currentVal));
            if (match) this.inputEl.value = match + ' ';
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.cmdHistory.length > 0) {
                this.historyIndex = Math.max(0, this.historyIndex - 1);
                this.inputEl.value = this.cmdHistory[this.historyIndex];
            }
            return;
        }

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

        if (e.key === 'Enter') {
            const rawValue = this.inputEl.value;
            const commandParts = rawValue.trim().split(/\s+/);
            const command = commandParts[0].toLowerCase();
            
            if (!rawValue.trim()) return;

            if (this.cmdHistory[this.cmdHistory.length - 1] !== rawValue.trim()) {
                this.cmdHistory.push(rawValue.trim());
            }
            this.historyIndex = this.cmdHistory.length;

            const cmdLine = document.createElement('div');
            cmdLine.className = 'terminal-log-entry';
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
        
        const row = document.createElement('div');
        row.className = 'terminal-log-entry';
        row.innerHTML = html;
        
        if (isTyping) {
            row.style.borderRight = '7px solid var(--neon-green)';
            row.style.width = 'fit-content';
            row.style.animation = 'blink 0.5s step-end infinite';
        }
        
        this.historyEl.appendChild(row);
        
        if (forceScroll || this.isNearBottom()) {
            this.scrollToBottom();
        }
        
        return row;
    }

    isNearBottom() {
        if (!this.boxEl) return false;
        return (this.boxEl.scrollHeight - this.boxEl.scrollTop - this.boxEl.clientHeight) < 100;
    }

    scrollToBottom() {
        if (this.boxEl) {
            setTimeout(() => {
                this.boxEl.scrollTop = this.boxEl.scrollHeight;
            }, 10);
        }
    }

    setSystemNoiseState(isEnabled) {
        this.isSystemNoiseAllowed = isEnabled;
    }
}