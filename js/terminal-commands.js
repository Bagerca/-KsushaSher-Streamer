/* js/terminal-commands.js */
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';
import { loadData } from './api.js';
import { AppRouter } from './router.js'; 

const UI_TEMPLATES = {
    help: () => `
        <div class="term-ui-box">
            <div class="term-ui-header">[ БАЗА ДАННЫХ TETLA ]</div>

            <div class="term-ui-section-title">> ИНТЕГРАЦИЯ ДАННЫХ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="schedule">SCHEDULE</span><span class="cmd-desc">- Расписание трансляций</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="socials">SOCIALS</span><span class="cmd-desc">- Сетевые координаты (Линки)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="specs">SPECS</span><span class="cmd-desc">- Спецификация железа</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="youtube">YOUTUBE</span><span class="cmd-desc">- Видеоархив трансляций</span></div>

            <div class="term-ui-section-title">> ИНТЕРАКТИВ И ИГРЫ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="scan">SCAN</span><span class="cmd-desc">- Инфо аккаунта Twitch (Пример: scan bagercaa)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="tierlist">TIERLIST</span><span class="cmd-desc">- Конструктор тирлиста (Shift+T)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="hack">HACK</span><span class="cmd-desc">- Взлом цели (Пример: hack bagerca)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="8ball">8BALL</span><span class="cmd-desc">- Задай вопрос (Пример: 8ball Идем в КС?)</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="roll">ROLL</span><span class="cmd-desc">- Бросок кубика (1-100)</span></div>

            <div class="term-ui-section-title">> ВИЗУАЛЬНЫЕ ПРОТОКОЛЫ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="dragon">DRAGON</span><span class="cmd-desc">- Вызов неонового стража</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="lizard">LIZARD</span><span class="cmd-desc">- Запуск кибер-ящерицы</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="comet">COMET</span><span class="cmd-desc">- Метеоритный шторм</span></div>

            <div class="term-ui-section-title">> СИСТЕМНЫЕ КОМАНДЫ:</div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="clear">CLEAR</span><span class="cmd-desc">- Очистка экрана и существ</span></div>
            <div class="cmd-list-row"><span class="interactive-cmd" data-cmd="whoami">WHOAMI</span><span class="cmd-desc">- Идентификация прав</span></div>
        </div>
        <div class="term-ui-note">*В системе также скрыты секретные команды агентов отряда...*</div>
    `,
    
    socials: (s) => `
        <div class="term-ui-box is-socials">
            <div class="term-ui-header">[ NETWORK_LINKS ]</div>
            <div class="term-social-row">
                <i class="fab fa-twitch term-social-icon" style="color:var(--color-twitch);"></i>
                <a href="${s.twitch}" target="_blank" class="term-link tw">TWITCH_CHANNEL</a>
            </div>
            <div class="term-social-row">
                <i class="fab fa-telegram term-social-icon" style="color:var(--color-telegram);"></i>
                <a href="${s.telegram}" target="_blank" class="term-link tg">TELEGRAM_BASE</a>
            </div>
            <div class="term-social-row">
                <i class="fab fa-youtube term-social-icon" style="color:var(--color-youtube);"></i>
                <a href="${s.youtube}" target="_blank" class="term-link yt">YOUTUBE_ARCHIVE</a>
            </div>
            <div class="term-social-row">
                <i class="fab fa-vk term-social-icon" style="color:var(--color-vk);"></i>
                <a href="${s.vk}" target="_blank" class="term-link vk">VKONTAKTE_HUB</a>
            </div>
            <div class="term-social-row">
                <i class="fab fa-discord term-social-icon" style="color:var(--color-discord);"></i>
                <a href="${s.discord}" target="_blank" class="term-link ds">DISCORD_SERVER</a>
            </div>
            <div class="term-social-row">
                <i class="fab fa-steam term-social-icon" style="color:var(--color-steam);"></i>
                <a href="${s.steam}" target="_blank" class="term-link steam">STEAM_GROUP</a>
            </div>
            <div class="term-social-row">
                <i class="fas fa-bolt term-social-icon" style="color:var(--color-fetta);"></i>
                <a href="${s.fetta}" target="_blank" class="term-link fetta">FETTA_PROFILE</a>
            </div>
        </div>
    `,
    
    specs: (hardware) => `
        <div class="term-ui-box is-specs">
            <div class="term-ui-header">[ SYSTEM_SPECS ]</div>
            ${hardware.map(hw => `
                <div class="term-specs-row">
                    <i class="${hw.icon} term-social-icon" style="color:var(--color-neon-pink);"></i>
                    <span class="term-specs-label">${hw.label}</span>
                    <div class="sys-dots"></div>
                    <span class="term-specs-value">${hw.value}</span>
                </div>
            `).join('')}
        </div>
    `,
    
    mission: (mission) => `
        <div class="term-mission-box">
            <div class="term-mission-header">> МИССИЯ НА СЕГОДНЯ:</div>
            <div class="term-mission-title">${mission.game}</div>
            <div class="term-mission-time">Время старта: <span>${mission.time}</span></div>
        </div>
    `,
    
    hackComplete: (target) => `
        <div style="color:var(--color-text-white); margin-top:5px;">
            > Взлом цели <span style="color:var(--color-neon-pink); font-weight:bold;">${target}</span> завершен.<br>
            > Скачана папка "Секретные мемы" <span style="color:var(--color-text-muted)">(1.2 TB)</span>.<br>
            > IP-адрес передан в интерпол.
        </div>
    `,

    asciiNeofetch: () => `
<span style="color:var(--color-neon-pink)">
   _____ _____ _____ _      ___  
  |_   _|  ___|_   _| |    / _ &#92; 
    | | | |__   | | | |   / /_&#92; &#92;
    | | |  __|  | | | |   |  _  |
    | | | |___  | | | |___| | | |
    &#92_/ &#92____/  &#92_/ &#92____/&#92_| |_/
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

const CommandHandlers = {
    HELP: () => EventBus.emit('SYS_LOG', { html: UI_TEMPLATES.help(), forceScroll: true }),
    SOCIALS: () => EventBus.emit('SYS_LOG', { html: UI_TEMPLATES.socials(AppConfig.socials), forceScroll: true }),
    YOUTUBE: () => {
        EventBus.emit('SYS_SPINNER', {
            text: "ПОДКЛЮЧЕНИЕ К ВИДЕОАРХИВУ", duration: 1500,
            finalHtml: "<span style='color:#ff0000; font-weight:bold;'>Доступ разрешен.</span>"
        });
        setTimeout(() => {
            AppRouter.navigate('/youtube');
        }, 1500);
    },
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
                    EventBus.emit('SYS_LOG', { html: UI_TEMPLATES.mission(todayMission), forceScroll: true });
                } else {
                    EventBus.emit('SYS_LOG', { html: `<span style='color:var(--color-text-muted)'>На сегодня трансляций не обнаружено. Спим.</span>`, forceScroll: true });
                }
            } catch (e) {
                EventBus.emit('SYS_LOG', { html: `<span style='color:var(--color-danger-red)'>[ERR] Ошибка чтения расписания.</span>`, forceScroll: true });
            }
        }, 1000);
    },
    SCAN: (args) => {
        const target = args[0];

        if (!target) {
            return EventBus.emit('SYS_LOG', { 
                html: `<span style='color:var(--color-text-muted)'>Использование: scan [ник_на_твиче]</span>`, 
                forceScroll: true 
            });
        }

        EventBus.emit('SYS_SPINNER', {
            text: `<span style='color:var(--color-neon-green)'>[TETLA]</span> Поиск агента ${target} в базе данных Twitch...`, 
            duration: 1000,
            finalHtml: ''
        });

        setTimeout(async () => {
            try {
                const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${target}`);
                
                if (!response.ok) {
                    EventBus.emit('SYS_LOG', { 
                        html: `> <span style="color:var(--color-danger-red)">[ERR]</span> Объект <span style="font-weight:bold;">${target}</span> не найден.`, 
                        forceScroll: true 
                    });
                    return;
                }

                const data = await response.json();
                
                if (!data || data.length === 0) {
                    EventBus.emit('SYS_LOG', { 
                        html: `> <span style="color:var(--color-danger-red)">[ERR]</span> Аккаунт <span style="font-weight:bold;">${target}</span> удален или не существует.`, 
                        forceScroll: true 
                    });
                    return;
                }

                const user = data[0];
                const createdAtRaw = user.createdAt; 
                const cleanDate = createdAtRaw.split('T')[0]; 
                
                const logHtml = `
                    <div style="background: color-mix(in srgb, var(--color-neon-green) 10%, transparent); border-left: 3px solid var(--color-neon-green); padding: 10px; margin-top: 5px;">
                        <div style="color:var(--color-neon-green); font-weight:bold; margin-bottom: 5px;">> АГЕНТ ИДЕНТИФИЦИРОВАН: ${user.displayName.toUpperCase()}</div>
                        <div style="color:var(--color-text-white);">Дата создания аккаунта: <span style="color:var(--color-neon-green); font-weight:bold;">${cleanDate}</span></div>
                        <div style="color:var(--color-text-muted); font-size: 0.8rem; margin-top: 5px; font-family: var(--font-code);">Для JSON: <span style="color:var(--color-text-light);">"createdAt": "${cleanDate}"</span></div>
                    </div>
                `;
                EventBus.emit('SYS_LOG', { html: logHtml, forceScroll: true });

            } catch (e) {
                EventBus.emit('SYS_LOG', { 
                    html: `> <span style="color:var(--color-danger-red)">[ERR]</span> Ошибка связи с серверами IVR Twitch.`, 
                    forceScroll: true 
                });
            }
        }, 1000);
    },
    TIERLIST: () => {
        EventBus.emit('SYS_SPINNER', {
            text: "ЗАПУСК ПРОТОКОЛА [TIER_MAKER]", duration: 1500,
            finalHtml: "<span style='color:var(--color-neon-pink); font-weight:bold;'>Интерфейс переключен.</span>"
        });
        setTimeout(() => {
            AppRouter.navigate('/tierlist');
        }, 1500);
    },
    HACK: (args) => {
        const target = args.join(' ') || 'Аноним';
        if (target.toLowerCase() === 'tetla') {
            return EventBus.emit('SYS_LOG', { html: `<span style='color:var(--color-danger-red)'>[FATAL] Попытка взломать ИИ отклонена. Вы забанены. (Шутка)</span>`, forceScroll: true });
        }
        EventBus.emit('SYS_SPINNER', {
            text: `<span style='color:var(--color-neon-pink)'>[TETLA]</span> Подбор пароля к ${target}`, duration: 2500,
            finalHtml: UI_TEMPLATES.hackComplete(target)
        });
    },
    '8BALL': (args) => {
        if (args.length === 0) return EventBus.emit('SYS_LOG', { html: `<span style='color:var(--color-text-muted)'>Использование: 8ball [ваш вопрос]</span>`, forceScroll: true });
        const answers = [
            "Бесспорно.", "Предрешено.", "Определённо да.", "Можешь быть уверен.", "Вероятнее всего.",
            "Знаки говорят — «да».", "Пока не ясно.", "Спроси позже.", "Сейчас нельзя предсказать.", 
            "Даже не думай.", "Мой ответ — «нет».", "Перспективы не очень хорошие.", "Весьма сомнительно."
        ];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        EventBus.emit('SYS_SPINNER', {
            text: "Подключение к астралу", duration: 1000,
            finalHtml: `> <span style="color:var(--color-neon-pink)">[TETLA]</span> Анализ вероятностей... Ответ: <span style="color:var(--color-text-white); font-weight:bold;">${answer}</span>`
        });
    },
    ROLL: () => {
        const roll = Math.floor(Math.random() * 100) + 1;
        let style = "color:var(--color-text-white);", text = "Вы бросили кости: ";
        if (roll === 100) { style = "color:var(--color-warning-yellow); font-weight:bold; font-size:1.2rem; text-shadow: 0 0 10px var(--color-warning-yellow);"; text = "КРИТИЧЕСКИЙ УСПЕХ! Выпало: "; } 
        else if (roll === 1) { style = "color:var(--color-danger-red); font-weight:bold;"; text = "КРИТИЧЕСКАЙ ПРОВАЛ... Выпало: "; }
        EventBus.emit('SYS_LOG', { html: `> [TETLA] ${text} <span style="${style}">${roll}</span>`, forceScroll: true });
    },
    WHOAMI: () => EventBus.emit('SYS_LOG', { html: "USER: <span style='color:var(--color-neon-green)'>Agent_Anonymous</span><br>ROLE: <span style='color:var(--color-text-muted)'>Viewer</span><br>STATUS: <span style='color:var(--color-neon-pink)'>Пешка в большой игре.</span>", forceScroll: true }),
    PING: () => EventBus.emit('SYS_LOG', { html: "<span style='color:var(--color-neon-green)'>PONG!</span> Обнаружена потеря пакетов нервных клеток.", forceScroll: true }),
    SUDO: (args) => {
        const cmd = args.join(' ');
        if (cmd.includes('rm -rf /')) {
            EventBus.emit('SYS_LOG', { html: "<span style='color:var(--color-danger-red); font-weight:bold;'>[КРИТИЧЕСКАЯ ОШИБКА] ПОПЫТКА УДАЛЕНИЯ СИСТЕМЫ...</span>", isTyping: true, forceScroll: true });
            setTimeout(() => EventBus.emit('SYS_LOG', { html: "<span style='color:var(--color-neon-green)'>[ШУТКА] Tetla OS не взломать.</span>", forceScroll: true }), 1500);
        } else if (cmd.includes('make me a sandwich')) {
            EventBus.emit('SYS_LOG', { html: "Я ИИ-ассистент <span style='color:var(--color-neon-pink)'>TETLA</span>, а не кухарка. Делай сам.", forceScroll: true });
        } else {
            EventBus.emit('SYS_LOG', { html: "<span style='color:var(--color-danger-red); font-weight:bold;'>[ERR]</span> У вас нет прав суперпользователя на этом стриме.", forceScroll: true });
        }
    },
    NEOFETCH: () => EventBus.emit('SYS_LOG', { html: `<pre class="term-ascii-art">${UI_TEMPLATES.asciiNeofetch()}</pre>`, forceScroll: true }),
    ANGEL: () => EventBus.emit('SYS_LOG', { html: `<pre class="term-ascii-art" style="color:var(--squad-angel);">${UI_TEMPLATES.asciiAngel()}</pre>`, forceScroll: true }),
    BAGERCA: () => EventBus.emit('SYS_LOG', { html: `<pre class="term-ascii-art" style="color:var(--squad-bagerka);">${UI_TEMPLATES.asciiBagerca()}</pre>`, forceScroll: true })
};

export function registerTerminalCommands() {
    Object.keys(CommandHandlers).forEach(cmdKey => {
        EventBus.on(`CMD_${cmdKey}`, CommandHandlers[cmdKey]);
    });
    EventBus.on('CMD_TOBEANGEL', CommandHandlers.ANGEL);
}