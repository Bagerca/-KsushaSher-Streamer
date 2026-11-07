/* js/subscribers.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { AgentCard } from './components/AgentCard.js';
import { AppRouter } from './router.js';

export class SubscribersManager {
    constructor() {
        this.track = document.getElementById('subscribers-track');
        
        this.speed = 1.0; 
        this.currentX = 0;
        this.originalWidth = 0;
        this.isHovered = false;
        
        this.isDragging = false;
        this.startX = 0;
        
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = 0;
        this.animationId = null;
        
        this.animate = this.animate.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    async init() {
        if (!this.track) return;

        try {
            const subscribers = await loadData('subscribers.json', []);
            
            if (subscribers.length > 0) {
                this.renderCards(subscribers);
                this.setupEngine();
            } else {
                this.track.innerHTML = '<div class="suggestion-empty">БАЗА АГЕНТОВ ПУСТА</div>';
            }
        } catch (error) {
            console.error('❌ [Subscribers] Ошибка движка карусели:', error);
        }
    }

    renderCards(subscribers) {
        const html = subscribers.map(sub => AgentCard.createHTML(sub)).join('');
        this.track.innerHTML = html;
    }

    setupEngine() {
        const cards = Array.from(this.track.children);
        if (cards.length === 0) return;
        
        const gap = parseInt(window.getComputedStyle(this.track).gap) || 80;
        this.originalWidth = cards.reduce((sum, card) => sum + card.offsetWidth + gap, 0);

        const clonesNeeded = Math.ceil(window.innerWidth / this.originalWidth) + 1;
        
        let fullHtml = this.track.innerHTML;
        for (let i = 0; i < clonesNeeded; i++) {
            this.track.innerHTML += fullHtml;
        }

        this.bindEvents();
        this.animate();
    }

    bindEvents() {
        this.track.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        window.addEventListener('pointercancel', this.onPointerUp); 

        this.track.addEventListener('mouseenter', () => { this.isHovered = true; });
        this.track.addEventListener('mouseleave', () => { this.isHovered = false; });
        this.track.addEventListener('dragstart', e => e.preventDefault());
        
        this.track.addEventListener('contextmenu', (e) => {
            const card = e.target.closest('.agent-card-component');
            if (card) {
                e.preventDefault();
                const agentId = card.dataset.id;
                EventBus.emit('PLAY_SOUND', 'expand');
                // Перенаправляем на новую полноэкранную страницу
                AppRouter.navigate('/agents', { id: agentId });
            }
        });
    }

    onPointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        
        this.isDragging = true;
        this.track.classList.add('is-dragging');
        this.track.setPointerCapture(e.pointerId);

        this.startX = e.clientX;
        this.lastX = e.clientX;
        this.lastTime = performance.now();
        this.velocity = 0; 
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    onPointerMove(e) {
        if (!this.isDragging) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - this.startX;
        this.currentX += deltaX;
        this.startX = currentX;

        const now = performance.now();
        const dt = now - this.lastTime;
        if (dt > 0) this.velocity = (currentX - this.lastX) / dt;
        
        this.lastX = currentX;
        this.lastTime = now;

        this.checkBoundaries();
        this.applyTransform();
    }

    onPointerUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.track.classList.remove('is-dragging');
        this.track.releasePointerCapture(e.pointerId);
        
        this.velocity = Math.max(-10, Math.min(10, this.velocity));
        this.animate();
    }

    checkBoundaries() {
        if (this.currentX <= -this.originalWidth) {
            this.currentX += this.originalWidth;
        } else if (this.currentX > 0) {
            this.currentX -= this.originalWidth;
        }
    }

    applyTransform() {
        this.track.style.transform = `translate3d(${this.currentX}px, 0, 0)`;
    }

    animate() {
        if (!this.isDragging) {
            if (Math.abs(this.velocity) > 0.1) {
                this.currentX += this.velocity * 16;
                this.velocity *= 0.92; 
            } else if (!this.isHovered) {
                this.currentX -= this.speed;
            }
            this.checkBoundaries();
            this.applyTransform();
        }
        this.animationId = requestAnimationFrame(this.animate);
    }
}