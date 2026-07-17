/* js/modal/ModalRenderer.js */
import { GENRE_MAP } from '../media-store.js';

const STATUS_TEXT_MAP = {
    'completed': 'ЗАВЕРШЕНО', 'watched': 'ПРОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'НА ПАУЗЕ',
    'suggested': 'ПРЕДЛОЖЕНО'
};

const STATUS_COLOR_MAP = {
    'completed': '#39ff14', 'watched': '#39ff14',
    'playing': '#007bff', 'watching': '#007bff',
    'dropped': '#ff4444', 'on-hold': '#ffd700', 'suggested': '#ff2d95' 
};

export class ModalRenderer {
    constructor(els) {
        this.els = els;
    }

    setLayoutMode(format, overlay) {
        if (format === 'youtube') {
            this.els.layout.className = 'modal-layout layout-cinema';
            overlay.classList.add('is-cinema-mode'); 
        } else {
            this.els.layout.className = 'modal-layout layout-standard';
            overlay.classList.remove('is-cinema-mode');
        }
    }

    updateText(currentItem, type, color) {
        const bgImg = currentItem.overrideImage || currentItem.image;
        if (bgImg && this.els.cinematicBg) this.els.cinematicBg.style.backgroundImage = `url('${bgImg}')`;

        this.els.title.textContent = currentItem.title || "UNKNOWN";
        this.els.id.textContent = currentItem.id || "---";
        this.els.type.textContent = type ? type.toUpperCase() : "UNKNOWN";
        
        const descriptionText = currentItem.description || "Описание отсутствует.";
        this.els.desc.textContent = descriptionText;
        this.els.descFull.textContent = descriptionText;

        const effectiveStatus = currentItem.status || 'unknown';
        this.els.status.textContent = STATUS_TEXT_MAP[effectiveStatus] || effectiveStatus;
        
        const statusColor = STATUS_COLOR_MAP[effectiveStatus] || '#fff';
        this.els.status.style.backgroundColor = statusColor;
        this.els.status.style.color = ['dropped', 'playing', 'watching'].includes(effectiveStatus) ? '#fff' : '#000';

        if (effectiveStatus === 'suggested') {
            this.els.ratingBox.style.display = 'none';
            this.els.genres.innerHTML = '';
        } else {
            this.els.ratingBox.style.display = 'flex';
            let rating = currentItem.rating || 0;
            
            if (rating > 0) {
                this.els.ratingVal.textContent = rating.toFixed(1);
                this.els.ratingVal.style.color = color;
                
                const rScore = Math.round(rating);
                let segmentsHtml = '';
                for(let i=0; i<5; i++) {
                    segmentsHtml += `<div class="modal-segment-line ${i < rScore ? 'filled' : ''}" style="color:${color}"></div>`;
                }
                this.els.segments.innerHTML = segmentsHtml;
            } else {
                this.els.ratingVal.textContent = "N/A";
                this.els.ratingVal.style.color = "#666";
                this.els.segments.innerHTML = `<span style="font-family:monospace;font-size:0.7rem;color:#666;">NO_DATA</span>`;
            }
            
            this.els.genres.innerHTML = currentItem.genres ? currentItem.genres.map(g => `<span class="modal-genre-tag">${GENRE_MAP[g] || g}</span>`).join('') : '';
        }
        
        return effectiveStatus; 
    }

    triggerGlitchTransition(callback) {
        const elementsToAnimate = [this.els.dynamicZone];
        if (this.els.techBarcode) elementsToAnimate.push(this.els.techBarcode);
        
        elementsToAnimate.forEach(el => el.classList.add('fade-out'));
        
        setTimeout(() => {
            callback(); 
            elementsToAnimate.forEach(el => {
                el.classList.remove('fade-out');
                el.classList.add('fade-in');
            });
            setTimeout(() => {
                elementsToAnimate.forEach(el => el.classList.remove('fade-in'));
            }, 300);
        }, 200); 
    }
}