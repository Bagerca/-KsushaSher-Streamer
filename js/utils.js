/* js/utils.js */

/**
 * МАГИЯ ОПТИМИЗАЦИИ: Пропускает тяжелые внешние картинки через CDN
 * Сжимает размер, конвертирует в WebP и кэширует.
 */
export function optimizeImageUrl(url, width = 400) {
    if (!url) return null;
    
    // Не трогаем Ютуб-превью и локальные файлы (assets/...)
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('assets/') || url.startsWith('./')) {
        return url;
    }
    
    // Оборачиваем ссылку в кэширующий прокси (w=ширина, output=webp)
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&we=1`;
}

/**
 * Извлекает ID YouTube видео из любой ссылки
 */
export function getYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([^"&?\/\s]{11})/);
    return (match && match[1]) ? match[1] : null;
}

/**
 * Генерирует стабильный цвет на основе строки (никнейма)
 */
export function getUserColor(name) {
    if (!name) return '#00ffff'; 
    const colors = ['#39ff14', '#ff2d95', '#00ffff', '#ff4444', '#ffd700', '#bd00ff', '#ff8c00', '#007bff'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Дебаунсер: ограничивает частоту вызова функции
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Вычисляет коэффициент сходства двух строк на основе триграмм
 */
export function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1.toLowerCase().includes(str2.toLowerCase())) return 1.0;
    const set1 = getTrigrams(str1);
    const set2 = getTrigrams(str2);
    let matches = 0;
    for (const trigram of set2) { if (set1.includes(trigram)) matches++; }
    return (2.0 * matches) / (set1.length + set2.length);
}

function getTrigrams(text) {
    if (!text) return [];
    const cleanText = text.toLowerCase().replace(/[^\wа-яё0-9]/gi, '');
    if (cleanText.length < 3) return [cleanText];
    const trigrams = [];
    for (let i = 0; i < cleanText.length - 2; i++) trigrams.push(cleanText.substring(i, i + 3));
    return trigrams;
}