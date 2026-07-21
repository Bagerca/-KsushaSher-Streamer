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
        squadTitle: 'ГРУППА ПОДДЕРЖКИ',
        // ТЕПЕРЬ ОТРЯД УПРАВЛЯЕТСЯ ОТСЮДА (указываем id из subscribers.json)
        squadMembers: ['bagerka', 'angel', 'kiriki', 'raku6chka', 'nikita', 'hardwell', 'roma', 'dragon', 'dark'] 
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
        twitch: 'https://twitch.tv/ksusha__sher',
        youtube: 'https://www.youtube.com/@Ksusha__Sher__off',
        youtube2: 'https://www.youtube.com/@swamp_ksusha__sher',
        telegram: 'https://t.me/pizdeckakoi_to',
        vk: 'https://vk.com/k_sher', 
        discord: 'https://discord.gg/tV5YdkyhU',
        tiktok: 'https://www.tiktok.com/@_ksusha_sher_'
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
        { id: 'mic', icon: 'fas fa-microphone-lines', label: 'MICROPHONE', value: 'Fifine AmpliGame A5', tags: ['STUDIO', 'XLR'] }
    ],
    audio: {
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
    texts: {
        heroTicker: [
            "АНАЛИЗ СТАТИСТИКИ КАНАЛА...", 
            "ПОДПИСЧИКОВ: 5.2K+", 
            "ЛОЯЛЬНОСТЬ АУДИТОРИИ: 95%", 
            "АКТИВНОСТЬ ЧАТА: ВЫСОКАЯ", 
            "СИСТЕМЫ В НОРМЕ."
        ],
        terminalNoise: [
            "[SYS] Ping: 24ms check ok",
            "[SYS] Оптимизация памяти... Успешно",
            "[NET] localhost (127.0.0.1) пытается взломать сам себя...",
            "[ERR] sudo rm -rf / ... ДЕЙСТВИЕ ЗАБЛОКИРОВАНО БОТОМ TETLA",
            "[WARN] Обнаружена попытка выйти из VIM... Пользователь заблудился",
            "[TWITCH] Пинг до серверов: 1337ms (Опять сервера лагают)",
            "[TWITCH] Сканирование чата на запретки... Угроза миновала",
            "[CHAT] Зафиксирован спам KEKW. Активируем щиты",
            "[LETHAL] Квота: НЕ ВЫПОЛНЕНА. Активируем протокол увольнения",
            "[PHASMO] Зафиксировано ЭМП 5-го уровня в комнате стримера",
            "[TETLA] Буферизация донатов... Анализ на наличие скримеров",
            "[BAGERCA] Инъекция чернильного кода завершена",
            "[ANGEL] Модуль тактической поддержки переведен в OVERDRIVE",
            "[KIRIKI] Генерация нейро-волн: 100%. Вибрации в норме"
        ],
        matrixWords: [
            "KSUSHA", "SHER", "TETLA", "BAGERCA", "ANGEL", "KIRIKI", 
            "FOLLOW", "SUBSCRIBE", "DONATE", "LOVE", "MATRIX", "SYSTEM"
        ]
    }
};