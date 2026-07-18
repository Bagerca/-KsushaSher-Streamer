/* js/modal/ModalPlayer.js */
import EventBus from '../event-bus.js';
import { getYouTubeId } from '../utils.js';

export class ModalPlayer {
    constructor(sectionEl, iframeEl, playlistEl, playlistColEl) {
        this.section = sectionEl;
        this.iframe = iframeEl;
        this.playlist = playlistEl;
        this.playlistCol = playlistColEl; 
    }

    render(item, effectiveStatus, updateTitleCallback) {
        const videos = item.videos;
        
        if (!videos || videos.length === 0) {
            this.section.style.display = 'none';
            if (this.playlistCol) this.playlistCol.style.display = 'none';
            this.iframe.src = '';
            return;
        }

        this.section.style.display = 'flex'; 
        this.playlist.innerHTML = '';
        let firstValidId = null;

        videos.forEach((vid, index) => {
            const isString = typeof vid === 'string';
            const url = isString ? vid : vid.url;
            let title = (!isString && vid.title) ? vid.title : `Запись #${index + 1}`;
            const vidId = getYouTubeId(url);
            
            if (!vidId) return;
            if (!firstValidId) firstValidId = vidId;

            const itemEl = document.createElement('div');
            itemEl.className = `vertical-video-card ${index === 0 ? 'active' : ''}`;
            
            // XSS FIX: Каркас вставляем через innerHTML, а пользовательские данные безопасно
            itemEl.innerHTML = `
                <div class="v-thumb">
                    <img src="https://img.youtube.com/vi/${vidId}/mqdefault.jpg" alt="thumbnail">
                    <div class="v-overlay"><i class="fas fa-play play-icon"></i><div class="v-equalizer"><span></span><span></span><span></span></div></div>
                </div>
                <div class="v-info">
                    <div class="v-title"></div>
                    <div class="v-status">СМОТРЕТЬ</div>
                </div>
            `;
            
            // XSS FIX: Безопасная вставка текста
            const titleEl = itemEl.querySelector('.v-title');
            titleEl.textContent = title;
            
            itemEl.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.playlist.querySelectorAll('.vertical-video-card').forEach(b => b.classList.remove('active'));
                itemEl.classList.add('active');
                
                // ИСПРАВЛЕНИЕ: Убрали autoplay=1 для переключаемых видео
                this.iframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=0&rel=0&modestbranding=1`;
                
                if (effectiveStatus === 'suggested' && updateTitleCallback) {
                    updateTitleCallback(titleEl.textContent);
                }
            });
            this.playlist.appendChild(itemEl);

            if (isString) {
                // Базовая защита от падения API noembed
                fetch(`https://noembed.com/embed?url=${url}`)
                    .then(r => {
                        if (!r.ok) throw new Error('API Error');
                        return r.json();
                    })
                    .then(d => {
                        if (d.title) {
                            titleEl.textContent = d.title;
                            if (itemEl.classList.contains('active') && effectiveStatus === 'suggested' && updateTitleCallback) {
                                updateTitleCallback(d.title);
                            }
                        }
                    }).catch(e => console.warn('⚠️ [ModalPlayer] Не удалось подтянуть название с YouTube:', e.message));
            }
        });

        if (this.playlistCol) {
            this.playlistCol.style.display = videos.length <= 1 ? 'none' : 'flex';
        }

        if (firstValidId) {
            // ИСПРАВЛЕНИЕ: Убрали autoplay=1 для первого запуска
            this.iframe.src = `https://www.youtube.com/embed/${firstValidId}?autoplay=0&rel=0&modestbranding=1`;
        }
    }

    stop() {
        this.iframe.src = '';
    }
}