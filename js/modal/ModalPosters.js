/* js/modal/ModalPosters.js */
import EventBus from '../event-bus.js';
import { extractColorFromImageAsync } from '../utils.js'; // Обновленный импорт

export class ModalPosters {
    constructor(wrapperEl, dotsEl, cinematicBgEl) {
        this.wrapper = wrapperEl;
        this.dotsContainer = dotsEl;
        this.cinematicBg = cinematicBgEl;
        this.currentIndex = 0;
        this.imgElements = [];
        this.stackData = [];
    }

    init(stackData, onChangeCallback, onColorExtractedCallback) {
        this.stackData = stackData;
        this.currentIndex = 0;
        
        this.wrapper.innerHTML = '<div class="modal-poster-glow"></div>';
        this.dotsContainer.innerHTML = '';
        this.imgElements = [];

        this.stackData.forEach((data, index) => {
            const img = document.createElement('img');
            img.crossOrigin = "Anonymous"; // Важно для CORS!
            img.decoding = "async"; // Аппаратная оптимизация декодирования (как в LazyLoader)
            
            // Теперь используем async/await, чтобы не блокировать интерфейс модалки
            img.onload = async () => {
                // Извлекаем цвет асинхронно
                const neonColor = await extractColorFromImageAsync(img) || data.customColor || '#ff2d95';
                img.dataset.neonColor = neonColor;
                
                // Если загрузилась именно ТЕКУЩАЯ картинка — перекрашиваем модалку!
                if (index === this.currentIndex && onColorExtractedCallback) {
                    onColorExtractedCallback(neonColor);
                }
            };
            
            img.src = data.overrideImage || data.image || 'https://via.placeholder.com/600x900?text=NO+IMAGE';
            img.className = 'modal-poster-img'; 
            this.wrapper.appendChild(img); 
            this.imgElements.push(img);
            
            if (this.stackData.length > 1) {
                const dot = document.createElement('div');
                dot.className = 'poster-dot';
                this.dotsContainer.appendChild(dot);
            }
        });

        this.updateVisuals();

        if (this.imgElements.length > 1) {
            this.wrapper.classList.add('is-interactive');
            this.wrapper.onclick = () => { 
                EventBus.emit('PLAY_SOUND', 'hover'); 
                this.currentIndex = (this.currentIndex + 1) % this.imgElements.length; 
                this.updateVisuals(); 
                
                const currentItem = this.stackData[this.currentIndex];
                const activeImg = this.imgElements[this.currentIndex];
                
                // Передаем извлеченный цвет (или дефолтный, если еще грузится)
                const currentExtractedColor = activeImg.dataset.neonColor || '#ff2d95';
                
                if (!currentItem.isImageOnly && onChangeCallback) {
                    onChangeCallback(currentItem, currentExtractedColor);
                } else {
                    const bgImg = currentItem.overrideImage || currentItem.image;
                    if (bgImg && this.cinematicBg) this.cinematicBg.style.backgroundImage = `url('${bgImg}')`;
                    if (onColorExtractedCallback) onColorExtractedCallback(currentExtractedColor);
                }
            };
        } else {
            this.wrapper.classList.remove('is-interactive');
            this.wrapper.onclick = null;
        }
    }

    updateVisuals() {
        this.imgElements.forEach((img, index) => {
            img.classList.remove('is-front', 'is-back', 'is-back-2', 'is-hidden');
            let relIndex = (index - this.currentIndex + this.imgElements.length) % this.imgElements.length;
            if (relIndex === 0) { img.classList.add('is-front'); img.style.zIndex = 30; }
            else if (relIndex === 1) { img.classList.add('is-back'); img.style.zIndex = 20; }
            else if (relIndex === 2) { img.classList.add('is-back-2'); img.style.zIndex = 10; }
            else { img.classList.add('is-hidden'); img.style.zIndex = 0; }
        });
        
        if (this.stackData.length > 1) {
            const dots = this.dotsContainer.querySelectorAll('.poster-dot');
            dots.forEach((dot, index) => { dot.classList.toggle('active', index === this.currentIndex); });
        }
    }
}