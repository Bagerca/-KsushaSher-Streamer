/* js/media-item/item-utils.js */
import { getYouTubeId } from '../utils.js';

export const NO_IMAGE_POSTER = 'https://via.placeholder.com/600x900/1a1a24/ffffff?text=NO+IMAGE';
export const SWAP_DURATION = 180;

/**
 * Превращает объект медиа в стек слайдов для 3D-постеров.
 * Коллекция -> её items; одиночный объект -> набор его изображений.
 */
export function buildStack(item) {
if (item.format === 'collection' && item.items && item.items.length > 0) {
return [...item.items];
}
const images = (item.images && item.images.length > 0) ? item.images : [item.image];
return images.map(img => ({ ...item, isImageOnly: true, overrideImage: img }));
}

/** Превью YouTube-ролика по любой ссылке. */
export function getVideoThumbUrl(videoUrl) {
const vidId = getYouTubeId(videoUrl);
return vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : null;
}

/** Embed-ссылка для iframe. */
export function getEmbedUrl(vidId) {
return `https://www.youtube.com/embed/${vidId}?autoplay=0&rel=0&modestbranding=1`;
}

/**
 * Лучшая картинка объекта: постер -> первое изображение -> превью видео.
 * fallback задаёт, что вернуть, если ничего нет.
 */
export function getItemImageUrl(data, fallback = null) {
return data.overrideImage
|| data.image
|| getVideoThumbUrl(data.videos && data.videos[0])
|| fallback;
}