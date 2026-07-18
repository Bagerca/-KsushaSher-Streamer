/* js/config.js */

export const AppConfig = {
    // Основная идентификация проекта
    identity: {
        pageTitle: 'Ksusha Sher - Cyber Dashboard',
        mainName: 'KSUSHA SHER',
        role: 'STREAMER & CONTENT CREATOR',
        mainAvatar: 'assets/images/ksusha.jpg',
        botName: 'TETLA',
        botAvatar: 'assets/images/tetlabot.jpg',
        squadTitle: 'ГРУППА ПОДДЕРЖКИ'
    },
    system: {
        osVersion: 'v5.6',
        osName: 'TETLA_OS',
        developer: 'BAGERCA',
        copyrightYear: '2025'
    },
    twitch: {
        channel: 'ksusha__sher',
        allies: 'Tetlabot,bagercaa,to_be_ang,kiriika1'
    },
    api: {
        dataBaseUrl: './data/',
        ivrBaseUrl: 'https://api.ivr.fi/v2/twitch/user'
    },
    about: {
        trailerVideoId: 'Uym3MRaJ3PE' 
    },
    socials: {
        twitch: 'https://www.twitch.tv/ksusha__sher?sr=a',
        youtube: '#',
        telegram: 'https://t.me/pizdeckakoi_to',
        discord: '#',
        tiktok: '#'
    },
    donations: {
        donationAlerts: 'https://www.donationalerts.com/r/ksusha__sher',
        memeAlerts: 'https://memealerts.com/6765a519e6fb84c0655d3f01'
    },
    crypto: {
        cardNumberRaw: '4276 1805 5058 1960',
        cardNumberClean: '4276180550581960',
        successMessage: 'СКОПИРОВАНО!'
    },
    hardware: [
        { id: 'cpu', icon: 'fas fa-microchip', label: 'PROCESSOR', value: 'Intel Core i7-12700H', tags: ['14 CORES', '4.7 GHz'] },
        { id: 'gpu', icon: 'fas fa-desktop', label: 'GRAPHICS', value: 'NVIDIA GeForce RTX 3060', tags: ['6GB GDDR6', 'RTX ON'] },
        { id: 'ram', icon: 'fas fa-memory', label: 'MEMORY', value: '16GB RAM', tags: ['DDR5', '4800 MHz'] },
        { id: 'mic', icon: 'fas fa-microphone-lines', label: 'MICROPHONE', value: 'Shure SM7B', tags: ['STUDIO', 'XLR'] }
    ],
    audio: {
        // Восстановлены все 7 треков
        fallbackTracks: [
            { title: "СЛАВА БОССУ", artist: "5opka", url: "assets/music/5opka_slava_bossu.mp3" },
            { title: "ДРУЗЬЯ НАВСЕГДА", artist: "НИНТЕР", url: "assets/music/ninter_druzya_navsegda.mp3" },
            { title: "Котлетки с Пюрешкой", artist: "Enjoykin", url: "assets/music/enjoykin_kotletki.mp3" },
            { title: "Швайне (Schweine)", artist: "Глюк'oZa", url: "assets/music/glukoza_schweine.mp3" },
            { title: "PUTIN (My Heart Is Cold)", artist: "Bad History", url: "assets/music/bad_history_putin.mp3" },
            { title: "Депутат", artist: "Евгений Сергеевич", url: "assets/music/evgeniy_sergeevich_deputat.mp3" },
            { title: "comedoz", artist: "comedoztv", url: "assets/music/comedoztv_comedoz.mp3" }
        ]
    },
    // Тексты для модулей интерфейса
    texts: {
        heroTicker: [
            "АНАЛИЗ СТАТИСТИКИ КАНАЛА...", 
            "ПОДПИСЧИКОВ: 5.2K+", 
            "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%", 
            "АКТИВНОСТЬ ЧАТА: ВЫСОКАЯ", 
            "СИСТЕМЫ В НОРМЕ."
        ],
        terminalNoise: [
            "[SYS] Ping: 24ms check ok", "[SYS] CPU Temp: 45°C", "[SYS] GPU Load: 89% [Rendering]",
            "[SYS] RAM Usage: 12.4GB / 16GB", "[BG] Garbage collection...", "[BG] Cooling fans: 2400 RPM",
            "[PWR] Voltage stable: 1.2V", "[DRV] NVIDIA Drivers: Up to date", "[NET] Packet received from 127.0.0.1",
            "[NET] Upload bitrate: 6000 kbps", "[TETLA] Scanning chat logs...", "[TETLA] Syncing BTTV/7TV emotes...",
            "[SEC] Unauthorized access blocked", "[WARN] Entity 'Lizard' dormant"
        ],
        matrixWords: [
            "KSUSHA", "SHER", "TETLA", "BAGERCA", "ANGEL", "KIRIKI", 
            "FOLLOW", "SUBSCRIBE", "DONATE", "LOVE", "MATRIX", "SYSTEM"
        ]
    }
};