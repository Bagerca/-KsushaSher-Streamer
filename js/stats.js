/* js/stats.js */
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';

export class StatsManager {
    constructor() {
        this.uptimeInterval = null;
        
        // Строгий паттерн привязки элементов DOM
        this.els = {
            followers: document.getElementById('stat-followers'),
            viewersLabel: document.getElementById('stat-label-viewers'),
            viewersVal: document.getElementById('stat-viewers'),
            iconViewers: document.getElementById('stat-icon-viewers'),
            gameLabel: document.getElementById('stat-label-game'),
            gameVal: document.getElementById('stat-game'),
            timeLabel: document.getElementById('stat-label-time'),
            timeVal: document.getElementById('stat-time'),
            iconTime: document.getElementById('stat-icon-time'),
            bioText: document.getElementById('twitch-bio-text')
        };
    }

    async init() {
        try {
            console.log("📊 [Stats] Запрос реальных данных Twitch...");
            
            const response = await fetch(`${AppConfig.api.ivrBaseUrl}?login=${AppConfig.twitch.channel}`);
            if (!response.ok) throw new Error("API недоступно");
            
            const data = await response.json();
            if (!data || data.length === 0) return;
            
            const user = data[0];
            const isLive = user.stream !== null;

            if (this.els.bioText && user.bio) {
                this.els.bioText.innerHTML = `Привет! Я <span class="neon-highlight">Ksusha Sher</span>. ${user.bio}`;
            }

            if (this.els.followers) this.els.followers.textContent = this.formatNumber(user.followers);

            if (this.uptimeInterval) clearInterval(this.uptimeInterval);

            if (isLive) {
                if (this.els.viewersLabel) this.els.viewersLabel.textContent = "ЗРИТЕЛЕЙ СЕЙЧАС";
                if (this.els.viewersVal) {
                    this.els.viewersVal.textContent = this.formatNumber(user.stream.viewersCount);
                    this.els.viewersVal.style.color = "var(--neon-green)";
                }
                if (this.els.iconViewers) {
                    this.els.iconViewers.className = "fas fa-eye stat-icon";
                    this.els.iconViewers.style.color = "var(--neon-green)";
                }

                if (this.els.gameLabel) this.els.gameLabel.textContent = "ТЕКУЩАЯ ЦЕЛЬ";
                if (this.els.gameVal) {
                    this.els.gameVal.textContent = user.stream.game ? user.stream.game.displayName : "Неизвестно";
                    this.els.gameVal.title = this.els.gameVal.textContent;
                    this.els.gameVal.style.color = "var(--neon-pink)";
                }

                if (this.els.timeLabel) this.els.timeLabel.textContent = "ВРЕМЯ В ЭФИРЕ";
                if (this.els.iconTime) {
                    this.els.iconTime.className = "fas fa-broadcast-tower stat-icon";
                    this.els.iconTime.style.color = "var(--neon-pink)";
                }
                if (this.els.timeVal) this.els.timeVal.style.color = "#fff";
                
                const startTime = new Date(user.stream.createdAt).getTime();
                this.uptimeInterval = setInterval(() => {
                    const now = new Date().getTime();
                    const diff = now - startTime;
                    
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    if (this.els.timeVal) {
                        this.els.timeVal.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }, 1000);

            } else {
                if (this.els.viewersLabel) this.els.viewersLabel.textContent = "ЛЮДЕЙ В ЧАТЕ";
                if (this.els.viewersVal) {
                    this.els.viewersVal.textContent = user.chatterCount ? this.formatNumber(user.chatterCount) : "0";
                    this.els.viewersVal.style.color = "#00ccff";
                }
                if (this.els.iconViewers) {
                    this.els.iconViewers.className = "fas fa-comment-dots stat-icon";
                    this.els.iconViewers.style.color = "#00ccff";
                }

                if (this.els.gameLabel) this.els.gameLabel.textContent = "НАЗВАНИЕ СТРИМА";
                if (this.els.gameVal) {
                    const lastTitle = user.lastBroadcast?.title || "ДАННЫЕ ЗАСЕКРЕЧЕНЫ";
                    this.els.gameVal.textContent = lastTitle;
                    this.els.gameVal.title = lastTitle; 
                    this.els.gameVal.style.color = "#fff";
                }

                if (this.els.timeLabel) this.els.timeLabel.textContent = "ПОСЛЕДНИЙ ВХОД";
                if (this.els.iconTime) {
                    this.els.iconTime.className = "fas fa-history stat-icon";
                    this.els.iconTime.style.color = "#888";
                }
                if (this.els.timeVal) {
                    this.els.timeVal.style.color = "#888";
                    if (user.lastBroadcast?.startedAt) {
                        const lastDate = new Date(user.lastBroadcast.startedAt);
                        const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
                        
                        if (diffDays === 0) this.els.timeVal.textContent = "СЕГОДНЯ";
                        else if (diffDays === 1) this.els.timeVal.textContent = "ВЧЕРА";
                        else if (diffDays < 0) this.els.timeVal.textContent = "В БУДУЩЕМ"; 
                        else this.els.timeVal.textContent = `${diffDays} ДН. НАЗАД`;
                    } else {
                        this.els.timeVal.textContent = "НЕИЗВЕСТНО";
                    }
                }
            }

            // РАССЫЛАЕМ СОБЫТИЕ С РЕАЛЬНЫМИ ДАННЫМИ ПО ВСЕМУ САЙТУ
            EventBus.emit('TWITCH_DATA_UPDATED', {
                isLive: isLive,
                followers: user.followers,
                viewers: isLive ? user.stream.viewersCount : 0,
                game: isLive && user.stream.game ? user.stream.game.displayName : ''
            });

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