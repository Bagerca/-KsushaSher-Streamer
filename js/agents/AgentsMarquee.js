/* js/agents/AgentsMarquee.js */
import EventBus from '../event-bus.js';
import { AgentCard } from '../components/AgentCard.js';

export class AgentsMarquee {
    constructor(onCardClick) {
        this.container = document.getElementById('agents-scroll-container');
        this.track = document.getElementById('agents-vertical-track');
        this.totalCountEl = document.getElementById('agents-total-count');
        this.onCardClick = onCardClick;

        // --- Состояние физики ---
        this.baseSpeed = 0.5;        // авто-прокрутка (px за кадр 60fps)
        this.currentY = 0;
        this.originalHeight = 0;     // точная высота одного цикла карточек
        this.baseCardCount = 0;
        this.baseHtml = '';
        this.activeAgentId = null;

        // --- Состояние ввода ---
        this.isHovered = false;
        this.isPointerDown = false;
        this.isDragging = false;
        this.suppressClick = false;  // защита от случайного клика после драга
        this.dragThreshold = 5;
        this.activePointerId = null;
        this.startY = 0;
        this.lastY = 0;
        this.lastTime = 0;
        this.velocity = 0;           // px/ms

        // --- Служебное ---
        this.animationId = null;
        this.lastFrameTime = 0;
        this.resizeTimer = null;

        this.bindContext();
    }

    bindContext() {
        this.animate = this.animate.bind(this);
        this._onPointerDown = this.onPointerDown.bind(this);
        this._onPointerMove = this.onPointerMove.bind(this);
        this._onPointerUp = this.onPointerUp.bind(this);
        this._onLostCapture = this.onLostCapture.bind(this);
        this._onGlobalBlur = this.forceStop.bind(this);
        this._onDocPointerLeave = this.onDocPointerLeave.bind(this);
        this._onContainerEnter = () => { this.isHovered = true; };
        this._onContainerLeave = () => { this.isHovered = false; };
        this._onDragStart = (e) => e.preventDefault();
        this._onClick = this.onClick.bind(this);
        this._onResize = this.onResize.bind(this);
    }

    /* =========================================
       РЕНДЕР
       ========================================= */
    render(agentsData, activeAgentId) {
        if (!this.track || !this.container) return;
        try {
            const agents = Array.isArray(agentsData) ? agentsData : [];
            if (this.totalCountEl) this.totalCountEl.textContent = agents.length;

            if (agents.length === 0) {
                this.baseHtml = '';
                this.originalHeight = 0;
                this.track.innerHTML = '<div class="network-error">БАЗА АГЕНТОВ ПУСТА</div>';
                console.warn('👥 [AgentsMarquee] База агентов пуста.');
                return;
            }

            this.baseHtml = agents.map(agent => {
                const colorVal = AgentCard.getRoleColor(agent.color);
                const { level } = AgentCard.calculateLevelData(agent.createdAt);
                const avatarContent = AgentCard.getAvatarContent(agent);
                const displayName = agent.squadName || agent.name;
                return `
                    <div class="agent-list-card" data-id="${agent.id}" style="--card-color: ${colorVal}">
                        <div class="alc-avatar">${avatarContent}</div>
                        <div class="alc-info">
                            <div class="alc-name">${displayName}</div>
                            <div class="alc-role">${agent.role || 'Агент'}</div>
                        </div>
                        <div class="alc-lvl">LVL.${level}</div>
                    </div>
                `;
            }).join('');

            this.activeAgentId = activeAgentId;
            this.buildLoop();
            this.setActive(activeAgentId);
            this.bindEvents();
            this.resume();
            console.log(`👥 [AgentsMarquee] Лента запущена. Агентов: ${agents.length}. Цикл: ${Math.round(this.originalHeight)}px`);
        } catch (error) {
            console.error('❌ [AgentsMarquee] Ошибка рендера ленты:', error);
        }
    }

    /* =========================================
       ПОСТРОЕНИЕ БЕСКОНЕЧНОЙ ЛЕНТЫ
       ========================================= */
    buildLoop() {
        // 1. Рендерим одну эталонную копию
        this.track.innerHTML = this.baseHtml;
        const baseCards = Array.from(this.track.children);
        this.baseCardCount = baseCards.length;
        if (this.baseCardCount === 0) {
            this.originalHeight = 0;
            return;
        }

        // 2. Если контейнер скрыт (display:none при быстром переходе роутов) —
        // не измеряем мусор, а откладываем замер до появления на экране.
        const isVisible = this.container.getBoundingClientRect().height > 0;
        if (!isVisible) {
            this.track.insertAdjacentHTML('beforeend', this.baseHtml);
            this.track.insertAdjacentHTML('beforeend', this.baseHtml);
            this.originalHeight = 0;
            console.warn('👥 [AgentsMarquee] Лента скрыта при рендере. Замер отложен до появления.');
            return;
        }

        // 3. Черновая оценка цикла (нужна только чтобы понять, сколько клонов делать)
        const styles = window.getComputedStyle(this.track);
        const gap = parseFloat(styles.rowGap) || parseFloat(styles.gap) || 12;
        let period = baseCards.reduce((sum, card) => sum + card.offsetHeight + gap, 0);

        // 4. Клонируем с запасом от реальной высоты контейнера.
        // insertAdjacentHTML не пересоздаёт существующие узлы (в отличие от innerHTML +=)
        const viewH = this.container.clientHeight || window.innerHeight || 800;
        const clonesNeeded = period > 0 ? Math.max(2, Math.ceil(viewH / period) + 1) : 2;
        for (let i = 0; i < clonesNeeded; i++) {
            this.track.insertAdjacentHTML('beforeend', this.baseHtml);
        }

        // 5. ТОЧНЫЙ замер цикла: расстояние между первой карточкой оригинала
        // и первой карточкой клона. Не зависит от gap, padding и округлений,
        // а текущий translate ленты взаимно сокращается при вычитании.
        const allCards = this.track.querySelectorAll('.agent-list-card');
        if (allCards.length > this.baseCardCount) {
            const exactPeriod = allCards[this.baseCardCount].getBoundingClientRect().top
                - allCards[0].getBoundingClientRect().top;
            if (exactPeriod > 0) period = exactPeriod;
        }

        this.originalHeight = period > 0 ? period : 0;
    }

    rebuildOnResize() {
        if (!this.baseHtml) return;
        // Сохраняем "фазу" позиции, чтобы лента не прыгала при пересборке
        const oldH = this.originalHeight;
        const phase = oldH > 0 ? (this.currentY % oldH) / oldH : 0;
        this.buildLoop();
        this.setActive(this.activeAgentId);
        if (this.originalHeight > 0) {
            this.currentY = phase * this.originalHeight;
            this.wrapPosition();
            this.applyTransform();
            console.log(`👥 [AgentsMarquee] Лента пересобрана под новый размер. Цикл: ${Math.round(this.originalHeight)}px`);
        }
    }

    setActive(agentId) {
        this.activeAgentId = agentId;
        if (!agentId || !this.track) return;
        this.track.querySelectorAll('.agent-list-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === agentId);
        });
    }

    /* =========================================
       ГЛАВНАЯ МАТЕМАТИКА: ЗАЦИКЛИВАНИЕ
       Модуло приводит currentY к диапазону (-H, 0]
       при ЛЮБОМ перелёте — хоть на 10 циклов за кадр.
       ========================================= */
    wrapPosition() {
        const H = this.originalHeight;
        if (H <= 0) return;
        const wrapped = ((this.currentY % H) + H) % H; // [0, H)
        this.currentY = wrapped === 0 ? 0 : wrapped - H; // (-H, 0]
    }

    applyTransform() {
        if (this.track) {
            this.track.style.transform = `translate3d(0, ${this.currentY}px, 0)`;
        }
    }

    /* =========================================
       СОБЫТИЯ
       ========================================= */
    bindEvents() {
        this.unbindEvents(); // защита от дублей при повторном рендере
        this.track.addEventListener('pointerdown', this._onPointerDown);
        window.addEventListener('pointermove', this._onPointerMove);
        window.addEventListener('pointerup', this._onPointerUp);
        window.addEventListener('pointercancel', this._onPointerUp);
        this.track.addEventListener('lostpointercapture', this._onLostCapture);
        window.addEventListener('blur', this._onGlobalBlur);
        document.addEventListener('pointerleave', this._onDocPointerLeave);
        this.container.addEventListener('mouseenter', this._onContainerEnter);
        this.container.addEventListener('mouseleave', this._onContainerLeave);
        this.track.addEventListener('dragstart', this._onDragStart);
        this.track.addEventListener('click', this._onClick);
        window.addEventListener('resize', this._onResize);
    }

    unbindEvents() {
        if (this.track) {
            this.track.removeEventListener('pointerdown', this._onPointerDown);
            this.track.removeEventListener('lostpointercapture', this._onLostCapture);
            this.track.removeEventListener('dragstart', this._onDragStart);
            this.track.removeEventListener('click', this._onClick);
        }
        if (this.container) {
            this.container.removeEventListener('mouseenter', this._onContainerEnter);
            this.container.removeEventListener('mouseleave', this._onContainerLeave);
        }
        window.removeEventListener('pointermove', this._onPointerMove);
        window.removeEventListener('pointerup', this._onPointerUp);
        window.removeEventListener('pointercancel', this._onPointerUp);
        window.removeEventListener('blur', this._onGlobalBlur);
        window.removeEventListener('resize', this._onResize);
        document.removeEventListener('pointerleave', this._onDocPointerLeave);
        clearTimeout(this.resizeTimer);
    }

    onResize() {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            try {
                this.rebuildOnResize();
            } catch (error) {
                console.error('❌ [AgentsMarquee] Ошибка пересборки при resize:', error);
            }
        }, 250);
    }

    onPointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        this.suppressClick = false;
        if (this.originalHeight <= 0) return; // лента ещё не измерена — клик разрешен, драг нет
        this.isPointerDown = true;
        this.isDragging = false;
        this.activePointerId = e.pointerId;
        this.startY = e.clientY;
        this.lastY = e.clientY;
        this.lastTime = performance.now();
        this.velocity = 0;
        // RAF-цикл НЕ останавливаем: он просто пропускает физику, пока isPointerDown.
    }

    onPointerMove(e) {
        if (!this.isPointerDown || e.pointerId !== this.activePointerId) return;
        const y = e.clientY;
        const now = performance.now();

        // Порог драга: мелкие дрожания мыши остаются обычным кликом
        if (!this.isDragging && Math.abs(y - this.startY) > this.dragThreshold) {
            this.isDragging = true;
            this.track.classList.add('is-dragging');
            try {
                this.track.setPointerCapture(e.pointerId);
            } catch (err) {
                console.warn('👥 [AgentsMarquee] setPointerCapture недоступен:', err.message);
            }
        }

        if (this.isDragging) {
            const deltaY = y - this.lastY;
            const dt = now - this.lastTime;
            this.currentY += deltaY;
            if (dt > 0) this.velocity = deltaY / dt;
            // Только математика: трансформ применит ближайший RAF-кадр
            this.wrapPosition();
        }

        this.lastY = y;
        this.lastTime = now;
    }

    onPointerUp(e) {
        if (!this.isPointerDown) return;
        if (e.pointerId !== undefined && e.pointerId !== this.activePointerId) return;
        const wasDragging = this.isDragging;
        this.finishDrag(e.pointerId);

        if (wasDragging) {
            // Блокируем "фантомный клик" по карточке под курсором после отпускания
            this.suppressClick = true;
            if (e.type === 'pointercancel' || performance.now() - this.lastTime > 120) {
                this.velocity = 0;
            }
            this.velocity = Math.max(-10, Math.min(10, this.velocity));
        } else {
            this.velocity = 0;
        }
    }

    onClick(e) {
        const card = e.target.closest('.agent-list-card');
        if (!card || this.isDragging || this.suppressClick) return;
        EventBus.emit('PLAY_SOUND', 'click');
        if (this.onCardClick) this.onCardClick(card.dataset.id);
    }

    onLostCapture() {
        // Браузер сам отобрал захват (Alt+Tab, системное меню и т.п.).
        // При нормальном отпускании isDragging уже false — инерцию не трогаем.
        if (!this.isDragging) return;
        this.suppressClick = true;
        this.finishDrag();
        this.velocity = 0;
    }

    onDocPointerLeave(e) {
        if (e.target !== document) return;
        this.forceStop();
    }

    forceStop() {
        this.isHovered = false;
        if (this.isPointerDown) {
            if (this.isDragging) this.suppressClick = true;
            this.finishDrag();
        }
        this.velocity = 0;
    }

    finishDrag(pointerId = null) {
        this.isPointerDown = false;
        const id = pointerId !== null ? pointerId : this.activePointerId;
        if (this.isDragging) {
            this.isDragging = false;
            this.track.classList.remove('is-dragging');
        }
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
       LIFECYCLE: MOUNT / UNMOUNT
       ========================================= */
    resume() {
        if (!this.baseHtml) return;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.lastFrameTime = 0;
        this.animationId = requestAnimationFrame(this.animate);
    }

    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.lastFrameTime = 0;
        // Не возвращаемся на страницу "в середине захвата"
        if (this.isPointerDown) {
            this.finishDrag();
            this.velocity = 0;
        }
    }

    destroy() {
        this.pause();
        this.unbindEvents();
    }

    /* =========================================
       ВЕЧНЫЙ RAF-ЦИКЛ (dt-нормализованный)
       Живёт только пока страница смонтирована.
       ========================================= */
    animate(now) {
        this.animationId = requestAnimationFrame(this.animate);

        // Отложенный замер: контейнер появился на экране
        if (this.originalHeight <= 0) {
            if (this.baseHtml && this.container.getBoundingClientRect().height > 0) {
                this.buildLoop();
                this.setActive(this.activeAgentId);
                this.wrapPosition();
                this.applyTransform();
                console.log(`👥 [AgentsMarquee] Отложенный замер выполнен. Цикл: ${Math.round(this.originalHeight)}px`);
            }
            return;
        }

        if (!this.lastFrameTime) this.lastFrameTime = now;
        let dt = now - this.lastFrameTime;
        this.lastFrameTime = now;
        if (dt > 100) dt = 100; // вкладка была свёрнута — не копим гигантский шаг

        const frameScale = dt / 16.667;

        if (!this.isPointerDown) {
            if (Math.abs(this.velocity) > 0.01) {
                // Инерция: скорость в px/ms, шаг честно зависит от времени кадра.
                // Одинаковый feel на 60 Гц и 144 Гц.
                this.currentY += this.velocity * dt;
                this.velocity *= Math.pow(0.92, frameScale);
            } else {
                this.velocity = 0;
                if (!this.isHovered) {
                    this.currentY -= this.baseSpeed * frameScale;
                }
            }
            this.wrapPosition();
        }

        this.applyTransform();
    }
}