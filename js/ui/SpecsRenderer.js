/* js/ui/SpecsRenderer.js */
import { AppConfig } from '../config.js';

export class SpecsRenderer {
    constructor() {
        this.grid = document.querySelector('.specs-grid');
        this.hasAnimated = false;
        
        if (this.grid) {
            this.init();
        }
    }

    init() {
        this.renderCards();
        this.setupEntranceAnimation();
    }

    renderCards() {
        if (!AppConfig.hardware || AppConfig.hardware.length === 0) return;

        // ИСПРАВЛЕНИЕ: Используем animation-delay вместо transition-delay, 
        // чтобы задержка работала только при появлении, а не при наведении.
        // Заодно удалили лишний HTML сканера и линии загрузки.
        const html = AppConfig.hardware.map((hw, index) => `
            <div class="spec-card" style="animation-delay: ${index * 0.15}s">
                <div class="card-glass"></div>
                <div class="spec-content">
                    <div class="spec-icon-box">
                        <i class="${hw.icon}"></i>
                    </div>
                    <div class="spec-info">
                        <h3 class="spec-label">${hw.label}</h3>
                        <p class="spec-value">${hw.value}</p>
                        <div class="spec-meta">
                            ${hw.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="tech-corner top-right"></div>
                <div class="tech-corner bottom-left"></div>
            </div>
        `).join('');

        this.grid.innerHTML = html;
    }

    // Анимация при скролле (Загораются по очереди)
    setupEntranceAnimation() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.hasAnimated = true;
                    this.grid.classList.add('is-visible');
                    observer.disconnect();
                }
            });
        }, { threshold: 0.2 });

        observer.observe(this.grid);
    }
}

export function initSpecs() {
    new SpecsRenderer();
    console.log('💻 [UI] Модуль спецификаций железа загружен');
}