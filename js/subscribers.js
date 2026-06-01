/* js/subscribers.js */
import { loadData } from './api.js';

export class SubscribersManager {
    constructor() {
        this.track = document.getElementById('subscribers-track');
        
        // Физика и анимация
        this.speed = 1.5; // Базовая скорость (пикселей в кадр)
        this.currentX = 0;
        this.originalWidth = 0;
        this.isHovered = false;
        
        // Drag (перетаскивание)
        this.isDragging = false;
        this.startX = 0;
        this.dragOffset = 0;
        
        this.animationId = null;
        
        // Биндим контекст для событий
        this.animate = this.animate.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragMove = this.handleDragMove.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
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
        // 1. Создаем HTML оригинального набора
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

        // 2. Вставляем ОДИН набор в трек, чтобы измерить его реальную ширину
        this.track.innerHTML = html;
    }

    setupEngine() {
        // 1. Вычисляем ширину оригинального контента (с учетом gap)
        // Берем ширину всех элементов + gap между ними
        const cards = Array.from(this.track.children);
        if (cards.length === 0) return;
        
        // Получаем gap из CSS
        const gap = parseInt(window.getComputedStyle(this.track).gap) || 80;
        
        // Считаем общую ширину
        this.originalWidth = cards.reduce((sum, card) => sum + card.offsetWidth + gap, 0);

        // 2. Клонируем контент для иллюзии бесконечности
        // Нам нужно достаточно клонов, чтобы заполнить экран. 
        // Если база маленькая, клонируем 2-3 раза. Если большая — 1 раза хватит.
        const clonesNeeded = Math.ceil(window.innerWidth / this.originalWidth) + 1;
        
        let fullHtml = this.track.innerHTML;
        for (let i = 0; i < clonesNeeded; i++) {
            this.track.innerHTML += fullHtml;
        }

        // 3. Подключаем слушатели событий
        this.bindEvents();

        // 4. Запускаем GPU-ускоренный цикл
        this.animate();
    }

    bindEvents() {
        // Мышь
        this.track.addEventListener('mousedown', this.handleDragStart);
        window.addEventListener('mousemove', this.handleDragMove);
        window.addEventListener('mouseup', this.handleDragEnd);

        // Тач (Телефоны)
        this.track.addEventListener('touchstart', this.handleDragStart, { passive: true });
        window.addEventListener('touchmove', this.handleDragMove, { passive: false });
        window.addEventListener('touchend', this.handleDragEnd);

        // Ховер (Пауза при наведении)
        this.track.addEventListener('mouseenter', () => { this.isHovered = true; });
        this.track.addEventListener('mouseleave', () => { this.isHovered = false; });
        
        // Предотвращаем "призрачное" перетаскивание картинок браузером
        this.track.ondragstart = () => false;
    }

    // --- ФИЗИКА DRAG & DROP ---

    handleDragStart(e) {
        this.isDragging = true;
        this.track.classList.add('is-dragging'); // Меняем курсор
        
        // Определяем тип события (мышь или тач)
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        this.startX = clientX;
        
        // Останавливаем автоматическую анимацию
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    handleDragMove(e) {
        if (!this.isDragging) return;
        
        // Для тач-устройств отменяем скролл страницы, если тащим по горизонтали
        if (e.type.includes('touch') && e.cancelable) e.preventDefault();

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const deltaX = clientX - this.startX;
        
        // Обновляем текущую позицию
        this.currentX += deltaX;
        this.startX = clientX; // Обновляем старт для следующего тика

        // Проверяем границы для бесконечности при ручном скролле
        this.checkBoundaries();
        this.applyTransform();
    }

    handleDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.track.classList.remove('is-dragging');
        
        // Возобновляем цикл
        this.animate();
    }

    // --- ЛОГИКА БЕСКОНЕЧНОСТИ ---

    checkBoundaries() {
        // Если уехали влево за пределы ОДНОГО оригинального набора
        if (this.currentX <= -this.originalWidth) {
            // Незаметно перескакиваем в начало (+originalWidth)
            this.currentX += this.originalWidth;
        } 
        // Если при ручном драге уехали вправо (в плюс)
        else if (this.currentX > 0) {
            // Незаметно перескакиваем назад
            this.currentX -= this.originalWidth;
        }
    }

    applyTransform() {
        // translate3d заставляет браузер обрабатывать этот слой на видеокарте (GPU)
        this.track.style.transform = `translate3d(${this.currentX}px, 0, 0)`;
    }

    animate() {
        // Двигаемся только если не тащим мышкой и не навели курсор
        if (!this.isDragging && !this.isHovered) {
            this.currentX -= this.speed;
            this.checkBoundaries();
            this.applyTransform();
        }
        
        // Рекурсивный вызов (60 раз в секунду)
        this.animationId = requestAnimationFrame(this.animate);
    }
}