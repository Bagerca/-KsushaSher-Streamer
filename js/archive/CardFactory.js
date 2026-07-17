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
        
        // Значения гарантированно существуют (Обеспечено MediaStore)
        const displayTitle = item.title || '?';
        const displayDesc = item.description || '';
        const displayStatus = item.status;
        const displayColor = item.customColor || '#ff2d95'; 
        
        let images = [];
        if (isCollection && item.items) {
            // Для стека коллекции берем картинки из первых 3 игр
            images = item.items.slice(0, 3).map(sub => sub.image).filter(Boolean);
        } else if (isYouTube && item.videos) {
            images = item.videos.slice(0, 3).map(v => `https://img.youtube.com/vi/${getYouTubeId(typeof v === 'string' ? v : v.url)}/maxresdefault.jpg`);
        } else if (item.images) {
            images = [...item.images];
        } else if (item.image) {
            images = [item.image];
        }
        
        images = images.map(imgUrl => optimizeImageUrl(imgUrl));
        if (images.length === 0 || !images[0]) images = ['https://via.placeholder.com/320x480/1a1a24/ffffff?text=NO+IMAGE'];

        const stackCount = Math.min(images.length, 3);
        const stackClass = `stack-${stackCount}`; 

        let layersHtml = '';
        
        if (this.getGridMode() !== 'compact') {
            if (stackCount >= 3) layersHtml += `<div class="card-layer layer-back-deep" data-lazy-bg="${images[2]}"></div>`;
            if (stackCount >= 2) layersHtml += `<div class="card-layer layer-back" data-lazy-bg="${images[1]}"></div>`;
        }

        const playOverlay = isYouTube ? `<div class="youtube-play-overlay"><i class="fab fa-youtube"></i></div>` : '';
        
        let topBadge = '';
        if (isCollection && item.items) {
            topBadge = `<div class="yt-playlist-badge collection-badge" style="border-color: ${displayColor};"><i class="fas fa-folder-open" style="color: ${displayColor};"></i> <span>${item.items.length}</span></div>`;
        } else if (isYouTube && item.videos && item.videos.length > 1) { 
            topBadge = `<div class="yt-playlist-badge"><i class="fas fa-layer-group"></i> <span>${item.videos.length}</span></div>`;
        }

        let displayRating = item.rating || 0;
        if (isCollection && item.items) {
            let totalRating = 0;
            let ratedCount = 0;
            item.items.forEach(subItem => {
                if (subItem.rating && subItem.rating > 0) {
                    totalRating += subItem.rating;
                    ratedCount++;
                }
            });
            if (ratedCount > 0) displayRating = totalRating / ratedCount;
        }
        
        let ratingBadgeHtml = '';
        if (displayStatus !== 'suggested' && !isYouTube && displayRating > 0) {
            const rScore = Math.round(displayRating); 
            let segments = '';
            for(let i=0; i<5; i++) {
                segments += `<div class="cyber-segment ${i < rScore ? 'filled' : ''}"></div>`;
            }
            ratingBadgeHtml = `
                <div class="cyber-rating-badge">
                    <div class="cyber-rating">
                        <div class="segments">${segments}</div>
                        <span class="val">${displayRating.toFixed(1)}</span>
                    </div>
                </div>
            `;
        }

        const statusText = displayStatus === 'suggested' && item.suggestedBy 
            ? `<div class="cyber-status suggested-status"><i class="fas fa-user" style="color: ${getUserColor(item.suggestedBy)}"></i> ${item.suggestedBy}</div>`
            : `<div class="cyber-status">[ ${STATUS_MAP[displayStatus] || displayStatus} ]</div>`;

        layersHtml += `
            <div class="card-layer layer-front" style="background-color: ${displayColor}15;" data-lazy-bg="${images[0]}">
                <div class="procedural-placeholder" style="border-color: ${displayColor}50;">
                    <span class="placeholder-letter" style="color: ${displayColor}; text-shadow: 0 0 10px ${displayColor}80;">${displayTitle.charAt(0).toUpperCase()}</span>
                </div>
                <div class="layer-img-bg" style="opacity: 0;"></div>
                
                <div class="layer-content">
                    ${playOverlay}
                    ${topBadge}
                    ${ratingBadgeHtml}
                    
                    <div class="card-info">
                        <div class="card-title" title="${displayTitle}">${displayTitle}</div>
                        ${statusText}
                        <p class="card-desc">${displayDesc}</p>
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