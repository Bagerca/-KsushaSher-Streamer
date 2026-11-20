/* js/archive/CardFactory.js */
import { STATUS_MAP } from '../media-store.js';
import { getYouTubeId, getUserColor, optimizeImageUrl } from '../utils.js';
import { AppStore } from '../store.js';
import { replaceIcons } from '../utils/icons.js';

export class CardFactory {
  constructor(gridModeRef) {
    this.getGridMode = gridModeRef;
  }

  /**
   * Табличка «ПРОСМОТРЕНО» для YouTube-карточек.
   * Визуально — близнец бейджа количества видео (.yt-playlist-badge):
   * то же стекло, рамка, типографика; семантику несёт зелёная иконка.
   * Единая точка разметки: используется и при полном рендере сетки,
   * и при точечном toggle без перерендера (applyWatchedState).
   */
  static getWatchedStampHTML() {
    return `
      <div class="watched-stamp" title="Отмечено как просмотренное">
        <i class="fas fa-status-completed"></i>
        <span class="watched-stamp-text">ПРОСМОТРЕНО</span>
      </div>`;
  }

  /**
   * Точечное применение состояния к уже отрендеренной карточке.
   * Не трогает картинки и не пересоздаёт DOM сетки — без прыжков скролла.
   */
  static applyWatchedState(cardEl, isWatched) {
    if (!cardEl || !cardEl.classList.contains('is-youtube')) return;
    const watched = Boolean(isWatched);
    cardEl.classList.toggle('is-watched', watched);

    const content = cardEl.querySelector('.layer-content');
    if (!content) return;

    const existing = content.querySelector('.watched-stamp');
    if (watched && !existing) {
      content.insertAdjacentHTML('afterbegin', CardFactory.getWatchedStampHTML());
      replaceIcons(content);
    } else if (!watched && existing) {
      existing.remove();
    }
  }

  createCardHTML(item, delay) {
    if (item.isDivider) {
      return `
        <div class="archive-divider-row animate-entry" style="width: 100%; animation-delay: ${delay}ms">
          <div class="divider-line"></div><div class="divider-text">${item.title}</div><div class="divider-line"></div>
        </div>`;
    }

    const isYouTube = item.format === 'youtube';
    const isCollection = item.format === 'collection';
    const isCompact = this.getGridMode() === 'compact';
    const title = item.title || '?';
    const status = item.status || 'unknown';
    const color = item.customColor || '#444455';

    const cFront = item.stackColors ? item.stackColors[0] : color;
    const cBack1 = item.stackColors ? item.stackColors[1] : color;
    const cBack2 = item.stackColors ? item.stackColors[2] : color;

    /* Отметка «просмотрено» — пользовательские данные из Store.
       Читаем в момент рендера: сетка всегда перерисовывается по подписке. */
    const isWatched = isYouTube && Boolean(AppStore.getState().watched.youtube[item.id]);
    const watchedStamp = isWatched ? CardFactory.getWatchedStampHTML() : '';

    let images = [];
    if (isYouTube && item.videos && item.videos.length > 0) {
      images = item.videos.slice(0, 3).map(url => {
        const ytId = getYouTubeId(url);
        return ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
      }).filter(Boolean);
    }

    if (!images.length) {
      if (item.images && item.images.length > 0) images = [...item.images];
      else if (item.image) images = [item.image];
      else images = ['https://via.placeholder.com/320x480/1a1a24/ffffff?text=NO+IMAGE'];
    }

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
      topBadge = `<div class="yt-playlist-badge collection-badge" style="border-color: var(--layer-color, var(--custom-color));"><i class="fas fa-card-pack" style="color: var(--layer-color, var(--custom-color));"></i> <span>${item.items.length}</span></div>`;
    } else if (isYouTube && item.videos && item.videos.length > 1) {
      /* ИСПРАВЛЕНИЕ: fa-list отсутствовала в icon-паке (пустое место у цифры).
         Используем существующую fa-card-pack — единая иконка «пака» с играми. */
      topBadge = `<div class="yt-playlist-badge"><i class="fas fa-card-pack"></i> <span>${item.videos.length}</span></div>`;
    }

    const rating = item.rating || 0;
    let ratingHtml = '';
    if (status !== 'suggested' && !isYouTube && rating > 0) {
      const rScore = Math.round(rating);
      const segments = Array.from({length: 5}, (_, i) => `<div class="cyber-segment ${i < rScore ? 'filled' : ''}"></div>`).join('');
      ratingHtml = `<div class="cyber-rating-badge"><div class="cyber-rating"><div class="segments">${segments}</div><span class="val">${rating.toFixed(1)}</span></div></div>`;
    }

    const statusHtml = status === 'suggested' && item.suggestedBy
      ? `<div class="cyber-status suggested-status"><i class="fas fa-user" style="color: ${getUserColor(item.suggestedBy)}"></i> ${item.suggestedBy}</div>`
      : ``;

    return `
      <div class="archive-card-container stack-${stackCount} ${isYouTube ? 'is-youtube' : ''} ${isWatched ? 'is-watched' : ''} animate-entry"
           data-id="${item.id}" style="animation-delay: ${delay}ms; --custom-color: ${color}">
        ${backLayersHtml}
        <div class="card-layer layer-front" style="background-color: color-mix(in srgb, var(--custom-color) 15%, transparent); --layer-color: ${cFront};" data-lazy-bg="${imgFront}">
          <div class="procedural-placeholder" style="border-color: color-mix(in srgb, var(--custom-color) 50%, transparent);">
            <span class="placeholder-letter" style="color: var(--custom-color); text-shadow: 0 0 10px var(--custom-color);">${title.charAt(0).toUpperCase()}</span>
          </div>
          <div class="layer-img-bg" style="opacity: 0;"></div>
          <div class="layer-content">
            ${watchedStamp}
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