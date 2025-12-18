/* js/ui-components.js */

/**
 * Инициализация общих UI компонентов:
 * - Плавный скролл
 * - Копирование номера карты (Секция Донатов)
 */
export function initializeUI() {
    console.log('🎨 Initializing UI components...');
    
    initSmoothScroll();
    initCardCopy();
}

/**
 * Плавный скролл по якорным ссылкам
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Небольшой отступ сверху для красоты (например, если есть фиксированное меню)
                const offset = 50; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Логика копирования номера карты в буфер обмена
 * (Для новой секции Cyber Banking)
 */
function initCardCopy() {
    const cardElement = document.getElementById('card-number');
    const tooltip = document.getElementById('copy-tooltip');
    
    // Номер карты (для копирования убираем пробелы)
    const rawNumber = '4276 1805 5058 1960';
    const cleanNumber = rawNumber.replace(/\s/g, '');

    if (!cardElement) return;

    cardElement.addEventListener('click', () => {
        navigator.clipboard.writeText(cleanNumber)
            .then(() => {
                // Успешное копирование
                
                // 1. Визуальный эффект на блоке (зеленая рамка через CSS класс)
                cardElement.classList.add('copied');
                
                // 2. Смена текста тултипа
                if (tooltip) {
                    const originalText = tooltip.textContent;
                    tooltip.textContent = 'СКОПИРОВАНО!';
                    tooltip.style.color = 'var(--neon-green)';
                    tooltip.style.fontWeight = 'bold';
                    
                    // Возврат в исходное состояние через 2 секунды
                    setTimeout(() => {
                        cardElement.classList.remove('copied');
                        tooltip.textContent = 'Скопировать'; // Или originalText
                        tooltip.style.color = '';
                        tooltip.style.fontWeight = '';
                    }, 2000);
                }
            })
            .catch(err => {
                console.error('Ошибка при копировании: ', err);
                if (tooltip) {
                    tooltip.textContent = 'ОШИБКА!';
                    tooltip.style.color = '#ff4444';
                    setTimeout(() => {
                        tooltip.textContent = 'Скопировать';
                        tooltip.style.color = '';
                    }, 2000);
                }
            });
    });
}