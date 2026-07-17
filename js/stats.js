/* js/stats.js */
import EventBus from './event-bus.js';

export class StatsManager {
    constructor() {
        this.channelName = 'ksusha__sher';
        this.uptimeInterval = null;
    }

    async init() {
        try {
            console.log("📊 [Stats] Запрос реальных данных Twitch...");
            
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${this.channelName}`);
            if (!response.ok) throw new Error("API недоступно");
            
            const data = await response.json();
            if (!data || data.length === 0) return;
            
            const user = data[0];
            const isLive = user.stream !== null;

            // DOM Элементы Командного Центра
            const elFollowers = document.getElementById('stat-followers');
            const elViewersLabel = document.getElementById('stat-label-viewers');
            const elViewersVal = document.getElementById('stat-viewers');
            const elIconViewers = document.getElementById('stat-icon-viewers');
            
            const elGameLabel = document.getElementById('stat-label-game');
            const elGameVal = document.getElementById('stat-game');
            
            const elTimeLabel = document.getElementById('stat-label-time');
            const elTimeVal = document.getElementById('stat-time');
            const elIconTime = document.getElementById('stat-icon-time');
            
            // DOM Элемент Биографии в секции "Обо мне"
            const elBioText = document.getElementById('twitch-bio-text');

            // 0. ОБНОВЛЯЕМ БИОГРАФИЮ
            if (elBioText && user.bio) {
                elBioText.innerHTML = `Привет! Я <span class="neon-highlight">Ksusha Sher</span>. ${user.bio}`;
            }

            // 1. ФОЛЛОВЕРЫ (Всегда доступны)
            if (elFollowers) elFollowers.textContent = this.formatNumber(user.followers);

            // Очищаем старый таймер
            if (this.uptimeInterval) clearInterval(this.uptimeInterval);

            if (isLive) {
                // СТРИМ ИДЕТ (Онлайн)
                elViewersLabel.textContent = "ЗРИТЕЛЕЙ СЕЙЧАС";
                elViewersVal.textContent = this.formatNumber(user.stream.viewersCount);
                elViewersVal.style.color = "var(--neon-green)";
                elIconViewers.className = "fas fa-eye stat-icon";
                elIconViewers.style.color = "var(--neon-green)";

                elGameLabel.textContent = "ТЕКУЩАЯ ЦЕЛЬ";
                elGameVal.textContent = user.stream.game ? user.stream.game.displayName : "Неизвестно";
                elGameVal.title = elGameVal.textContent;
                elGameVal.style.color = "var(--neon-pink)";

                elTimeLabel.textContent = "ВРЕМЯ В ЭФИРЕ";
                elIconTime.className = "fas fa-broadcast-tower stat-icon";
                elIconTime.style.color = "var(--neon-pink)";
                elTimeVal.style.color = "#fff";
                
                // Живой тикающий таймер
                const startTime = new Date(user.stream.createdAt).getTime();
                this.uptimeInterval = setInterval(() => {
                    const now = new Date().getTime();
                    const diff = now - startTime;
                    
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    elTimeVal.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }, 1000);

            } else {
                // СТРИМ ОФЛАЙН
                elViewersLabel.textContent = "ЛЮДЕЙ В ЧАТЕ";
                // Используем chatterCount из IVR API
                elViewersVal.textContent = user.chatterCount ? this.formatNumber(user.chatterCount) : "0";
                elViewersVal.style.color = "#00ccff";
                elIconViewers.className = "fas fa-comment-dots stat-icon";
                elIconViewers.style.color = "#00ccff";

                elGameLabel.textContent = "НАЗВАНИЕ СТРИМА";
                // Используем название последней трансляции (т.к. игры в оффлайне нет)
                const lastTitle = user.lastBroadcast?.title || "ДАННЫЕ ЗАСЕКРЕЧЕНЫ";
                elGameVal.textContent = lastTitle;
                elGameVal.title = lastTitle; // Чтобы можно было навести мышку и прочитать полностью
                elGameVal.style.color = "#fff";

                elTimeLabel.textContent = "ПОСЛЕДНИЙ ВХОД";
                elIconTime.className = "fas fa-history stat-icon";
                elIconTime.style.color = "#888";
                elTimeVal.style.color = "#888";

                // Считаем сколько дней назад был стрим
                if (user.lastBroadcast?.startedAt) {
                    const lastDate = new Date(user.lastBroadcast.startedAt);
                    const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) elTimeVal.textContent = "СЕГОДНЯ";
                    else if (diffDays === 1) elTimeVal.textContent = "ВЧЕРА";
                    else if (diffDays < 0) elTimeVal.textContent = "В БУДУЩЕМ"; // Защита на случай багнутой даты 2026 года
                    else elTimeVal.textContent = `${diffDays} ДН. НАЗАД`;
                } else {
                    elTimeVal.textContent = "НЕИЗВЕСТНО";
                }
            }

            EventBus.emit('SYS_LOG', { html: `[STATS] Данные трансляции и био обновлены.` });
            
        } catch (error) {
            console.error('❌ [Stats] Ошибка получения данных:', error);
        }
    }

    formatNumber(num) {
        if (num == null) return "0";
        return num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toLocaleString('ru-RU');
    }
}