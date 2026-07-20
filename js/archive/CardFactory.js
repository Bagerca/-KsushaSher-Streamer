/* js/archive/CardFactory.js */
import { STATUS_MAP } from '../media-store.js';
import { getYouTubeId, getUserColor, optimizeImageUrl } from '../utils.js';

export class CardFactory {
    constructor(gridModeRef) {
        this.getGridMode = gridModeRef; 
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
        const isCompact = this.getGridMode() === 'compact';
        
        // [РЕФАКТОРИНГ] Данные уже нормализованы в MediaStore. Просто берем их.
        const title = item.title || '?';
        const status = item.status || 'unknown';
        const color = item.customColor || '#444455'; 

        // [РЕФАКТОРИНГ] Берем предрассчитанные цвета слоев
        const cFront = item.stackColors ? item.stackColors[0] : color;
        const cBack1 = item.stackColors ? item.stackColors[1] : color;
        const cBack2 = item.stackColors ? item.stackColors[2] : color;

        let images = [];
        if (isYouTube && item.videos) {
            images = item.videos.slice(0, 3).map(v => `https://img.youtube.com/vi/${getYouTubeId(typeof v === 'string' ? v : v.url)}/maxresdefault.jpg`);
        } else if (item.images && item.images.length > 0) {
            images = [...item.images];
        } else if (item.image) {
            images = [item.image];
        }
        
        if (!images.length) images = ['https://via.placeholder.com/320x480/1a1a24/ffffff?text=NO+IMAGE'];

        const stackCount = Math.min(images.length, 3);
        const imgFront = optimizeImageUrl(images[0], 400, 85);
        const imgBack1 = images[1] ? optimizeImageUrl(images[1], 200, 60) : null;
        const imgBack2 = images[2] ? optimizeImageUrl(images[2], 200, 60) : null;

        let backLayersHtml = '';
        if (!isCompact) {
            if (stackCount >= 3 && imgBack2) backLayersHtml += `<div class="card-layer layer-back-deep" style="--layer-color: ${cBack2};" data-lazy-bg="${imgBack2}"></div>`;
            if (stackCount >= 2 && imgBack1) backLayersHtml += `<div class="card-layer layer-back" style="--layer-color: ${cBack1};" data-lazy-bg="${imgBack1}"></div>`;
        }

        const playOverlay = isYouTube ? `<div class="youtube-play-overlay"><i class="fab fa-youtube"></i></div>` : '';
        let topBadge = '';
        if (isCollection && item.items) {
            topBadge = `<div class="yt-playlist-badge collection-badge" style="border-color: var(--layer-color, var(--custom-color));"><i class="fas fa-folder-open" style="color: var(--layer-color, var(--custom-color));"></i> <span>${item.items.length}</span></div>`;
        } else if (isYouTube && item.videos?.length > 1) { 
            topBadge = `<div class="yt-playlist-badge"><i class="fas fa-layer-group"></i> <span>${item.videos.length}</span></div>`;
        }

        // [РЕФАКТОРИНГ] Используем заранее вычисленный рейтинг коллекции
        const rating = item.rating || 0;

        let ratingHtml = '';
        if (status !== 'suggested' && !isYouTube && rating > 0) {
            const rScore = Math.round(rating); 
            const segments = Array.from({length: 5}, (_, i) => `<div class="cyber-segment ${i < rScore ? 'filled' : ''}"></div>`).join('');
            ratingHtml = `<div class="cyber-rating-badge"><div class="cyber-rating"><div class="segments">${segments}</div><span class="val">${rating.toFixed(1)}</span></div></div>`;
        }

        const statusHtml = status === 'suggested' && item.suggestedBy 
            ? `<div class="cyber-status suggested-status"><i class="fas fa-user" style="color: ${getUserColor(item.suggestedBy)}"></i> ${item.suggestedBy}</div>`
            : `<div class="cyber-status">[ ${STATUS_MAP[status] || status} ]</div>`;

        return `
        <div class="archive-card-container stack-${stackCount} ${isYouTube ? 'is-youtube' : ''} animate-entry" 
             data-id="${item.id}" style="animation-delay: ${delay}ms; --custom-color: ${color}">
             
             ${backLayersHtml}
             
            <div class="card-layer layer-front" style="background-color: color-mix(in srgb, var(--custom-color) 15%, transparent); --layer-color: ${cFront};" data-lazy-bg="${imgFront}">
                <div class="procedural-placeholder" style="border-color: color-mix(in srgb, var(--custom-color) 50%, transparent);">
                    <span class="placeholder-letter" style="color: var(--custom-color); text-shadow: 0 0 10px var(--custom-color);">${title.charAt(0).toUpperCase()}</span>
                </div>
                <div class="layer-img-bg" style="opacity: 0;"></div>
                <div class="layer-content">
                    ${playOverlay}
                    ${topBadge}
                    ${ratingHtml}
                    <div class="card-info">
                        ${statusHtml}
                        <div class="card-title" title="${title}">${title}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }
}