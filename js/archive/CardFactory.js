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
        
        let displayTitle = item.title || '?';
        let displayStatus = item.status;
        let displayColor = item.customColor || '#444455'; 

        if (isCollection && item.items && item.items.length > 0) {
            displayTitle = item.items[0].title || displayTitle;
            displayStatus = item.items[0].status || displayStatus;
            displayColor = item.items[0].customColor || displayColor; 
        }
        
        // --- ГЕНЕРАЦИЯ ИНДИВИДУАЛЬНЫХ ЦВЕТОВ СЛОЕВ ---
        let cFront = displayColor;
        let cBack1 = displayColor;
        let cBack2 = displayColor;

        if (isCollection && item.items) {
            cFront = item.items[0]?.customColor || displayColor;
            cBack1 = item.items[1]?.customColor || cFront;
            cBack2 = item.items[2]?.customColor || cBack1;
        }

        let rawImages = [];
        if (isCollection && item.items) {
            rawImages = item.items.slice(0, 3).map(sub => sub.image).filter(Boolean);
        } else if (isYouTube && item.videos) {
            rawImages = item.videos.slice(0, 3).map(v => `https://img.youtube.com/vi/${getYouTubeId(typeof v === 'string' ? v : v.url)}/maxresdefault.jpg`);
        } else if (item.images) {
            rawImages = [...item.images];
        } else if (item.image) {
            rawImages = [item.image];
        }
        
        if (rawImages.length === 0 || !rawImages[0]) rawImages = ['https://via.placeholder.com/320x480/1a1a24/ffffff?text=NO+IMAGE'];

        const stackCount = Math.min(rawImages.length, 3);
        const stackClass = `stack-${stackCount}`; 

        const imgFront = optimizeImageUrl(rawImages[0], 400, 85);
        const imgBack1 = rawImages[1] ? optimizeImageUrl(rawImages[1], 200, 60) : null;
        const imgBack2 = rawImages[2] ? optimizeImageUrl(rawImages[2], 200, 60) : null;

        let layersHtml = '';
        if (this.getGridMode() !== 'compact') {
            // Применяем индивидуальные цвета к задним карточкам
            if (stackCount >= 3 && imgBack2) layersHtml += `<div class="card-layer layer-back-deep" style="--layer-color: ${cBack2};" data-lazy-bg="${imgBack2}"></div>`;
            if (stackCount >= 2 && imgBack1) layersHtml += `<div class="card-layer layer-back" style="--layer-color: ${cBack1};" data-lazy-bg="${imgBack1}"></div>`;
        }

        const playOverlay = isYouTube ? `<div class="youtube-play-overlay"><i class="fab fa-youtube"></i></div>` : '';
        
        let topBadge = '';
        if (isCollection && item.items) {
            topBadge = `<div class="yt-playlist-badge collection-badge" style="border-color: var(--layer-color, var(--custom-color));"><i class="fas fa-folder-open" style="color: var(--layer-color, var(--custom-color));"></i> <span>${item.items.length}</span></div>`;
        } else if (isYouTube && item.videos && item.videos.length > 1) { 
            topBadge = `<div class="yt-playlist-badge"><i class="fas fa-layer-group"></i> <span>${item.videos.length}</span></div>`;
        }

        let displayRating = item.rating || 0;
        if (isCollection && item.items) {
            let totalRating = 0, ratedCount = 0;
            item.items.forEach(subItem => { if (subItem.rating && subItem.rating > 0) { totalRating += subItem.rating; ratedCount++; } });
            if (ratedCount > 0) displayRating = totalRating / ratedCount;
        }
        
        let ratingBadgeHtml = '';
        if (displayStatus !== 'suggested' && !isYouTube && displayRating > 0) {
            const rScore = Math.round(displayRating); 
            let segments = '';
            for(let i=0; i<5; i++) segments += `<div class="cyber-segment ${i < rScore ? 'filled' : ''}"></div>`;
            ratingBadgeHtml = `<div class="cyber-rating-badge"><div class="cyber-rating"><div class="segments">${segments}</div><span class="val">${displayRating.toFixed(1)}</span></div></div>`;
        }

        const statusText = displayStatus === 'suggested' && item.suggestedBy 
            ? `<div class="cyber-status suggested-status"><i class="fas fa-user" style="color: ${getUserColor(item.suggestedBy)}"></i> ${item.suggestedBy}</div>`
            : `<div class="cyber-status">[ ${STATUS_MAP[displayStatus] || displayStatus} ]</div>`;

        // Применяем индивидуальный цвет к передней карточке
        layersHtml += `
            <div class="card-layer layer-front" style="background-color: color-mix(in srgb, var(--custom-color) 15%, transparent); --layer-color: ${cFront};" data-lazy-bg="${imgFront}">
                <div class="procedural-placeholder" style="border-color: color-mix(in srgb, var(--custom-color) 50%, transparent);">
                    <span class="placeholder-letter" style="color: var(--custom-color); text-shadow: 0 0 10px var(--custom-color);">${displayTitle.charAt(0).toUpperCase()}</span>
                </div>
                <div class="layer-img-bg" style="opacity: 0;"></div>
                
                <div class="layer-content">
                    ${playOverlay}
                    ${topBadge}
                    ${ratingBadgeHtml}
                    <div class="card-info">
                        <div class="card-title" title="${displayTitle}">${displayTitle}</div>
                        ${statusText}
                    </div>
                </div>
            </div>`;

        return `
        <div class="archive-card-container ${stackClass} ${isYouTube ? 'is-youtube' : ''} animate-entry" 
             data-id="${item.id}" style="animation-delay: ${delay}ms; --custom-color: ${displayColor}">
             ${layersHtml}
        </div>`;
    }
}