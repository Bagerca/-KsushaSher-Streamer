/* js/hub-controller.js */
import EventBus from './event-bus.js';

export class HubController {
    constructor() {
        this.mainChannel = 'bagercaa'; 
        // Список логинов друзей (через запятую, без пробелов!)
        this.allies = 'Tetlabot,bagercaa,to_be_ang,kiriika1'; 
        
        // Элементы
        this.playerContainer = document.getElementById('hub-player-container');
        this.chatContainer = document.getElementById('hub-chat-container');
        this.networkList = document.getElementById('hub-network-list');
        
        // Элементы главной секции (для изменения статуса наверху)
        this.heroStatusBox = document.getElementById('live-status-container');
        this.heroStatusText = this.heroStatusBox ? this.heroStatusBox.querySelector('.status-text') : null;
        this.heroStatusDot = this.heroStatusBox ? this.heroStatusBox.querySelector('.status-indicator') : null;

        if (this.playerContainer) this.init();
    }

    init() {
        console.log(`🛰️ [HubController] Инициализация Network Hub...`);
        this.embedTwitch();
        this.fetchNetworkStatus();
        
        // Обновляем статус друзей раз в 2 минуты
        setInterval(() => this.fetchNetworkStatus(), 120000);
    }

    // Встраивание плеера и чата через iframe
    embedTwitch() {
        // Получаем текущий домен для параметра parent (Требование Twitch)
        let domain = window.location.hostname;
        if (domain === "" || domain === "127.0.0.1") domain = "localhost";

        // Встраиваем Плеер
        if (this.playerContainer) {
            this.playerContainer.innerHTML = `
                <iframe 
                    src="https://player.twitch.tv/?channel=${this.mainChannel}&parent=${domain}&muted=true" 
                    height="100%" 
                    width="100%" 
                    allowfullscreen="true" 
                    style="border: none;">
                </iframe>
            `;
        }

        // Встраиваем Чат
        if (this.chatContainer) {
            this.chatContainer.innerHTML = `
                <iframe 
                    src="https://www.twitch.tv/embed/${this.mainChannel}/chat?darkpopout&parent=${domain}"
                    height="100%" 
                    width="100%" 
                    style="border: none;">
                </iframe>
            `;
        }
        
        // Так как плеер сам показывает онлайн/офлайн экран, 
        // мы просто зажигаем статус на главном экране Hero.
        // Для идеала тут можно было бы проверять API твоего канала, 
        // но пока просто включаем статус (как было раньше).
        this.setHeroLive();
    }

    setHeroLive() {
        if (this.heroStatusText) this.heroStatusText.textContent = "СИСТЕМА АКТИВНА";
        if (this.heroStatusDot) {
            this.heroStatusDot.style.background = 'var(--neon-pink)';
            this.heroStatusDot.style.boxShadow = '0 0 10px var(--neon-pink)';
            this.heroStatusDot.style.animation = 'pulse 1.5s infinite';
        }
    }

    // Запрос статуса друзей через IVR API
    async fetchNetworkStatus() {
        try {
            if (!this.networkList) return;
            
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${this.allies}&t=${Date.now()}`);
            if (!response.ok) throw new Error('Network Error');
            
            const users = await response.json();
            this.renderNetwork(users);
            
        } catch (error) {
            console.error("❌ [HubController] Ошибка радара союзников:", error);
            if (this.networkList) this.networkList.innerHTML = `<div class="network-loading" style="color:#ff4444;">ОШИБКА ПОДКЛЮЧЕНИЯ К СЕТИ</div>`;
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
        
        this.networkList.innerHTML = html;
        EventBus.emit('SYS_LOG', { html: `[RADAR] Союзная сеть синхронизирована.` });
    }
}   