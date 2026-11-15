/* js/utils/ids.js */
/*
 * ГЕНЕРАТОР СТАБИЛЬНЫХ ИДЕНТИФИКАТОРОВ
 * Детерминированный: одни и те же данные -> одни и те же ID навсегда.
 * Никаких Date.now() / Math.random() — иначе deep links умирают при перезагрузке.
 */
import { getYouTubeId } from '../utils.js';

const TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

/** Читаемый slug из любого заголовка (в т.ч. кириллицы). */
export function slugify(input) {
    if (!input) return '';
    const lowered = String(input).toLowerCase();
    let out = '';
    for (const ch of lowered) {
        out += (TRANSLIT[ch] !== undefined) ? TRANSLIT[ch] : ch;
    }
    out = out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (out.length > 60) out = out.slice(0, 60).replace(/-+$/g, '');
    return out;
}

/** FNV-1a хэш -> base36. Стабилен между сессиями и браузерами. */
export function hashString(str) {
    const text = String(str || '');
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
}

/** Гарантирует уникальность base внутри набора used (детерминированно). */
export function makeUniqueId(base, used) {
    const clean = base || `id-${hashString('empty')}`;
    if (!used) return clean;
    if (!used.has(clean)) {
        used.add(clean);
        return clean;
    }
    let index = 2;
    let candidate = `${clean}-${index}`;
    while (used.has(candidate)) {
        index++;
        candidate = `${clean}-${index}`;
    }
    used.add(candidate);
    console.warn(`⚠️ [IDs] Коллизия идентификатора "${clean}" -> выдан "${candidate}"`);
    return candidate;
}

/** Стабильный «отпечаток» объекта для fallback-хэша. */
function stableSeed(item) {
    try {
        return JSON.stringify({
            t: item?.title || '',
            v: Array.isArray(item?.videos) ? item.videos : [],
            i: item?.image || item?.images || '',
            s: Array.isArray(item?.items) ? item.items.map(x => x?.title || '') : []
        });
    } catch (error) {
        console.warn('⚠️ [IDs] Не удалось построить отпечаток объекта:', error.message);
        return String(item?.title || '');
    }
}

/**
 * Главная точка входа.
 * 1. Явный id из JSON — всегда в приоритете.
 * 2. YouTube — id первого ролика (yt-XXXXXXXXXXX).
 * 3. Остальное — slug заголовка, либо хэш отпечатка.
 */
export function createStableId(item, prefix, used) {
    if (item && item.id !== undefined && item.id !== null && String(item.id).trim() !== '') {
        return makeUniqueId(String(item.id).trim(), used);
    }

    const firstVideo = (item && Array.isArray(item.videos)) ? item.videos[0] : null;
    const videoId = getYouTubeId(firstVideo);

    if (prefix === 'yt' && videoId) {
        return makeUniqueId(`yt-${videoId}`, used);
    }

    const slug = slugify(item && item.title);
    const base = slug ? `${prefix}-${slug}` : `${prefix}-${hashString(stableSeed(item))}`;
    return makeUniqueId(base, used);
}