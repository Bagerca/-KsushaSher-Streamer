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
        
        // --- НАСТРОЙКИ ---
        this.dampening = 0.45; // Во сколько раз резать шаг (0.45 = шаг в 2 с лишним раза короче)
        this.speed = 0.12;     // Скорость плавной остановки
        // -----------------

        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        // Синхронизация, если юзер дернул ползунок справа
        window.addEventListener('scroll', () => {
            if (!this.isAnimating) {
                this.targetY = window.scrollY;
                this.currentY = window.scrollY;
            }
        }, { passive: true });
    }

    onWheel(e) {
        // Пропускаем, если зажат Ctrl (зум браузера) или идет авто-скролл по клику в меню
        if (e.ctrlKey || document.body.classList.contains('is-auto-scrolling')) return;

        // ЗАЩИТА ТАЧПАДОВ: Если шаг слишком маленький (< 50px), это ноутбучный тачпад.
        // Ему не нужна обрезка шага, у него свой идеальный микро-скролл.
        if (Math.abs(e.deltaY) < 50) return;

        // ЗАЩИТА КОНТЕЙНЕРОВ: Разрешаем нативный скролл внутри терминала или модалок
        let target = e.target;
        while (target && target !== document.body && target !== document.documentElement) {
            const style = window.getComputedStyle(target);
            if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
                return; // Нашли внутренний скролл, отключаем нашу магию
            }
            target = target.parentElement;
        }

        // Блокируем стандартный грубый прыжок браузера
        e.preventDefault();

        // Если анимация не идет, синхронизируем стартовую точку
        if (!this.isAnimating) {
            this.targetY = window.scrollY;
            this.currentY = window.scrollY;
        }

        // Применяем обрезанный шаг
        this.targetY += e.deltaY * this.dampening;

        // Не даем улететь за пределы страницы
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.targetY = Math.max(0, Math.min(this.targetY, maxScroll));

        // Запускаем цикл плавной доводки
        if (!this.isAnimating) {
            this.isAnimating = true;
            requestAnimationFrame(() => this.update());
        }
    }

    update() {
        if (!this.isAnimating) return;

        // Плавная интерполяция (Lerp)
        this.currentY += (this.targetY - this.currentY) * this.speed;

        // Остановка, когда почти доехали до цели
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
    new SmoothWheelScroller(); // Включаем наш новый сглаживатель шага
    console.log('⚡ [UI] Физика скролла инициализирована');
}