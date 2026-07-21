/* js/modal/ModalRenderer.js */

const STATUS_TEXT_MAP = {
    'completed': 'ЗАВЕРШЕНО', 'watched': 'ПРОСМОТРЕНО',
    'playing': 'В ПРОЦЕССЕ', 'watching': 'СМОТРИМ',
    'dropped': 'БРОШЕНО', 'on-hold': 'НА ПАУЗЕ',
    'suggested': 'ПРЕДЛОЖЕНО'
};

export class ModalRenderer {
    constructor(els) {
        this.els = els;
        this.transitionTimeouts = []; 
        this.mainCol = document.getElementById('modal-col-main'); 
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
        if (bgImg && this.els.cinematicBg) {
            this.els.cinematicBg.style.backgroundImage = `url('${bgImg}')`;
        }

        const titleText = currentItem.title || "UNKNOWN";
        this.els.title.textContent = titleText;
        this.els.titleFull.textContent = titleText;
        
        // ГЕНЕРАЦИЯ ССЫЛКИ НА GOOGLE
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(titleText)}`;
        if (this.els.titleLink) this.els.titleLink.href = searchUrl;
        if (this.els.titleLinkFull) this.els.titleLinkFull.href = searchUrl;
        
        const sysId = currentItem.id || "UNKNOWN";
        this.els.id.textContent = sysId;
        this.els.type.textContent = type ? type.toUpperCase() : "UNKNOWN";
        
        const descriptionText = currentItem.description;
        const descWrapper = this.els.desc.closest('.hover-reveal-wrapper');
        
        if (!descriptionText || descriptionText.trim() === '' || descriptionText.trim() === '...') {
            descWrapper.style.display = 'none';
        } else {
            descWrapper.style.display = 'block';
            this.els.desc.textContent = descriptionText;
            this.els.descFull.textContent = descriptionText;
        }

        const effectiveStatus = currentItem.status || 'unknown';
        this.els.status.textContent = STATUS_TEXT_MAP[effectiveStatus] || effectiveStatus;
        
        this.els.status.style.backgroundColor = color;
        this.els.status.style.color = '#000';
        this.els.status.style.boxShadow = `0 0 15px color-mix(in srgb, ${color} 60%, transparent)`;

        if (effectiveStatus === 'suggested') {
            this.els.ratingBox.style.display = 'none';
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
        }
        
        this.generateBarcode(sysId.toUpperCase(), color);
        
        return effectiveStatus; 
    }

    generateBarcode(textId, color) {
        if (!this.els.techBarcode) return;
        
        const linesContainer = this.els.techBarcode.querySelector('.barcode-lines');
        if (!linesContainer) return;

        linesContainer.innerHTML = '';

        try {
            if (window.JsBarcode) {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.classList.add('modal-barcode-svg');
                linesContainer.appendChild(svg);

                window.JsBarcode(svg, textId, {
                    format: "CODE39",
                    displayValue: false, 
                    background: "transparent",
                    lineColor: color, 
                    margin: 0,
                    width: 2,
                    height: 40
                });
            } else {
                linesContainer.innerHTML = `<div style="color:${color}; font-family:monospace; font-size: 0.7rem;">[ DECODING_ERROR ]</div>`;
            }
        } catch (e) {
            console.warn('⚠️ [ModalRenderer] Не удалось сгенерировать штрихкод', e);
        }
    }

    triggerGlitchTransition(callback) {
        const elementsToAnimate = [this.els.dynamicZone];
        if (this.els.techBarcode) elementsToAnimate.push(this.els.techBarcode);
        
        this.transitionTimeouts.forEach(clearTimeout);
        this.transitionTimeouts = [];
        
        elementsToAnimate.forEach(el => {
            el.classList.remove('fade-in');
            el.classList.add('fade-out');
        });
        
        const t1 = setTimeout(() => {
            if (this.mainCol) this.mainCol.scrollTop = 0;

            callback(); 
            
            elementsToAnimate.forEach(el => {
                el.classList.remove('fade-out');
                el.classList.add('fade-in');
            });
            
            const t2 = setTimeout(() => {
                elementsToAnimate.forEach(el => el.classList.remove('fade-in'));
            }, 300);
            this.transitionTimeouts.push(t2);
            
        }, 200); 

        this.transitionTimeouts.push(t1);
    }
}