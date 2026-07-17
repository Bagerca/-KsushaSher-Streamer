/* js/subscribers.js */
import { loadData } from './api.js';

export class SubscribersManager {
    constructor() {
        this.track = document.getElementById('subscribers-track');
        
        // Физика и анимация
        this.speed = 1.0; // Базовая авто-скорость
        this.currentX = 0;
        this.originalWidth = 0;
        this.isHovered = false;
        
        // Drag (перетаскивание)
        this.isDragging = false;
        this.startX = 0;
        
        // Инерция (Glide)
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = 0;
        
        this.animationId = null;
        
        // Биндим контекст для событий
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
                this.track.innerHTML = '<div style="padding:20px; color:#666;">БАЗА АГЕНТОВ ПУСТА</div>';
            }
        } catch (error) {
            console.error('❌ [Subscribers] Ошибка движка карусели:', error);
        }
    }

    renderCards(subscribers) {
        const html = subscribers.map(sub => {
            let colorVal = sub.color || '#39ff14';
            const colorMap = {
                'green': '#39ff14', 'red': '#ff4444', 'orange': '#ff8c00',
                'blue': '#007bff', 'pink': '#ff2d95', 'cyan': '#00ffff', 'purple': '#bd00ff'
            };
            if (colorMap[colorVal]) colorVal = colorMap[colorVal];

            let avatarContent = sub.image 
                ? `<img src="${sub.image}" onerror="this.style.display='none'">` 
                : (sub.customHtml || `<i class="${sub.mainIcon}"></i>`);

            return `
            <div class="holo-card" style="--sub-color: ${colorVal}">
                <div class="card-top-deco"><span>LVL.${sub.level}</span> <i class="${sub.typeIcon}"></i></div>
                <div class="holo-avatar-container">
                    <div class="holo-avatar">${avatarContent}</div>
                    <div class="avatar-ring"></div>
                </div>
                <div class="holo-info">
                    <div class="holo-name">${sub.name}</div>
                    <div class="holo-role">${sub.role}</div>
                </div>
                <div class="card-stat-bar"><div class="fill" style="width: ${sub.stats}%"></div></div>
            </div>
            `;
        }).join('');

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
        // Используем Pointer Events (охватывает и мышь, и тачскрины)
        this.track.addEventListener('pointerdown', this.onPointerDown);
        
        // Слушаем движения глобально на window, чтобы не терять курсор
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        window.addEventListener('pointercancel', this.onPointerUp); // Страховка при системных прерываниях

        // Ховер (Пауза при наведении)
        this.track.addEventListener('mouseenter', () => { this.isHovered = true; });
        this.track.addEventListener('mouseleave', () => { this.isHovered = false; });
        
        // Жестко запрещаем браузеру пытаться тянуть картинки
        this.track.addEventListener('dragstart', e => e.preventDefault());
    }

    // --- ФИЗИКА DRAG & DROP С ИНЕРЦИЕЙ ---

    onPointerDown(e) {
        // Игнорируем правый клик мыши
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        
        this.isDragging = true;
        this.track.classList.add('is-dragging');
        
        // ЗАХВАТ КУРСОРА: браузер будет слать события этому элементу, 
        // даже если курсор ушел за пределы окна.
        this.track.setPointerCapture(e.pointerId);

        this.startX = e.clientX;
        this.lastX = e.clientX;
        this.lastTime = performance.now();
        this.velocity = 0; // Сбрасываем инерцию при новом касании
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    onPointerMove(e) {
        if (!this.isDragging) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - this.startX;
        
        this.currentX += deltaX;
        this.startX = currentX;

        // Вычисляем скорость рывка для инерции
        const now = performance.now();
        const dt = now - this.lastTime;
        if (dt > 0) {
            // Пикселей в миллисекунду
            this.velocity = (currentX - this.lastX) / dt;
        }
        
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
        
        // Ограничиваем максимальную скорость инерции, чтобы не улетело в космос
        this.velocity = Math.max(-10, Math.min(10, this.velocity));

        this.animate();
    }

    // --- ЛОГИКА БЕСКОНЕЧНОСТИ ---

    checkBoundaries() {
        if (this.currentX <= -this.originalWidth) {
            this.currentX += this.originalWidth;
        } 
        else if (this.currentX > 0) {
            this.currentX -= this.originalWidth;
        }
    }

    applyTransform() {
        this.track.style.transform = `translate3d(${this.currentX}px, 0, 0)`;
    }

    animate() {
        if (!this.isDragging) {
            
            // Если есть остаточная скорость (инерция от рывка)
            if (Math.abs(this.velocity) > 0.1) {
                // Применяем скорость (умножаем на 16мс - примерный кадр 60fps)
                this.currentX += this.velocity * 16;
                // Трение (постепенно гасим скорость)
                this.velocity *= 0.92; 
            } 
            // Если инерция угасла, и мы не держим курсор на карусели -> базовый авто-скролл
            else if (!this.isHovered) {
                this.currentX -= this.speed;
            }

            this.checkBoundaries();
            this.applyTransform();
        }
        
        this.animationId = requestAnimationFrame(this.animate);
    }
}