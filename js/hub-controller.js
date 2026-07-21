/* js/hub-controller.js */
import EventBus from './event-bus.js';
import { AppConfig } from './config.js';

export class HubController {
    constructor() {
        this.els = {
            playerContainer: document.getElementById('hub-player-container'),
            chatContainer: document.getElementById('hub-chat-container'),
            networkList: document.getElementById('hub-network-list')
        };

        if (this.els.playerContainer) this.init();
    }

    init() {
        console.log(`🛰️ [HubController] Инициализация Network Hub...`);
        this.embedTwitch();
        this.fetchNetworkStatus();
        setInterval(() => this.fetchNetworkStatus(), 120000);
    }

    embedTwitch() {
        let domain = window.location.hostname || "localhost";
        if (domain === "127.0.0.1") domain = "localhost";

        if (this.els.playerContainer) {
            this.els.playerContainer.innerHTML = `
                <iframe 
                    src="https://player.twitch.tv/?channel=${AppConfig.twitch.channel}&parent=${domain}&muted=true" 
                    allowfullscreen="true"
                    class="twitch-iframe">
                </iframe>
            `;
        }

        if (this.els.chatContainer) {
            this.els.chatContainer.innerHTML = `
                <iframe 
                    src="https://www.twitch.tv/embed/${AppConfig.twitch.channel}/chat?darkpopout&parent=${domain}"
                    class="twitch-iframe">
                </iframe>
            `;
        }
    }

    async fetchNetworkStatus() {
        if (!this.els.networkList) return;
        
        try {
            const response = await fetch(`${AppConfig.api.ivrBaseUrl}?login=${AppConfig.twitch.allies}&t=${Date.now()}`);
            if (!response.ok) throw new Error('Network Error');
            
            const users = await response.json();
            this.renderNetwork(users);
        } catch (error) {
            console.error("❌ [HubController] Ошибка радара:", error);
            this.els.networkList.innerHTML = `<div class="network-error">ОШИБКА ПОДКЛЮЧЕНИЯ К СЕТИ</div>`;
        }
    }

    renderNetwork(users) {
        if (!users || users.length === 0) return;
        
        this.els.networkList.innerHTML = users.map(user => {
            const isLive = user.stream !== null;
            const gameName = isLive && user.stream.game ? user.stream.game.displayName : (user.lastBroadcast?.game?.displayName || 'Just Chatting');
            
            return `
                <a href="https://www.twitch.tv/${user.login}" target="_blank" class="ally-net-card ${isLive ? 'is-live' : ''}">
                    <img src="${user.logo}" class="ally-net-avatar" alt="${user.displayName}">
                    <div class="ally-net-info">
                        <div class="ally-net-name">${user.displayName}</div>
                        <div class="ally-net-game">${gameName}</div>
                    </div>
                    <div class="ally-net-status">${isLive ? 'LIVE' : 'ОФЛАЙН'}</div>
                </a>
            `;
        }).join('');
        
        // Лог радара при обновлении отключен по просьбе пользователя
    }
}