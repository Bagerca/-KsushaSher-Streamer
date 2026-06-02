/* js/archive/CardFactory.js */
import { STATUS_MAP } from '../media-store.js';
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
        
        if (this.getGridMode() !== 'compact') {
            if (stackCount >= 3) layersHtml += `<div class="card-layer layer-back-deep" data-lazy-bg="${images[2]}"></div>`;
            if (stackCount >= 2) layersHtml += `<div class="card-layer layer-back" data-lazy-bg="${images[1]}"></div>`;
        }

        const playOverlay = isYouTube ? `<div class="youtube-play-overlay"><i class="fab fa-youtube"></i></div>` : '';
        
        // Бейдж плейлиста (Только для коллекций и Ютуба с несколькими видео)
        let topBadge = '';
        if (isCollection && item.items) {
            topBadge = `<div class="yt-playlist-badge collection-badge" style="border-color: ${color};"><i class="fas fa-folder-open" style="color: ${color};"></i> <span>${item.items.length}</span></div>`;
        } else if (isYouTube && item.videos && item.videos.length > 1) { 
            topBadge = `<div class="yt-playlist-badge"><i class="fas fa-layer-group"></i> <span>${item.videos.length}</span></div>`;
        }

        // ВЫЧИСЛЕНИЕ РЕЙТИНГА
        let displayRating = item.rating || 0;
        
        // Если это коллекция, высчитываем средний балл по вложенным играм
        if (isCollection && item.items) {
            let totalRating = 0;
            let ratedCount = 0;
            item.items.forEach(subItem => {
                if (subItem.rating && subItem.rating > 0) {
                    totalRating += subItem.rating;
                    ratedCount++;
                }
            });
            if (ratedCount > 0) {
                displayRating = totalRating / ratedCount;
            }
        }
        
        // Генерация бейджа рейтинга (Показываем, если рейтинг больше 0)
        let ratingBadgeHtml = '';
        if (item.status !== 'suggested' && !isYouTube && displayRating > 0) {
            const rScore = Math.round(displayRating); // Округляем до ближайшего целого для сегментов
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

        // Статус текст (Перемещен под заголовок)
        const statusText = item.status === 'suggested' && item.suggestedBy 
            ? `<div class="cyber-status suggested-status"><i class="fas fa-user" style="color: ${getUserColor(item.suggestedBy)}"></i> ${item.suggestedBy}</div>`
            : `<div class="cyber-status">[ ${STATUS_MAP[item.status] || item.status} ]</div>`;

        layersHtml += `
            <div class="card-layer layer-front" style="background-color: ${color}15;" data-lazy-bg="${images[0]}">
                <div class="procedural-placeholder" style="border-color: ${color}50;">
                    <span class="placeholder-letter" style="color: ${color}; text-shadow: 0 0 10px ${color}80;">${(item.title || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div class="layer-img-bg" style="opacity: 0;"></div>
                
                <div class="layer-content">
                    ${playOverlay}
                    ${topBadge}
                    ${ratingBadgeHtml}
                    
                    <div class="card-info">
                        <div class="card-title" title="${item.title}">${item.title}</div>
                        ${statusText}
                        <p class="card-desc">${item.description || ''}</p>
                    </div>
                </div>
            </div>`;

        return `
        <div class="archive-card-container ${stackClass} ${isYouTube ? 'is-youtube' : ''} animate-entry" 
             data-id="${item.id}" style="animation-delay: ${delay}ms; --custom-color: ${color}">
             ${layersHtml}
        </div>`;
    }
}       