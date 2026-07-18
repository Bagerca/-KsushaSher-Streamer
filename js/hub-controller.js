/* js/hub-controller.js */
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';

export class HubController {
    constructor() {
        // Строгий паттерн DOM элементов
        this.els = {
            playerContainer: document.getElementById('hub-player-container'),
            chatContainer: document.getElementById('hub-chat-container'),
            networkList: document.getElementById('hub-network-list'),
            heroStatusBox: document.getElementById('live-status-container')
        };
        
        if (this.els.heroStatusBox) {
            this.els.heroStatusText = this.els.heroStatusBox.querySelector('.status-text');
            this.els.heroStatusDot = this.els.heroStatusBox.querySelector('.status-indicator');
        }

        if (this.els.playerContainer) this.init();
    }

    init() {
        console.log(`🛰️ [HubController] Инициализация Network Hub...`);
        this.embedTwitch();
        this.fetchNetworkStatus();
        
        setInterval(() => this.fetchNetworkStatus(), 120000);
    }

    embedTwitch() {
        let domain = window.location.hostname;
        if (domain === "" || domain === "127.0.0.1") domain = "localhost";

        if (this.els.playerContainer) {
            this.els.playerContainer.innerHTML = `
                <iframe 
                    src="https://player.twitch.tv/?channel=${AppConfig.twitch.channel}&parent=${domain}&muted=true" 
                    height="100%" 
                    width="100%" 
                    allowfullscreen="true" 
                    style="border: none;">
                </iframe>
            `;
        }

        if (this.els.chatContainer) {
            this.els.chatContainer.innerHTML = `
                <iframe 
                    src="https://www.twitch.tv/embed/${AppConfig.twitch.channel}/chat?darkpopout&parent=${domain}"
                    height="100%" 
                    width="100%" 
                    style="border: none;">
                </iframe>
            `;
        }
        
        this.setHeroLive();
    }

    setHeroLive() {
        if (this.els.heroStatusText) this.els.heroStatusText.textContent = "СИСТЕМА АКТИВНА";
        if (this.els.heroStatusDot) {
            this.els.heroStatusDot.style.background = 'var(--neon-pink)';
            this.els.heroStatusDot.style.boxShadow = '0 0 10px var(--neon-pink)';
            this.els.heroStatusDot.style.animation = 'pulse 1.5s infinite';
        }
    }

    async fetchNetworkStatus() {
        try {
            if (!this.els.networkList) return;
            
            const response = await fetch(`${AppConfig.api.ivrBaseUrl}?login=${AppConfig.twitch.allies}&t=${Date.now()}`);
            if (!response.ok) throw new Error('Network Error');
            
            const users = await response.json();
            this.renderNetwork(users);
            
        } catch (error) {
            console.error("❌ [HubController] Ошибка радара союзников:", error);
            if (this.els.networkList) {
                this.els.networkList.innerHTML = `<div class="network-loading" style="color:#ff4444;">ОШИБКА ПОДКЛЮЧЕНИЯ К СЕТИ</div>`;
            }
        }
    }

    renderNetwork(users) {
        if (!users || users.length === 0) return;
        
        let html = '';
        
        users.forEach(user => {
            const isLive = user.stream !== null;
            const gameName = isLive && user.stream.game ? user.stream.game.displayName : (user.lastBroadcast.game ? user.lastBroadcast.game.displayName : 'Just Chatting');
            const statusText = isLive ? 'LIVE' : 'ОФЛАЙН';
            const liveClass = isLive ? 'is-live' : '';
            
            html += `
                <a href="https://www.twitch.tv/${user.login}" target="_blank" class="ally-net-card ${liveClass}">
                    <img src="${user.logo}" class="ally-net-avatar" alt="${user.displayName}">
                    <div class="ally-net-info">
                        <div class="ally-net-name">${user.displayName}</div>
                        <div class="ally-net-game">${gameName}</div>
                    </div>
                    <div class="ally-net-status">${statusText}</div>
                </a>
            `;
        });
        
        this.els.networkList.innerHTML = html;
        EventBus.emit('SYS_LOG', { html: `[RADAR] Союзная сеть синхронизирована.` });
    }
}