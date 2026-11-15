/* js/subscribers.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { AgentCard } from './components/AgentCard.js';
import { AppRouter } from './router.js';

export class SubscribersManager {
    constructor() {
        this.track = document.getElementById('subscribers-track');

        // --- Состояние физики ---
        this.baseSpeed = 1.0;        // авто-прокрутка (px за кадр 60fps)
        this.currentX = 0;
        this.originalWidth = 0;      // точная ширина одного цикла карточек
        this.baseCardCount = 0;
        this.baseCardsHtml = '';

        // --- Состояние ввода ---
        this.isHovered = false;
        this.isDragging = false;
        this.activePointerId = null;
        this.lastX = 0;
        this.lastTime = 0;
        this.velocity = 0;           // px/ms

        // --- Служебное ---
        this.animationId = null;
        this.lastFrameTime = 0;
        this.resizeTimer = null;

        this.animate = this.animate.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onLostCapture = this.onLostCapture.bind(this);
        this.onWindowBlur = this.onWindowBlur.bind(this);
    }

    async init() {
        if (!this.track) return;
        try {
            const subscribers = await loadData('subscribers.json', []);
            if (!Array.isArray(subscribers) || subscribers.length === 0) {
                this.track.innerHTML = '<div class="suggestion-empty">БАЗА АГЕНТОВ ПУСТА</div>';
                return;
            }
            this.baseCardsHtml = subscribers.map(sub => AgentCard.createHTML(sub)).join('');
            this.setupLoop();
            this.bindEvents();
            this.start();
            console.log(`🎠 [Subscribers] Лента запущена. Агентов: ${subscribers.length}. Цикл: ${Math.round(this.originalWidth)}px`);
        } catch (error) {
            console.error('❌ [Subscribers] Ошибка движка карусели:', error);
        }
    }

    /* =========================================
       ПОСТРОЕНИЕ БЕСКОНЕЧНОЙ ЛЕНТЫ
    ========================================= */
    setupLoop() {
        // 1. Рендерим одну эталонную копию
        this.track.innerHTML = this.baseCardsHtml;
        const baseCards = Array.from(this.track.children);
        this.baseCardCount = baseCards.length;
        if (this.baseCardCount === 0) {
            this.originalWidth = 0;
            return;
        }

        // 2. Черновая оценка цикла (нужна только чтобы понять, сколько клонов делать)
        const gap = parseFloat(window.getComputedStyle(this.track).gap) || 80;
        let period = baseCards.reduce((sum, card) => sum + card.offsetWidth + gap, 0);

        // 3. Клонируем с запасом (минимум 2 копии сверх оригинала).
        // insertAdjacentHTML не пересоздаёт существующие узлы (в отличие от innerHTML +=)
        const viewportW = window.innerWidth || 1920;
        const clonesNeeded = period > 0 ? Math.max(2, Math.ceil(viewportW / period) + 1) : 2;
        for (let i = 0; i < clonesNeeded; i++) {
            this.track.insertAdjacentHTML('beforeend', this.baseCardsHtml);
        }

        // 4. ТОЧНЫЙ замер цикла: расстояние между первой карточкой оригинала
        // и первой карточкой клона. Не зависит от gap, padding и округлений,
        // а текущий translate ленты взаимно сокращается при вычитании.
        const allCards = this.track.querySelectorAll('.holo-card');
        if (allCards.length > this.baseCardCount) {
            const exactPeriod = allCards[this.baseCardCount].getBoundingClientRect().left
                              - allCards[0].getBoundingClientRect().left;
            if (exactPeriod > 0) period = exactPeriod;
        }

        // Если секция была скрыта (display:none при deep-link загрузке) — период 0.
        // Движок сам перемерит ленту, как только она появится на экране.
        this.originalWidth = period > 0 ? period : 0;
        if (this.originalWidth <= 0) {
            console.warn('🎠 [Subscribers] Лента скрыта при инициализации. Замер отложен до появления.');
        }
    }

    rebuildOnResize() {
        if (!this.baseCardsHtml) return;
        // Сохраняем "фазу" позиции, чтобы лента не прыгала при пересборке
        const oldW = this.originalWidth;
        const phase = oldW > 0 ? (this.currentX % oldW) / oldW : 0;
        this.setupLoop();
        if (this.originalWidth > 0) {
            this.currentX = phase * this.originalWidth;
            this.wrapPosition();
            this.applyTransform();
        }
        console.log(`🎠 [Subscribers] Лента пересобрана под новый размер. Цикл: ${Math.round(this.originalWidth)}px`);
    }

    /* =========================================
       ГЛАВНАЯ МАТЕМАТИКА: ЗАЦИКЛИВАНИЕ
       Модуло приводит currentX к диапазону (-W, 0]
       при ЛЮБОМ перелёте — хоть на 10 циклов за кадр.
       Именно это убивает баг "телепорта в начало".
    ========================================= */
    wrapPosition() {
        const W = this.originalWidth;
        if (W <= 0) return;
        const wrapped = ((this.currentX % W) + W) % W; // [0, W)
        this.currentX = wrapped === 0 ? 0 : wrapped - W; // (-W, 0]
    }

    applyTransform() {
        this.track.style.transform = `translate3d(${this.currentX}px, 0, 0)`;
    }

    /* =========================================
       СОБЫТИЯ
    ========================================= */
    bindEvents() {
        this.track.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        window.addEventListener('pointercancel', this.onPointerUp);
        this.track.addEventListener('lostpointercapture', this.onLostCapture);
        window.addEventListener('blur', this.onWindowBlur);

        this.track.addEventListener('mouseenter', () => { this.isHovered = true; });
        this.track.addEventListener('mouseleave', () => { this.isHovered = false; });
        this.track.addEventListener('dragstart', e => e.preventDefault());

        this.track.addEventListener('contextmenu', (e) => {
            const card = e.target.closest('.agent-card-component');
            if (card) {
                e.preventDefault();
                const agentId = card.dataset.id;
                EventBus.emit('PLAY_SOUND', 'expand');
                AppRouter.navigate('/agents', { id: agentId });
            }
        });

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.rebuildOnResize(), 250);
        });
    }

    onPointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (this.originalWidth <= 0) return; // лента ещё не измерена — хватать нечего
        this.isDragging = true;
        this.activePointerId = e.pointerId;
        this.track.classList.add('is-dragging');
        try {
            this.track.setPointerCapture(e.pointerId);
        } catch (err) {
            console.warn('🎠 [Subscribers] setPointerCapture недоступен:', err.message);
        }
        this.lastX = e.clientX;
        this.lastTime = performance.now();
        this.velocity = 0;
        // ВАЖНО: RAF-цикл больше НЕ останавливаем на время драга.
        // Он просто пропускает физику, пока isDragging === true.
        // Это исключает "вечную заморозку" ленты при ошибках в pointerup.
    }

    onPointerMove(e) {
        if (!this.isDragging || e.pointerId !== this.activePointerId) return;
        const x = e.clientX;
        const now = performance.now();
        const deltaX = x - this.lastX;
        const dt = now - this.lastTime;

        this.currentX += deltaX;
        if (dt > 0) this.velocity = deltaX / dt;

        this.lastX = x;
        this.lastTime = now;
        // Только математика: трансформ применит ближайший RAF-кадр (батчинг рендера)
        this.wrapPosition();
    }

    onPointerUp(e) {
        if (!this.isDragging) return;
        if (e.pointerId !== undefined && e.pointerId !== this.activePointerId) return;
        this.finishDrag(e.pointerId);
        // Если мышь замерла перед отпусканием — инерции быть не должно
        if (performance.now() - this.lastTime > 120) this.velocity = 0;
        this.velocity = Math.max(-10, Math.min(10, this.velocity));
    }

    onLostCapture() {
        // Браузер сам отобрал захват (Alt+Tab, системное меню и т.п.).
        // При нормальном отпускании isDragging уже false — инерцию не трогаем.
        if (!this.isDragging) return;
        this.finishDrag();
        this.velocity = 0;
    }

    onWindowBlur() {
        this.isHovered = false;
        this.finishDrag();
        this.velocity = 0;
    }

    finishDrag(pointerId = null) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.track.classList.remove('is-dragging');
        const id = pointerId !== null ? pointerId : this.activePointerId;
        try {
            if (id !== null && this.track.hasPointerCapture && this.track.hasPointerCapture(id)) {
                this.track.releasePointerCapture(id);
            }
        } catch (err) {
            // Захват уже снят браузером — не страшно, цикл продолжит жить
        }
        this.activePointerId = null;
    }

    /* =========================================
       ВЕЧНЫЙ RAF-ЦИКЛ (dt-нормализованный)
    ========================================= */
    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.lastFrameTime = 0;
        this.animationId = requestAnimationFrame(this.animate);
    }

    animate(now) {
        this.animationId = requestAnimationFrame(this.animate);

        // Отложенный замер: секция появилась на экране (вернулись с deep-link роута)
        if (this.originalWidth <= 0) {
            if (this.track.offsetWidth > 0 && this.baseCardsHtml) {
                this.setupLoop();
                this.wrapPosition();
            }
            return;
        }

        if (!this.lastFrameTime) this.lastFrameTime = now;
        let dt = now - this.lastFrameTime;
        this.lastFrameTime = now;
        if (dt > 100) dt = 100; // вкладка была свёрнута — не копим гигантский шаг
        const frameScale = dt / 16.667;

        if (!this.isDragging) {
            if (Math.abs(this.velocity) > 0.01) {
                // Инерция: скорость в px/ms, шаг честно зависит от времени кадра.
                // Одинаковая feel на 60 Гц и 144 Гц.
                this.currentX += this.velocity * dt;
                this.velocity *= Math.pow(0.92, frameScale);
            } else {
                this.velocity = 0;
                if (!this.isHovered) {
                    this.currentX -= this.baseSpeed * frameScale;
                }
            }
            this.wrapPosition();
        }

        this.applyTransform();
    }
}