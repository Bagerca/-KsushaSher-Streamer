/* js/ui/AutoScrollController.js */
import EventBus from '../event-bus.js';
import { AppStore } from '../store.js';
import { MobileOptimizer } from '../services/MobileOptimizer.js';
import { Icons } from '../utils/icons.js';

/**
 * КАСТОМНЫЙ АВТОСКРОЛЛ КОЛЕСОМ МЫШИ (v2)
 *
 * Исправления v2:
 *  - Повторный middle-click во время сессии теперь тоже глушит
 *    preventDefault(), поэтому системный виджет автоскролла НЕ появляется
 *    на втором клике. Цикл стал честным: клик = старт, клик = стоп.
 *  - Якорь перерисован в цельную «капсулу» (шеврон ↑ / ромб / шеврон ↓),
 *    чтобы читался как единый контрол, а не набор разрозненных фигур.
 *
 * Физика: скорость пропорциональна расстоянию курсора от якоря,
 * мёртвая зона, плавный разгон (lerp), dt-нормализация, накопление
 * дробного остатка скролла. Курсор узнаёт о режиме через EventBus.
 */

const DEFAULT_CONFIG = {
    deadZone: 24,        // px вокруг якоря без движения
    speedFactor: 0.012,  // px/ms на каждый px дистанции сверх мёртвой зоны
    maxSpeed: 2.2,       // px/ms
    accelSmoothing: 0.18 // lerp-разгон за кадр 60fps
};

// Зоны, где middle-click обязан остаться нативным (новая вкладка / paste)
const SKIP_SELECTOR = 'a, button, input, textarea, select, label, [contenteditable="true"], [role="button"], .ally-terminal';

export class AutoScrollController {
    constructor(options = {}) {
        this.isInitialized = false;

        if (MobileOptimizer.isMobile() || window.matchMedia('(pointer: coarse)').matches) {
            console.log('🖱️ [AutoScroll] Тач-устройство. Кастомный автоскролл отключен.');
            return;
        }

        this.config = { ...DEFAULT_CONFIG, ...options };

        this.isActive = false;
        this.scrollTarget = null; // HTMLElement | window
        this.anchorX = 0;
        this.anchorY = 0;
        this.pointerX = 0;
        this.pointerY = 0;
        this.currentSpeed = 0;
        this.scrollRemainder = 0;
        this.lastDir = 'idle';

        this.rafId = null;
        this.lastFrameTime = 0;
        this.anchorEl = null;
        this.routeUnsub = null;

        this.loop = this.loop.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWindowBlur = this.onWindowBlur.bind(this);
        this.onHashChange = this.onHashChange.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);

        try {
            this.bindEvents();
            this.isInitialized = true;
            console.log('🖱️ [AutoScroll] v2 инициализирован (капсула-якорь, честный toggle)');
        } catch (error) {
            console.error('🚨 [AutoScroll] Ошибка инициализации:', error);
            this.destroy();
        }
    }

    bindEvents() {
        // Capture: гасим системный виджет до дефолтного действия браузера
        document.addEventListener('mousedown', this.onMouseDown, true);
        document.addEventListener('mousemove', this.onMouseMove, { passive: true });
        // Capture: выход по wheel срабатывает ДО SmoothWheelScroller
        document.addEventListener('wheel', this.onWheel, { capture: true, passive: true });
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('touchstart', this.onTouchStart, { passive: true });
        window.addEventListener('blur', this.onWindowBlur);
        window.addEventListener('hashchange', this.onHashChange);

        this.routeUnsub = AppStore.subscribe((state, prevState) => {
            if (!this.isActive) return;
            const prevPath = prevState && prevState.route ? prevState.route.path : null;
            if (state.route.path !== prevPath) this.stop('route');
        });
    }

    /* ==================== ДЕТЕКТ ЦЕЛИ СКРОЛЛА ==================== */

    resolveScrollTarget(fromEl) {
        let node = (fromEl instanceof Element) ? fromEl : null;
        while (node && node !== document.body && node !== document.documentElement) {
            try {
                const style = window.getComputedStyle(node);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                    node.scrollHeight > node.clientHeight + 1) {
                    return node;
                }
            } catch (error) {
                console.warn('⚠️ [AutoScroll] Ошибка чтения стилей предка:', error.message);
            }
            node = node.parentElement;
        }

        const htmlStyle = window.getComputedStyle(document.documentElement);
        const bodyStyle = window.getComputedStyle(document.body);
        if (htmlStyle.overflowY === 'hidden' || bodyStyle.overflowY === 'hidden') return null;

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        return maxScroll > 1 ? window : null;
    }

    /* ==================== СТАРТ / СТОП ==================== */

    onMouseDown(e) {
        // Любой клик во время сессии — выход.
        // ВАЖНО: middle-click при выходе тоже глушим, иначе браузер
        // показывает свой системный автоскролл на втором клике.
        if (this.isActive) {
            if (e.button === 1) e.preventDefault();
            this.stop('click');
            return;
        }
        if (e.button !== 1) return;

        const target = e.target;
        if (target instanceof Element && target.closest(SKIP_SELECTOR)) return;

        // Идёт якорная smooth-прокрутка — не вмешиваемся, но системный виджет глушим
        if (document.body.classList.contains('is-auto-scrolling')) {
            e.preventDefault();
            return;
        }

        const scrollTarget = this.resolveScrollTarget(target);
        if (!scrollTarget) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        this.start(e.clientX, e.clientY, scrollTarget);
    }

    start(x, y, scrollTarget) {
        this.isActive = true;
        this.scrollTarget = scrollTarget;
        this.anchorX = x;
        this.anchorY = y;
        this.pointerX = x;
        this.pointerY = y;
        this.currentSpeed = 0;
        this.scrollRemainder = 0;
        this.lastDir = 'idle';

        this.buildAnchor(x, y);
        document.body.classList.add('is-auto-scrolling');
        EventBus.emit('AUTOSCROLL_START');
        EventBus.emit('PLAY_SOUND', 'click');

        this.lastFrameTime = 0;
        this.rafId = requestAnimationFrame(this.loop);

        const targetName = scrollTarget === window
            ? 'WINDOW'
            : (scrollTarget.id ? `#${scrollTarget.id}` : scrollTarget.className || scrollTarget.tagName);
        console.log(`🖱️ [AutoScroll] Захват оси @ (${Math.round(x)}, ${Math.round(y)}) → ${targetName}`);
    }

    stop(reason) {
        if (!this.isActive) return;
        this.isActive = false;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.anchorEl) {
            this.anchorEl.remove();
            this.anchorEl = null;
        }
        document.body.classList.remove('is-auto-scrolling');
        this.scrollTarget = null;
        this.currentSpeed = 0;
        this.scrollRemainder = 0;

        EventBus.emit('AUTOSCROLL_END');
        console.log(`🖱️ [AutoScroll] Сессия завершена (${reason})`);
    }

    /* ==================== ВИЗУАЛ ЯКОРЯ (КАПСУЛА) ==================== */

    buildAnchor(x, y) {
        this.anchorEl = document.createElement('div');
        this.anchorEl.className = 'autoscroll-anchor';
        this.anchorEl.id = 'cyber-autoscroll-anchor';
        this.anchorEl.setAttribute('aria-hidden', 'true');
        this.anchorEl.style.left = `${x}px`;
        this.anchorEl.style.top = `${y}px`;
        this.anchorEl.innerHTML = `
            <div class="autoscroll-pulse"></div>
            <div class="autoscroll-capsule">
                <div class="autoscroll-chevron up">${Icons['chevron-up'] || ''}</div>
                <div class="autoscroll-core"></div>
                <div class="autoscroll-chevron down">${Icons['chevron-down'] || ''}</div>
            </div>
        `;
        document.body.appendChild(this.anchorEl);
    }

    /* ==================== ВЫХОДЫ ==================== */

    onMouseMove(e) {
        if (!this.isActive) return;
        this.pointerX = e.clientX;
        this.pointerY = e.clientY;
    }

    onWheel() {
        if (this.isActive) this.stop('wheel');
    }

    onKeyDown(e) {
        if (this.isActive && e.key === 'Escape') this.stop('escape');
    }

    onWindowBlur() {
        if (this.isActive) this.stop('blur');
    }

    onHashChange() {
        if (this.isActive) this.stop('route');
    }

    onTouchStart() {
        if (this.isActive) this.stop('touch');
    }

    /* ==================== ФИЗИКА ==================== */

    loop(now) {
        if (!this.isActive) return;
        this.rafId = requestAnimationFrame(this.loop);

        if (!this.lastFrameTime) this.lastFrameTime = now;
        let dt = now - this.lastFrameTime;
        this.lastFrameTime = now;
        if (dt > 100) dt = 100;

        const delta = this.pointerY - this.anchorY;
        const abs = Math.abs(delta);
        let targetSpeed = 0;
        if (abs > this.config.deadZone) {
            targetSpeed = Math.sign(delta) * Math.min(
                (abs - this.config.deadZone) * this.config.speedFactor,
                this.config.maxSpeed
            );
        }

        const t = 1 - Math.pow(1 - this.config.accelSmoothing, dt / 16.667);
        this.currentSpeed += (targetSpeed - this.currentSpeed) * t;
        if (Math.abs(this.currentSpeed) < 0.001) this.currentSpeed = 0;

        if (this.currentSpeed !== 0 && this.scrollTarget) {
            this.scrollRemainder += this.currentSpeed * dt;
            const step = Math.trunc(this.scrollRemainder);
            if (step !== 0) {
                this.scrollRemainder -= step;
                try {
                    if (this.scrollTarget === window) {
                        window.scrollBy(0, step);
                    } else {
                        this.scrollTarget.scrollTop += step;
                    }
                } catch (error) {
                    console.error('🚨 [AutoScroll] Ошибка скролла, аварийный выход:', error);
                    this.stop('error');
                    return;
                }
            }
        }

        if (this.anchorEl) {
            const dir = this.currentSpeed > 0.02 ? 'down' : this.currentSpeed < -0.02 ? 'up' : 'idle';
            if (dir !== this.lastDir) {
                this.anchorEl.classList.toggle('dir-up', dir === 'up');
                this.anchorEl.classList.toggle('dir-down', dir === 'down');
                this.lastDir = dir;
            }
            const intensity = Math.min(1, Math.abs(this.currentSpeed) / this.config.maxSpeed);
            this.anchorEl.style.setProperty('--as-intensity', intensity.toFixed(3));
        }
    }

    /* ==================== LIFECYCLE ==================== */

    destroy() {
        this.stop('destroy');
        document.removeEventListener('mousedown', this.onMouseDown, true);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('wheel', this.onWheel, { capture: true });
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('blur', this.onWindowBlur);
        window.removeEventListener('hashchange', this.onHashChange);
        if (this.routeUnsub) {
            this.routeUnsub();
            this.routeUnsub = null;
        }
        this.isInitialized = false;
        console.log('🖱️ [AutoScroll] Модуль остановлен, слушатели сняты.');
    }
}