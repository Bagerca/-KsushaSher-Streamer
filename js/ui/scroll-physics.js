/* js/ui/scroll-physics.js */

/**
 * КИБЕР-ФИЗИКА СКРОЛЛА
 * Универсальная функция для плавного перемещения камеры по клику (якоря/навигация).
 */
export function customSmoothScroll(targetPosition, duration = 800) {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    document.body.classList.add('is-auto-scrolling');

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        const ease = progress < 0.5 
            ? 8 * progress * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 4) / 2;

        window.scrollTo(0, startPosition + distance * ease);

        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        } else {
            document.body.classList.remove('is-auto-scrolling');
        }
    }
    requestAnimationFrame(animation);
}

/**
 * ГЛОБАЛЬНЫЙ БУСТЕР СКРОЛЛА
 * Отключает pointer-events во время прокрутки колесика для повышения FPS.
 */
class GlobalScrollBooster {
    constructor() {
        this.scrollTimeout = null;
        this.isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (document.body.classList.contains('is-auto-scrolling')) return;

            if (!this.isScrolling) {
                this.isScrolling = true;
                document.body.classList.add('is-mouse-scrolling');
            }
            
            clearTimeout(this.scrollTimeout);
            
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
                document.body.classList.remove('is-mouse-scrolling');
            }, 150);
        }, { passive: true });
    }
}

/**
 * ПЕРЕХВАТЧИК ЯКОРЕЙ
 */
class SmoothScrollManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (anchor && anchor.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                this.scrollTo(targetId);
            }
        });
    }

    scrollTo(targetId) {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();
        const viewOffset = window.innerHeight * 0.15; 
        let targetPosition = targetRect.top + window.scrollY - viewOffset;
        
        customSmoothScroll(Math.max(0, targetPosition), 800);
    }
}

/**
 * УМЕНЬШИТЕЛЬ ШАГА КОЛЕСИКА МЫШИ
 * Делает "тик" мышки в два раза короче и добавляет плавную кинематографичную остановку.
 */
class SmoothWheelScroller {
    constructor() {
        this.targetY = window.scrollY;
        this.currentY = window.scrollY;
        this.isAnimating = false;
        
        this.dampening = 0.45; 
        this.speed = 0.12;     

        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        window.addEventListener('scroll', () => {
            if (!this.isAnimating) {
                this.targetY = window.scrollY;
                this.currentY = window.scrollY;
            }
        }, { passive: true });
    }

    onWheel(e) {
        if (e.ctrlKey || document.body.classList.contains('is-auto-scrolling')) return;

        if (Math.abs(e.deltaY) < 50) return;

        // Разрешаем нативный скролл внутри списков/терминала
        let target = e.target;
        let isInsideScrollable = false;
        while (target && target !== document.body && target !== document.documentElement) {
            const style = window.getComputedStyle(target);
            if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
                isInsideScrollable = true;
                break;
            }
            target = target.parentElement;
        }

        // Если крутим внутри списка - отдаем управление браузеру
        if (isInsideScrollable) return; 

        // ИСПРАВЛЕНИЕ: Если открыта модалка, блокируем и дефолтный скролл, и наш кастомный. Сайт не сдвинется.
        if (document.body.classList.contains('modal-open')) {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        if (!this.isAnimating) {
            this.targetY = window.scrollY;
            this.currentY = window.scrollY;
        }

        this.targetY += e.deltaY * this.dampening;

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.targetY = Math.max(0, Math.min(this.targetY, maxScroll));

        if (!this.isAnimating) {
            this.isAnimating = true;
            requestAnimationFrame(() => this.update());
        }
    }

    update() {
        if (!this.isAnimating) return;

        this.currentY += (this.targetY - this.currentY) * this.speed;

        if (Math.abs(this.targetY - this.currentY) < 0.5) {
            this.currentY = this.targetY;
            window.scrollTo(0, this.currentY);
            this.isAnimating = false;
            return;
        }

        window.scrollTo(0, this.currentY);
        requestAnimationFrame(() => this.update());
    }
}

export function initScrollPhysics() {
    new GlobalScrollBooster();
    new SmoothScrollManager();
    new SmoothWheelScroller();
    console.log('⚡ [UI] Физика скролла инициализирована');
}