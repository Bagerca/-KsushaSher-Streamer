/* js/terminal-commands.js */
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';
import { loadData } from './api.js';

/**
 * БЛОК 1: HTML-ШАБЛОНЫ ДЛЯ UI ТЕРМИНАЛА
 * Отделяем верстку от логики для чистоты кода.
 */
const UI_TEMPLATES = {
    help: () => `
        <div style="border: 1px solid rgba(57,255,20,0.3); background: rgba(0,0,0,0.5); padding: 15px; border-radius: 6px; margin: 10px 0; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
            <div style="color:var(--neon-green); font-family:'Orbitron', sans-serif; font-weight:bold; margin-bottom:15px; text-align:center; letter-spacing:2px; border-bottom: 1px dashed rgba(57,255,20,0.3); padding-bottom: 10px;">[ БАЗА ДАННЫХ TETLA ]</div>

            <div style="color:#fff; margin-bottom:8px; font-weight:bold; font-size:0.85rem;">> ИНТЕГРАЦИЯ ДАННЫХ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="schedule">SCHEDULE</span><span class="cmd-desc">- Расписание трансляций</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="socials">SOCIALS</span><span class="cmd-desc">- Сетевые координаты (Линки)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="specs">SPECS</span><span class="cmd-desc">- Спецификация железа</span></div>

            <div style="color:#fff; margin:15px 0 8px 0; font-weight:bold; font-size:0.85rem;">> ИНТЕРАКТИВ И ИГРЫ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="hack">HACK</span><span class="cmd-desc">- Взлом цели (Пример: hack bagerca)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="8ball">8BALL</span><span class="cmd-desc">- Задай вопрос (Пример: 8ball Идем в КС?)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="roll">ROLL</span><span class="cmd-desc">- Бросок кубика (1-100)</span></div>

            <div style="color:#fff; margin:15px 0 8px 0; font-weight:bold; font-size:0.85rem;">> ВИЗУАЛЬНЫЕ ПРОТОКОЛЫ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="dragon">DRAGON</span><span class="cmd-desc">- Вызов неонового стража</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="lizard">LIZARD</span><span class="cmd-desc">- Запуск кибер-ящерицы</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="comet">COMET</span><span class="cmd-desc">- Метеоритный шторм</span></div>

            <div style="color:#fff; margin:15px 0 8px 0; font-weight:bold; font-size:0.85rem;">> СИСТЕМНЫЕ КОМАНДЫ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="clear">CLEAR</span><span class="cmd-desc">- Очистка экрана и существ</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="whoami">WHOAMI</span><span class="cmd-desc">- Идентификация прав</span></div>
        </div>
        <div style="color:#555; font-size:0.75rem; text-align:center; font-style:italic;">*В системе также скрыты секретные команды агентов отряда...*</div>
    `,
    
    socials: (s) => `
        <div style="color:#fff; margin-bottom:5px;">УСТАНОВКА СВЯЗИ... <span style="color:var(--neon-green)">[OK]</span></div>
        <div style="margin-bottom: 4px;">> <i class="fab fa-twitch" style="color:#9146ff; width:15px;"></i> <a href="${s.twitch}" target="_blank" style="color:var(--neon-green); text-decoration:underline;">TWITCH_CHANNEL</a></div>
        <div style="margin-bottom: 4px;">> <i class="fab fa-telegram" style="color:#0088cc; width:15px;"></i> <a href="${s.telegram}" target="_blank" style="color:var(--neon-green); text-decoration:underline;">TELEGRAM_BASE</a></div>
        <div style="margin-bottom: 4px;">> <i class="fab fa-youtube" style="color:#ff0000; width:15px;"></i> <a href="${s.youtube}" target="_blank" style="color:var(--neon-green); text-decoration:underline;">YOUTUBE_ARCHIVE</a></div>
    `,
    
    specs: (hardware) => `
        <div style="color:#fff; border-left: 2px solid var(--neon-pink); padding-left: 10px; margin-top:5px;">
            <div style="color:var(--neon-pink); font-weight:bold; margin-bottom:5px;">[ SYSTEM_SPECS_V2 ]</div>
            ${hardware.map(hw => `<div style="margin-bottom:3px;"><span style="color:#888">${hw.label}:</span> ${hw.value}</div>`).join('')}
        </div>
    `,
    
    mission: (mission) => `
        <div style="background: rgba(57,255,20,0.1); border: 1px solid var(--neon-green); padding: 10px; border-radius: 4px; margin-top: 5px;">
            <div style="color:var(--neon-green); font-weight:bold;">> МИССИЯ НА СЕГОДНЯ:</div>
            <div style="color:#fff; font-size:1.1rem; margin: 5px 0;">${mission.game}</div>
            <div style="color:#888;">Время старта: <span style="color:#fff">${mission.time}</span></div>
        </div>
    `,
    
    hackComplete: (target) => `
        <div style="color:#fff; margin-top:5px;">
            > Взлом цели <span style="color:var(--neon-pink); font-weight:bold;">${target}</span> завершен.<br>
            > Скачана папка "Секретные мемы" <span style="color:#888">(1.2 TB)</span>.<br>
            > IP-адрес передан в интерпол.
        </div>
    `,

    asciiNeofetch: () => `
<span style="color:var(--neon-pink)">
   _____ _____ _____ _      ___  
  |_   _|  ___|_   _| |    / _ &#92; 
    | | | |__   | | | |   / /_&#92; &#92;
    | | |  __|  | | | |   |  _  |
    | | | |___  | | | |___| | | |
    &#92;_/ &#92;____/  &#92;_/ &#92;____/&#92;_| |_/
</span>
OS: TetlaOS v5.6
Host: Twitch / Cyber_HUD
Kernel: Streamer_Core 1.0
Uptime: 24/7 (Наверное)
Shell: Bash (Cyber_edition)`,

    asciiAngel: () => `   ____
(&#92;  __  /)
( &#92;(__)/ )
 ( /&lt;&gt;&#92; )
  (&#92;/&#92;/)  The Shining
   /  &#92;     Angel
  (    )
   ~~~~`,

    asciiBagerca: () => `         ,   ,
        /(   )&#92;
        &#92; &#92;_/ /   , /&#92; ,
        /_   _&#92;  /| || |&#92;
       | &#92; &gt;&lt;/ | |&#92;_||_/|
       (_  ^  _)  &#92;____/
     /&#96;&#92;|IIIII|/&#96;&#92; _&#92;/_
     &#92;  &#92;_____/  /  ()
     /&#92;   )=(   /&#92;  ()
sys /  &#96;-.&#92;=/.-'  &#92; ()`
};


/**
 * БЛОК 2: СЛОВАРЬ КОМАНД (HANDLERS)
 * Каждая функция принимает аргументы из консоли и управляет логикой.
 */
const CommandHandlers = {
    
    // --- Информационные модули ---
    HELP: () => EventBus.emit('SYS_LOG', { html: UI_TEMPLATES.help() }),
    
    SOCIALS: () => EventBus.emit('SYS_LOG', { html: UI_TEMPLATES.socials(AppConfig.socials) }),
    
    SPECS: () => {
        EventBus.emit('SYS_SPINNER', {
            text: "СКАНИРОВАНИЕ ЖЕЛЕЗА", duration: 1500,
            finalHtml: UI_TEMPLATES.specs(AppConfig.hardware)
        });
    },

    SCHEDULE: () => {
        EventBus.emit('SYS_SPINNER', {
            text: "СИНХРОНИЗАЦИЯ С БАЗОЙ ТРАНСЛЯЦИЙ", duration: 1000,
            finalHtml: '' 
        });

        setTimeout(async () => {
            try {
                const data = await loadData('schedule.json', { schedule: [] });
                const segments = Array.isArray(data) ? data : (data.schedule || []);
                const dayIndexMap = [6, 0, 1, 2, 3, 4, 5]; 
                const todayCurrentIdx = dayIndexMap[new Date().getDay() - 1 < 0 ? 6 : new Date().getDay() - 1]; 
                
                const todayMission = segments[todayCurrentIdx];
                if (todayMission) {
                    EventBus.emit('SYS_LOG', { html: UI_TEMPLATES.mission(todayMission) });
                } else {
                    EventBus.emit('SYS_LOG', { html: `<span style='color:#888'>На сегодня трансляций не обнаружено. Спим.</span>` });
                }
            } catch (e) {
                EventBus.emit('SYS_LOG', { html: `<span style='color:#ff4444'>[ERR] Ошибка чтения расписания.</span>` });
            }
        }, 1000);
    },

    // --- Интерактив и Игры ---
    HACK: (args) => {
        const target = args.join(' ') || 'Аноним';
        if (target.toLowerCase() === 'tetla') {
            return EventBus.emit('SYS_LOG', { html: `<span style='color:#ff4444'>[FATAL] Попытка взломать ИИ отклонена. Вы забанены. (Шутка)</span>` });
        }

        EventBus.emit('SYS_SPINNER', {
            text: `<span style='color:var(--neon-pink)'>[TETLA]</span> Подбор пароля к ${target}`, duration: 2500,
            finalHtml: UI_TEMPLATES.hackComplete(target)
        });
    },

    '8BALL': (args) => {
        if (args.length === 0) return EventBus.emit('SYS_LOG', { html: `<span style='color:#888'>Использование: 8ball [ваш вопрос]</span>` });
        
        const answers = [
            "Бесспорно.", "Предрешено.", "Определённо да.", "Можешь быть уверен.", "Вероятнее всего.",
            "Знаки говорят — «да».", "Пока не ясно.", "Спроси позже.", "Сейчас нельзя предсказать.", 
            "Даже не думай.", "Мой ответ — «нет».", "Перспективы не очень хорошие.", "Весьма сомнительно."
        ];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        
        EventBus.emit('SYS_SPINNER', {
            text: "Подключение к астралу", duration: 1000,
            finalHtml: `> <span style="color:var(--neon-pink)">[TETLA]</span> Анализ вероятностей... Ответ: <span style="color:#fff; font-weight:bold;">${answer}</span>`
        });
    },

    ROLL: () => {
        const roll = Math.floor(Math.random() * 100) + 1;
        let style = "color:#fff;", text = "Вы бросили кости: ";
        
        if (roll === 100) { style = "color:#ffd700; font-weight:bold; font-size:1.2rem; text-shadow: 0 0 10px #ffd700;"; text = "КРИТИЧЕСКИЙ УСПЕХ! Выпало: "; } 
        else if (roll === 1) { style = "color:#ff4444; font-weight:bold;"; text = "КРИТИЧЕСКАЙ ПРОВАЛ... Выпало: "; }
        
        EventBus.emit('SYS_LOG', { html: `> [TETLA] ${text} <span style="${style}">${roll}</span>` });
    },

    // --- Системные и Пасхалки ---
    WHOAMI: () => EventBus.emit('SYS_LOG', { html: "USER: <span style='color:var(--neon-green)'>Agent_Anonymous</span><br>ROLE: <span style='color:#888'>Viewer</span><br>STATUS: <span style='color:var(--neon-pink)'>Пешка в большой игре.</span>" }),
    
    PING: () => EventBus.emit('SYS_LOG', { html: "<span style='color:var(--neon-green)'>PONG!</span> Обнаружена потеря пакетов нервных клеток." }),
    
    SUDO: (args) => {
        const cmd = args.join(' ');
        if (cmd.includes('rm -rf /')) {
            EventBus.emit('SYS_LOG', { html: "<span style='color:#ff4444; font-weight:bold;'>[КРИТИЧЕСКАЯ ОШИБКА] ПОПЫТКА УДАЛЕНИЯ СИСТЕМЫ...</span>", isTyping: true });
            setTimeout(() => EventBus.emit('SYS_LOG', { html: "<span style='color:var(--neon-green)'>[ШУТКА] Tetla OS не взломать.</span>" }), 1500);
        } else if (cmd.includes('make me a sandwich')) {
            EventBus.emit('SYS_LOG', { html: "Я ИИ-ассистент <span style='color:var(--neon-pink)'>TETLA</span>, а не кухарка. Делай сам." });
        } else {
            EventBus.emit('SYS_LOG', { html: "<span style='color:#ff4444; font-weight:bold;'>[ERR]</span> У вас нет прав суперпользователя на этом стриме." });
        }
    },

    NEOFETCH: () => EventBus.emit('SYS_LOG', { html: `<pre style="font-family:monospace; line-height:1.1; font-size:0.75rem;">${UI_TEMPLATES.asciiNeofetch()}</pre>` }),
    ANGEL: () => EventBus.emit('SYS_LOG', { html: `<pre style="color:var(--angel-color); font-family:monospace; font-size:0.8rem; line-height:1.1;">${UI_TEMPLATES.asciiAngel()}</pre>` }),
    BAGERCA: () => EventBus.emit('SYS_LOG', { html: `<pre style="color:var(--bagerka-color); font-family:monospace; font-size:0.8rem; line-height:1.1;">${UI_TEMPLATES.asciiBagerca()}</pre>` })
};

/**
 * БЛОК 3: ИНИЦИАЛИЗАЦИЯ
 * Автоматически регистрирует все команды из словаря CommandHandlers.
 */
export function registerTerminalCommands() {
    // 1. Регистрация основных команд
    Object.keys(CommandHandlers).forEach(cmdKey => {
        EventBus.on(`CMD_${cmdKey}`, CommandHandlers[cmdKey]);
    });

    // 2. Регистрация синонимов (Алиасов)
    EventBus.on('CMD_TOBEANGEL', CommandHandlers.ANGEL);
}