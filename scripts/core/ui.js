// Управление интерфейсом
const UI = {
    // Инициализация навигации
    initNavigation() {
        // Плавная прокрутка для якорных ссылок
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = anchor.getAttribute('href');
                Helpers.smoothScroll(target);
            });
        });

        // Закрытие меню при клике на ссылку (для мобильной версии)
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                const navMenu = document.getElementById('nav-menu');
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    },

    // Инициализация копирования номера карты
    initCardCopy() {
        const cardElement = document.getElementById('card-number');
        if (!cardElement) return;

        cardElement.addEventListener('click', async () => {
            const cardNumber = '4276180550581960';
            try {
                await Helpers.copyToClipboard(cardNumber);
                
                const tooltip = document.getElementById('copy-tooltip');
                if (tooltip) {
                    tooltip.textContent = 'Скопировано!';
                    setTimeout(() => {
                        tooltip.textContent = 'Нажмите чтобы скопировать';
                    }, 2000);
                }
            } catch (error) {
                console.error('Ошибка копирования:', error);
            }
        });
    },

    // Показать уведомление
    showNotification(message, type = 'info') {
        // Простая реализация уведомления
        console.log(`${type.toUpperCase()}: ${message}`);
    },

    // Показать/скрыть лоадер
    setLoading(show) {
        // Можно добавить лоадер при необходимости
        if (show) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = 'default';
        }
    }
};
