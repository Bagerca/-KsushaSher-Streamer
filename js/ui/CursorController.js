/* js/ui/CursorController.js */
import { MobileOptimizer } from '../services/MobileOptimizer.js';

export class CursorController {
    constructor() {
        // Если это мобильное устройство или тач-экран, убиваем логику, чтобы не грузить систему
        if (MobileOptimizer.isMobile() || window.matchMedia("(pointer: coarse)").matches) {
            console.log('🖱️ [Cursor] Тач-устройство обнаружено. Кастомный курсор отключен.');
            return;
        }

        this.dot = null;
        this.ring = null;
        
        this.targetX = window.innerWidth / 2;
        this.targetY = window.innerHeight / 2;
        
        this.ringX = this.targetX;
        this.ringY = this.targetY;
        
        this.speed = 0.25;
        this.rafId = null;

        // ИСПРАВЛЕНИЕ: Максимально расширенный список всех интерактивных элементов на сайте
        this.interactiveSelectors = [
            'a', 'button', 'label', 'select', '[role="button"]', 
            'input[type="button"]', 'input[type="submit"]', 'input[type="checkbox"]', 'input[type="radio"]',
            '.cyber-btn', '.cyber-btn-outline', '.interactive-cmd', '.magic-toggle', 
            '.sort-btn', '.density-btn', '.switcher-btn', '.jumper-btn', '.matrix-btn', 
            '.tuner-slot', '.cyber-page-btn-vert', '.close-detail-btn', '.music-btn',
            '.archive-card-container', '.t-card', '.track-item', '.item-playlist-card', 
            '.yt-playlist-card', '.sched-card', '.donate-card', '.agent-list-card', 
            '.squad-member', '.ally-net-card', '.lib-tab-btn',
            '.nav-marker', '.card-number-box', '.search-icon', '.suggestion-item', 
            '.agent-tierlist-preview', '.suggested-status', '.agent-twitch-btn', 
            '.hud-btn', '.music-progress-area', '.volume-ticks-container',
            '.color-picker-wrapper', '.add-row-btn', '.row-btn', '.drag-grip'
        ].join(', ');

        this.textSelectors = 'input[type="text"], input[type="password"], textarea, .ally-terminal, [contenteditable="true"]';

        this.init();
    }

    init() {
        this.buildDOM();
        this.bindEvents();
        this.loop();
        console.log('🎯 [Cursor] Тактический прицел инициализирован');
    }

    buildDOM() {
        this.dot = document.createElement('div');
        this.dot.id = 'cyber-cursor-dot';

        this.ring = document.createElement('div');
        this.ring.id = 'cyber-cursor-ring';
        this.ring.innerHTML = `
            <div class="cursor-corner tl"></div>
            <div class="cursor-corner tr"></div>
            <div class="cursor-corner bl"></div>
            <div class="cursor-corner br"></div>
        `;

        document.body.appendChild(this.ring);
        document.body.appendChild(this.dot);
    }

    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
            
            // Точку двигаем МГНОВЕННО (никаких задержек)
            this.dot.style.transform = `translate3d(${this.targetX}px, ${this.targetY}px, 0)`;
        });

        document.addEventListener('mousedown', () => {
            this.dot.classList.add('is-clicking');
            this.ring.classList.add('is-clicking');
        });

        document.addEventListener('mouseup', () => {
            this.dot.classList.remove('is-clicking');
            this.ring.classList.remove('is-clicking');
        });

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(this.interactiveSelectors)) {
                this.dot.classList.add('is-hovering');
                this.ring.classList.add('is-hovering');
            } else if (e.target.closest(this.textSelectors)) {
                this.dot.classList.add('is-text');
                this.ring.classList.add('is-text');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(this.interactiveSelectors)) {
                this.dot.classList.remove('is-hovering');
                this.ring.classList.remove('is-hovering');
            } else if (e.target.closest(this.textSelectors)) {
                this.dot.classList.remove('is-text');
                this.ring.classList.remove('is-text');
            }
        });
        
        document.addEventListener('mouseleave', () => {
            this.dot.style.opacity = '0';
            this.ring.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            this.dot.style.opacity = '1';
            this.ring.style.opacity = '1';
        });
    }

    loop() {
        this.rafId = requestAnimationFrame(() => this.loop());

        // Linear Interpolation (Lerp) для плавного преследования
        this.ringX += (this.targetX - this.ringX) * this.speed;
        this.ringY += (this.targetY - this.ringY) * this.speed;

        if (Math.abs(this.targetX - this.ringX) < 0.1) this.ringX = this.targetX;
        if (Math.abs(this.targetY - this.ringY) < 0.1) this.ringY = this.targetY;

        this.ring.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0)`;
    }
}