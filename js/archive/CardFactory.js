/* js/archive/CardFactory.js */
import { GENRE_MAP } from '../media-store.js';
import { getYouTubeId, getUserColor } from '../utils.js';

export class CardFactory {
    constructor(gridModeRef) {
        this.getGridMode = gridModeRef; // Передаем функцию для получения актуального режима (compact/detailed)
    }

    createCardHTML(item, delay) {
        if (item.isDivider) {
            return `
            <div class="archive-divider-row animate-entry" style="grid-column: 1 / -1; animation-delay: ${delay}ms">
                <div class="divider-line"></div><div class="divider-text">${item.title}</div><div class="divider-line"></div>
            </div>`;
        }

        const isYouTube = item.format === 'youtube';
        const isCollection = item.format === 'collection';
        const color = item.customColor || '#ff2d95';
        
        let images = [];
        if (isCollection && item.items) {
            images = [item.image || item.items[0].image];
            if (item.items.length > 1) images.push(item.items[1].image);
            if (item.items.length > 2) images.push(item.items[2].image);
        } else if (isYouTube && item.videos) {
            images = item.videos.slice(0, 3).map(v => `https://img.youtube.com/vi/${getYouTubeId(typeof v === 'string' ? v : v.url)}/maxresdefault.jpg`);
        } else if (item.images) {
            images = [...item.images];
        } else if (item.image) {
            images = [item.image];
        }
        if (images.length === 0) images = ['https://via.placeholder.com/320x480?text=NO+IMAGE'];

        const stackCount = Math.min(images.length, 3);
        const stackClass = `stack-${stackCount}`; 

        let layersHtml = '';
        
        // В компактном режиме не генерируем дата-атрибуты для задних слоев (Оптимизация DOM)
        if (this.getGridMode() !== 'compact') {
            if (stackCount >= 3) layersHtml += `<div class="card-layer layer-back-deep" data-lazy-bg="${images[2]}"></div>`;
            if (stackCount >= 2) layersHtml += `<div class="card-layer layer-back" data-lazy-bg="${images[1]}"></div>`;
        }

        const playOverlay = isYouTube ? `<div class="youtube-play-overlay"><i class="fab fa-youtube"></i></div>` : '';
        
        let topBadge = '';
        if (isCollection && item.items) {
            topBadge = `<div class="yt-playlist-badge collection-badge" style="border-color:${color}; color:${color};"><i class="fas fa-folder-open"></i> ${item.items.length}</div>`;
        } else if (item.videos && item.videos.length > 1) { // Теперь бейдж плейлиста есть и у игр с трейлерами
            topBadge = `<div class="yt-playlist-badge"><i class="fas fa-layer-group"></i> ${item.videos.length}</div>`;
        }
        
        const ratingBadgeHtml = (item.status !== 'suggested' && !isYouTube && !isCollection) 
            ? `<div class="card-rating-badge"><span class="stars-visual">${Array(5).fill(0).map((_,i) => i < Math.floor(item.rating || 0) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star" style="opacity: 0.3;"></i>').join('')}</span><span class="rating-number">${item.rating}</span></div>` 
            : '';

        const suggestedBadge = (item.status === 'suggested' && item.suggestedBy) 
            ? `<div class="suggested-by-badge"><i class="fas fa-user" style="color: ${getUserColor(item.suggestedBy)}"></i> ${item.suggestedBy}</div>` 
            : '';

        const genresHtml = (item.genres && item.status !== 'suggested') 
            ? `<div class="card-genres">${item.genres.slice(0, 3).map(g => `<span class="genre-tag">${GENRE_MAP[g] || g}</span>`).join('')}</div>` 
            : '';

        layersHtml += `
            <div class="card-layer layer-front" style="background-color: ${color}15;" data-lazy-bg="${images[0]}">
                <div class="procedural-placeholder" style="border-color: ${color}50;">
                    <span class="placeholder-letter" style="color: ${color}; text-shadow: 0 0 10px ${color}80;">${(item.title || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div class="layer-img-bg" style="opacity: 0; transition: opacity 0.4s ease;"></div>
                
                <div class="layer-content">
                    ${playOverlay}${topBadge}${ratingBadgeHtml}${suggestedBadge}
                    <div class="card-info">
                        <div class="card-title" title="${item.title}">${item.title}</div>
                        ${genresHtml}
                        <p class="card-desc">${item.description || ''}</p>
                    </div>
                </div>
                <div class="card-status-bar"></div>
            </div>`;

        return `
        <div class="archive-card-container ${stackClass} ${isYouTube ? 'is-youtube' : ''} animate-entry" 
             data-status="${item.status}" data-id="${item.id}" style="animation-delay: ${delay}ms; --custom-color: ${color}">
             ${layersHtml}
        </div>`;
    }
}