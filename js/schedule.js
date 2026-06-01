/* js/schedule.js */

export class ScheduleManager {
    constructor() {
        this.container = document.getElementById('schedule-container');
        this.channelName = 'bagercaa'; // ИЛИ bagercaa
        this.clientId = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; 
    }

    async init() {
        if (!this.container) return;

        try {
            console.log(`📅 [Schedule] Запрашиваем расписание для канала: ${this.channelName}`);
            
            // НОВАЯ СХЕМА ЗАПРОСА (Без edges и nodes)
            const query = `
            query {
                user(login: "${this.channelName}") {
                    channel {
                        schedule {
                            segments {
                                title
                                startAt
                                endAt
                                category { name }
                            }
                        }
                    }
                }
            }`;

            const response = await fetch('https://gql.twitch.tv/gql', {
                method: 'POST',
                headers: { 'Client-ID': this.clientId },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error("Ошибка сети при обращении к Twitch");

            const rawData = await response.json();
            const segments = rawData?.data?.user?.channel?.schedule?.segments || [];

            if (segments.length === 0) {
                this.container.innerHTML = `
                    <div class="schedule-empty">
                        <i class="fas fa-satellite-dish"></i>
                        <span>РАСПИСАНИЕ ПУСТО.<br>Трансляции не запланированы.</span>
                    </div>`;
                return;
            }

            // Ограничиваем количество выводимых стримов до 6 (чтобы не перегружать интерфейс)
            const displaySegments = segments.slice(0, 6);

            this.container.innerHTML = displaySegments.map(segment => {
                const startDate = new Date(segment.startAt);
                
                const timeStr = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                const dayStr = startDate.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
                
                const gameName = segment.category ? segment.category.name : 'Just Chatting';
                const streamTitle = segment.title || 'Трансляция';

                return `
                <div class="timeline-item">
                    <div class="tl-dot"></div>
                    <div class="tl-time">
                        <span class="tl-day">${dayStr.toUpperCase()}</span>
                        <span class="tl-hour">${timeStr}</span>
                    </div>
                    <div class="tl-content">
                        <div class="tl-game">${gameName}</div>
                        <div class="tl-title">${streamTitle}</div>
                    </div>
                </div>`;
            }).join('');
            
        } catch (error) {
            console.error('❌ [Schedule] Ошибка рендера расписания:', error);
            this.container.innerHTML = '<div class="network-loading" style="color:#ff6464;">ОШИБКА ДОСТУПА К TWITCH API</div>';
        }
    }
}