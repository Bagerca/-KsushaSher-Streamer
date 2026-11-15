/* js/ui/CursorController.js */
import { MobileOptimizer } from '../services/MobileOptimizer.js';
import EventBus from '../event-bus.js';
import { Icons } from '../utils/icons.js';

const STATE_CLASSES = ['is-hovering', 'is-text', 'is-external'];

/**
 * КАСТОМНЫЙ КУРСОР «ТАКТИЧЕСКИЙ ПРИЦЕЛ»
 *
 * Плавность:
 *  - позиция кольца — dt-нормализованный lerp в JS;
 *  - размер/раскрытие углов — transform: scale() внутреннего frame (GPU);
 *  - цвета/прозрачность — CSS-переходы;
 *  - гистерезис: возврат к базовому виду откладывается, чтобы курсор
 *    не «щёлкал» при проходе между соседними кнопками.
 *
 * Живые детали (CSS-анимации):
 *  - текстовая каретка мигает как настоящий caret (step-end);
 *  - стрелка внешней ссылки слегка пульсирует размером.
 *
 * Fail-safe: системный курсор прячется только классом html.has-cyber-cursor.
 */
export class CursorController {
    constructor() {
        this.isInitialized = false;

        if (MobileOptimizer.isMobile() || window.matchMedia('(pointer: coarse)').matches) {
            console.log('🖱️ [Cursor] Тач-устройство. Кастомный курсор отключен.');
            return;
        }

        this.dot = null;
        this.ring = null;

        this.targetX = window.innerWidth / 2;
        this.targetY = window.innerHeight / 2;
        this.ringX = this.targetX;
        this.ringY = this.targetY;
        this.speed = 0.2;

        this.isVisible = false;
        this.currentState = 'default';
        this.lastHoverTarget = null;

        this.pendingState = null;
        this.stateTimer = null;
        this.downgradeDelay = 70;

        this.rafId = null;
        this.lastFrameTime = 0;
        this.lastRenderX = NaN;
        this.lastRenderY = NaN;

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
            '.color-picker-wrapper', '.add-row-btn', '.row-btn', '.drag-grip',
            '.poster-dot', '.item-poster-wrapper.is-interactive', '.holo-card'
        ].join(', ');

        this.textSelectors = 'input[type="text"], input[type="password"], input[type="search"], input[type="email"], input[type="number"], input:not([type]), textarea, .ally-terminal, [contenteditable="true"]';
        this.externalSelectors = 'a[target="_blank"], [data-cursor="external"]';

        this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.prefersReducedMotion = this.reducedMotionQuery.matches;

        this.loop = this.loop.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onDocMouseOut = this.onDocMouseOut.bind(this);
        this.onWindowBlur = this.onWindowBlur.bind(this);
        this.onAutoScrollStart = this.onAutoScrollStart.bind(this);
        this.onAutoScrollEnd = this.onAutoScrollEnd.bind(this);
        this.onReducedMotionChange = this.onReducedMotionChange.bind(this);

        try {
            this.init();
        } catch (error) {
            console.error('🚨 [Cursor] Ошибка инициализации, возвращаю системный курсор:', error);
            this.destroy();
        }
    }

    init() {
        this.buildDOM();
        document.documentElement.classList.add('has-cyber-cursor');
        this.bindEvents();
        this.isInitialized = true;
        this.rafId = requestAnimationFrame(this.loop);
        console.log('🎯 [Cursor] Инициализирован (мигающая каретка + пульс внешней стрелки)');
    }

    buildDOM() {
        this.dot = document.createElement('div');
        this.dot.id = 'cyber-cursor-dot';
        this.dot.className = 'is-hidden';
        this.dot.setAttribute('aria-hidden', 'true');

        this.ring = document.createElement('div');
        this.ring.id = 'cyber-cursor-ring';
        this.ring.className = 'is-hidden';
        this.ring.setAttribute('aria-hidden', 'true');
        this.ring.innerHTML = `
            <div class="cursor-ring-frame">
                <div class="cursor-corner tl"></div>
                <div class="cursor-corner tr"></div>
                <div class="cursor-corner bl"></div>
                <div class="cursor-corner br"></div>
                <div class="cursor-external-badge" aria-hidden="true">${Icons['arrow-up'] || ''}</div>
                <div class="cursor-autoscroll-glyph" aria-hidden="true">
                    <span>${Icons['chevron-up'] || ''}</span>
                    <span>${Icons['chevron-down'] || ''}</span>
                </div>
            </div>
        `;

        document.body.appendChild(this.ring);
        document.body.appendChild(this.dot);
    }

    bindEvents() {
        document.addEventListener('mousemove', this.onMouseMove, { passive: true });
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('mouseover', this.onMouseOver, { passive: true });
        document.addEventListener('mouseout', this.onDocMouseOut, { passive: true });
        window.addEventListener('blur', this.onWindowBlur);

        EventBus.on('AUTOSCROLL_START', this.onAutoScrollStart);
        EventBus.on('AUTOSCROLL_END', this.onAutoScrollEnd);

        try {
            this.reducedMotionQuery.addEventListener('change', this.onReducedMotionChange);
        } catch (e) {
            if (this.reducedMotionQuery.addListener) this.reducedMotionQuery.addListener(this.onReducedMotionChange);
        }
    }

    /* ==================== СОБЫТИЯ ==================== */

    onMouseMove(e) {
        this.targetX = e.clientX;
        this.targetY = e.clientY;

        if (!this.isVisible) this.setVisible(true);

        if (this.dot) {
            this.dot.style.transform = `translate3d(${this.targetX}px, ${this.targetY}px, 0)`;
        }

        const target = e.target;
        if (target !== this.lastHoverTarget || (this.lastHoverTarget && !this.lastHoverTarget.isConnected)) {
            this.lastHoverTarget = target;
            this.requestState(this.resolveState(target));
        }
    }

    onMouseDown() {
        if (!this.dot || !this.ring) return;
        this.dot.classList.add('is-clicking');
        this.ring.classList.add('is-clicking');
    }

    onMouseUp() {
        if (!this.dot || !this.ring) return;
        this.dot.classList.remove('is-clicking');
        this.ring.classList.remove('is-clicking');
    }

    onKeyDown(e) {
        if (e.key === 'Tab') this.setVisible(false);
    }

    onMouseOver(e) {
        const target = e.target;
        if (target && target.tagName === 'IFRAME') this.setVisible(false);
    }

    onDocMouseOut(e) {
        if (!e.relatedTarget) this.setVisible(false);
    }

    onWindowBlur() {
        if (this.dot) this.dot.classList.remove('is-clicking');
        if (this.ring) this.ring.classList.remove('is-clicking');
        const active = document.activeElement;
        if (active && active.tagName === 'IFRAME') this.setVisible(false);
    }

    onAutoScrollStart() {
        if (!this.dot || !this.ring) return;
        this.cancelPending();
        this.dot.classList.add('is-autoscroll');
        this.ring.classList.add('is-autoscroll');
        this.lastHoverTarget = null;
        this.applyState('default');
    }

    onAutoScrollEnd() {
        if (!this.dot || !this.ring) return;
        this.dot.classList.remove('is-autoscroll');
        this.ring.classList.remove('is-autoscroll');
        this.lastHoverTarget = null;
    }

    onReducedMotionChange(e) {
        this.prefersReducedMotion = e.matches;
    }

    /* ==================== СТЕЙТ-МАШИНА ==================== */

    resolveState(target) {
        if (!target || !(target instanceof Element)) return 'default';
        try {
            if (target.closest(this.textSelectors)) return 'text';
            if (target.closest(this.externalSelectors)) return 'external';
            if (target.closest(this.interactiveSelectors)) return 'interactive';
        } catch (error) {
            console.warn('⚠️ [Cursor] Ошибка resolveState:', error.message);
        }
        return 'default';
    }

    requestState(next) {
        if (next === this.currentState) {
            this.cancelPending();
            return;
        }
        if (next === 'default' && this.currentState !== 'default') {
            this.cancelPending();
            this.pendingState = next;
            this.stateTimer = setTimeout(() => {
                this.stateTimer = null;
                const pending = this.pendingState;
                this.pendingState = null;
                if (pending !== null) this.applyState(pending);
            }, this.downgradeDelay);
        } else {
            this.cancelPending();
            this.applyState(next);
        }
    }

    cancelPending() {
        if (this.stateTimer) {
            clearTimeout(this.stateTimer);
            this.stateTimer = null;
        }
        this.pendingState = null;
    }

    applyState(state) {
        if (state === this.currentState || !this.dot || !this.ring) return;
        this.currentState = state;
        this.dot.classList.remove(...STATE_CLASSES);
        this.ring.classList.remove(...STATE_CLASSES);
        if (state === 'interactive') {
            this.dot.classList.add('is-hovering');
            this.ring.classList.add('is-hovering');
        } else if (state === 'text') {
            this.dot.classList.add('is-text');
            this.ring.classList.add('is-text');
        } else if (state === 'external') {
            this.dot.classList.add('is-external');
            this.ring.classList.add('is-external');
        }
    }

    /* ==================== ВИДИМОСТЬ ==================== */

    setVisible(visible) {
        if (this.isVisible === visible || !this.dot || !this.ring) return;
        this.isVisible = visible;
        this.dot.classList.toggle('is-hidden', !visible);
        this.ring.classList.toggle('is-hidden', !visible);
        if (visible) {
            this.ringX = this.targetX;
            this.ringY = this.targetY;
            this.renderRing(true);
        } else {
            this.cancelPending();
            this.applyState('default');
        }
    }

    /* ==================== ФИЗИКА ==================== */

    loop(now) {
        this.rafId = requestAnimationFrame(this.loop);

        if (!this.isVisible) {
            this.lastFrameTime = now;
            return;
        }

        if (!this.lastFrameTime) this.lastFrameTime = now;
        let dt = now - this.lastFrameTime;
        this.lastFrameTime = now;
        if (dt > 100) dt = 100;

        if (this.prefersReducedMotion) {
            this.ringX = this.targetX;
            this.ringY = this.targetY;
        } else {
            const t = 1 - Math.pow(1 - this.speed, dt / 16.667);
            this.ringX += (this.targetX - this.ringX) * t;
            this.ringY += (this.targetY - this.ringY) * t;
            if (Math.abs(this.targetX - this.ringX) < 0.1) this.ringX = this.targetX;
            if (Math.abs(this.targetY - this.ringY) < 0.1) this.ringY = this.targetY;
        }

        this.renderRing(false);
    }

    renderRing(force) {
        if (!this.ring) return;
        if (!force &&
            Math.abs(this.ringX - this.lastRenderX) < 0.05 &&
            Math.abs(this.ringY - this.lastRenderY) < 0.05) return;
        this.lastRenderX = this.ringX;
        this.lastRenderY = this.ringY;
        this.ring.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0)`;
    }

    /* ==================== LIFECYCLE ==================== */

    destroy() {
        this.cancelPending();
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('mouseover', this.onMouseOver);
        document.removeEventListener('mouseout', this.onDocMouseOut);
        window.removeEventListener('blur', this.onWindowBlur);
        EventBus.off('AUTOSCROLL_START', this.onAutoScrollStart);
        EventBus.off('AUTOSCROLL_END', this.onAutoScrollEnd);
        try {
            this.reducedMotionQuery.removeEventListener('change', this.onReducedMotionChange);
        } catch (e) {
            if (this.reducedMotionQuery.removeListener) this.reducedMotionQuery.removeListener(this.onReducedMotionChange);
        }
        if (this.dot) { this.dot.remove(); this.dot = null; }
        if (this.ring) { this.ring.remove(); this.ring = null; }
        document.documentElement.classList.remove('has-cyber-cursor');
        this.isInitialized = false;
        console.log('🎯 [Cursor] Остановлен, системный курсор восстановлен.');
    }
}