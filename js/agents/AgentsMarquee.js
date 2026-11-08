/* js/agents/AgentsMarquee.js */
import EventBus from '../event-bus.js';
import { AgentCard } from '../components/AgentCard.js';

export class AgentsMarquee {
    constructor(onCardClick) {
        this.container = document.getElementById('agents-scroll-container');
        this.track = document.getElementById('agents-vertical-track');
        this.totalCountEl = document.getElementById('agents-total-count');
        this.onCardClick = onCardClick;

        this.speed = 0.5; 
        this.currentY = 0;
        this.originalHeight = 0;
        
        // Флаги состояний
        this.isHovered = false;
        this.isPointerDown = false;
        this.isDragging = false; 
        this.dragThreshold = 5; 
        
        this.startY = 0;
        this.velocity = 0;
        this.lastY = 0;
        this.lastTime = 0;
        this.animationId = null;

        this.bindContext();
    }

    bindContext() {
        this._onPointerDown = this.onPointerDown.bind(this);
        this._onPointerMove = this.onPointerMove.bind(this);
        this._onPointerUp = this.onPointerUp.bind(this);
        this._onMouseLeave = this.onMouseLeave.bind(this);
        this._onGlobalBlur = this.onGlobalBlur.bind(this);
        this.animate = this.animate.bind(this);
    }

    render(agentsData, activeAgentId) {
        if (!this.track || !this.totalCountEl) return;
        
        this.totalCountEl.textContent = agentsData.length;
        
        const html = agentsData.map(agent => {
            const colorVal = AgentCard.getRoleColor(agent.color);
            const { level } = AgentCard.calculateLevelData(agent.createdAt);
            
            const avatarContent = agent.avatarPath || agent.image 
                ? `<img src="${agent.avatarPath || agent.image}" onerror="this.style.display='none'">` 
                : (agent.customHtml || `<i class="${agent.mainIcon || 'fas fa-user'}"></i>`);

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

        this.track.innerHTML = html;
        this.setupInfiniteLoop(activeAgentId);
    }

    setupInfiniteLoop(activeAgentId) {
        const cards = Array.from(this.track.children);
        if (cards.length === 0) return;

        const gap = 12; 
        this.originalHeight = cards.reduce((sum, card) => sum + card.offsetHeight + gap, 0);

        const clonesNeeded = Math.ceil(window.innerHeight / Math.max(this.originalHeight, 1)) + 1;

        let fullHtml = this.track.innerHTML;
        for (let i = 0; i < clonesNeeded; i++) {
            this.track.innerHTML += fullHtml;
        }

        this.setActive(activeAgentId);
        this.bindEvents();
        this.resume(); // Безопасный запуск цикла
    }

    setActive(agentId) {
        if (!agentId || !this.track) return;
        this.track.querySelectorAll('.agent-list-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === agentId);
        });
    }

    bindEvents() {
        this.destroy(); // Сначала убиваем старые лисенеры, чтобы не было дублей

        this.track.addEventListener('pointerdown', this._onPointerDown);
        window.addEventListener('pointermove', this._onPointerMove);
        window.addEventListener('pointerup', this._onPointerUp);
        window.addEventListener('pointercancel', this._onPointerUp);
        window.addEventListener('blur', this._onGlobalBlur); // Защита от Alt+Tab
        document.addEventListener('pointerleave', this._onMouseLeave); // Защита от увода мыши за экран

        this.container.addEventListener('mouseenter', () => { this.isHovered = true; });
        this.container.addEventListener('mouseleave', () => { this.isHovered = false; });
        this.track.addEventListener('dragstart', e => e.preventDefault());
        
        this.track.addEventListener('click', (e) => {
            const card = e.target.closest('.agent-list-card');
            if (card && !this.isDragging) { 
                EventBus.emit('PLAY_SOUND', 'click');
                if (this.onCardClick) this.onCardClick(card.dataset.id);
            }
        });
    }

    // Жесткий сброс стейтов при потере фокуса
    onGlobalBlur() {
        this.isHovered = false;
        this.forceStopDrag();
    }

    onMouseLeave(e) {
        if (e.target === document) {
            this.forceStopDrag();
        }
    }

    forceStopDrag() {
        this.isPointerDown = false;
        if (this.isDragging) {
            this.isDragging = false;
            this.track.classList.remove('is-dragging');
        }
    }

    onPointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        
        this.isPointerDown = true;
        this.isDragging = false; 

        this.startY = e.clientY;
        this.lastY = e.clientY;
        this.lastTime = performance.now();
        this.velocity = 0;
        // ВАЖНО: Мы больше НЕ убиваем анимацию (cancelAnimationFrame) на клик! 
        // Цикл должен крутиться вечно, просто меняется ветка логики внутри него.
    }

    onPointerMove(e) {
        if (!this.isPointerDown) return;
        
        const currentY = e.clientY;
        const deltaY = currentY - this.startY;

        if (!this.isDragging && Math.abs(deltaY) > this.dragThreshold) {
            this.isDragging = true;
            this.track.classList.add('is-dragging');
            this.track.setPointerCapture(e.pointerId);
        }

        if (this.isDragging) {
            this.currentY += (currentY - this.lastY);
            
            const now = performance.now();
            const dt = now - this.lastTime;
            if (dt > 0) this.velocity = (currentY - this.lastY) / dt;

            // Физика обновляется тут же
            this.checkBoundaries();
            this.applyTransform();
        }

        this.lastY = currentY;
        this.lastTime = performance.now();
    }

    onPointerUp(e) {
        if (!this.isPointerDown) return;
        this.isPointerDown = false;
        
        if (this.isDragging) {
            this.isDragging = false;
            this.track.classList.remove('is-dragging');
            this.track.releasePointerCapture(e.pointerId);
            this.velocity = Math.max(-15, Math.min(15, this.velocity));
        }
    }

    checkBoundaries() {
        if (this.originalHeight <= 0) return;
        if (this.currentY <= -this.originalHeight) {
            this.currentY += this.originalHeight;
        } else if (this.currentY > 0) {
            this.currentY -= this.originalHeight;
        }
    }

    applyTransform() {
        if (this.track) {
            this.track.style.transform = `translate3d(0, ${this.currentY}px, 0)`;
        }
    }

    resume() {
        // Убиваем предыдущий цикл перед стартом нового, чтобы не плодить клонов
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();
    }

    animate() {
        if (!this.isPointerDown) {
            if (Math.abs(this.velocity) > 0.1) {
                // Инерция после броска
                this.currentY += this.velocity * 12; // Чуть снизил множитель, чтобы не улетало в космос
                this.velocity *= 0.92;
            } else if (!this.isHovered) {
                // Постоянное движение
                this.currentY -= this.speed;
            }
            this.checkBoundaries();
            this.applyTransform();
        }
        
        // Цикл вызывает сам себя
        this.animationId = requestAnimationFrame(this.animate);
    }

    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.pause();
        window.removeEventListener('pointermove', this._onPointerMove);
        window.removeEventListener('pointerup', this._onPointerUp);
        window.removeEventListener('pointercancel', this._onPointerUp);
        window.removeEventListener('blur', this._onGlobalBlur);
        document.removeEventListener('pointerleave', this._onMouseLeave);
    }
}