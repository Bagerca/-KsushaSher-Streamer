/* js/utils.js */

/**
 * МАГИЯ ОПТИМИЗАЦИИ: Пропускает тяжелые внешние картинки через CDN
 * Сжимает размер, конвертирует в WebP и кэширует.
 */
export function optimizeImageUrl(url, width = 400, quality = 80) {
    if (!url) return null;
    
    // Не трогаем Ютуб-превью и локальные файлы
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('assets/') || url.startsWith('./')) {
        return url;
    }
    
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=webp&we=1`;
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
 * Конвертирует RGB в неоновый HSL
 */
function makeNeon(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; 
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    const hue = Math.round(h * 360);
    const saturation = 90; 
    const lightness = 60;  
    
    if (s < 0.1) return `hsl(0, 0%, 70%)`;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * АСИНХРОННОЕ ИЗВЛЕЧЕНИЕ ЦВЕТА
 * Не блокирует главный поток!
 */
export async function extractColorFromImageAsync(imgEl) {
    if (!imgEl.src) return null;

    try {
        const bitmap = await createImageBitmap(imgEl, {
            resizeWidth: 1,
            resizeHeight: 1,
            resizeQuality: 'low'
        });

        let ctx;
        if (typeof OffscreenCanvas !== 'undefined') {
            const offscreen = new OffscreenCanvas(1, 1);
            ctx = offscreen.getContext('2d', { willReadFrequently: true });
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 1; canvas.height = 1;
            ctx = canvas.getContext('2d', { willReadFrequently: true });
        }

        ctx.drawImage(bitmap, 0, 0);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        
        bitmap.close();

        return makeNeon(r, g, b);
    } catch (e) {
        return null;
    }
}