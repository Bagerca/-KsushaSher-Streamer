/* js/ui/scroll-physics.js */

/**
 * КИБЕР-ФИЗИКА СКРОЛЛА
 * Универсальная функция для плавного перемещения камеры.
 * Экспортируется для использования в навигационном луче.
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

export function initScrollPhysics() {
    new GlobalScrollBooster();
    new SmoothScrollManager();
    console.log('⚡ [UI] Физика скролла инициализирована');
}