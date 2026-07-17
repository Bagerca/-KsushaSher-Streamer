/* js/modal/ModalPlayer.js */
import EventBus from '../event-bus.js';
import { getYouTubeId } from '../utils.js';

export class ModalPlayer {
    constructor(sectionEl, iframeEl, playlistEl) {
        this.section = sectionEl;
        this.iframe = iframeEl;
        this.playlist = playlistEl;
    }

    render(item, effectiveStatus, updateTitleCallback) {
        const videos = item.videos;
        
        if (!videos || videos.length === 0) {
            this.section.style.display = 'none';
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
            itemEl.className = `scroll-card video-card ${index === 0 ? 'active' : ''}`;
            
            itemEl.innerHTML = `
                <div class="sc-thumb is-16-9">
                    <img src="https://img.youtube.com/vi/${vidId}/mqdefault.jpg">
                    <div class="sc-overlay">
                        <i class="fas fa-play play-icon"></i>
                        <div class="equalizer-icon"><span></span><span></span><span></span></div>
                    </div>
                </div>
                <div class="sc-info"><div class="sc-title">${title}</div><div class="sc-status">СМОТРЕТЬ</div></div>
            `;
            
            itemEl.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.playlist.querySelectorAll('.video-card').forEach(b => b.classList.remove('active'));
                itemEl.classList.add('active');
                this.iframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
                
                if (effectiveStatus === 'suggested' && updateTitleCallback) {
                    updateTitleCallback(itemEl.querySelector('.sc-title').textContent);
                }
            });
            this.playlist.appendChild(itemEl);

            if (isString) {
                fetch(`https://noembed.com/embed?url=${url}`).then(r => r.json()).then(d => {
                    if (d.title) {
                        itemEl.querySelector('.sc-title').textContent = d.title;
                        if (itemEl.classList.contains('active') && effectiveStatus === 'suggested' && updateTitleCallback) {
                            updateTitleCallback(d.title);
                        }
                    }
                }).catch(() => {});
            }
        });

        this.playlist.style.display = videos.length <= 1 ? 'none' : 'flex';

        if (firstValidId) {
            this.iframe.src = `https://www.youtube.com/embed/${firstValidId}?rel=0&modestbranding=1`;
        }
    }

    stop() {
        this.iframe.src = '';
    }
}