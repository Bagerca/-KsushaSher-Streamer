// UI interactions and animations
export function initializeApp() {
    initMobileMenu();
    initHeaderHover(); // Добавлена новая функция для хедера
    initModals();
    initHeroImageEasterEgg();
    initCardCopy();
    
    console.log('🎨 UI initialized successfully');
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        document.querySelectorAll('#nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Header hover functionality - НОВАЯ ФУНКЦИЯ ДЛЯ СКРЫВАЮЩЕГОСЯ ХЕДЕРА
function initHeaderHover() {
    const header = document.querySelector('header');
    if (!header) return;

    // Создаем зону срабатывания вверху страницы
    const hoverZone = document.createElement('div');
    hoverZone.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 30px;
        background: transparent;
        z-index: 999;
        pointer-events: auto;
    `;
    document.body.appendChild(hoverZone);

    let hideTimeout;
    let isHeaderHovered = false;

    // Показываем хедер при наведении на верхнюю зону
    hoverZone.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        header.classList.add('header-expanded');
    });

    // Скрываем хедер при уходе мыши из зоны, если мышь не на хедере
    hoverZone.addEventListener('mouseleave', () => {
        if (!isHeaderHovered) {
            hideTimeout = setTimeout(() => {
                header.classList.remove('header-expanded');
            }, 500);
        }
    });

    // Отслеживаем наведение на сам хедер
    header.addEventListener('mouseenter', () => {
        isHeaderHovered = true;
        clearTimeout(hideTimeout);
        header.classList.add('header-expanded');
    });

    header.addEventListener('mouseleave', () => {
        isHeaderHovered = false;
        hideTimeout = setTimeout(() => {
            header.classList.remove('header-expanded');
        }, 500);
    });

    // На мобильных устройствах удаляем зону и обработчики
    if (window.innerWidth <= 768) {
        hoverZone.remove();
        header.classList.add('header-expanded'); // На мобильных хедер всегда expanded
    }

    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            hoverZone.remove();
            header.classList.add('header-expanded');
        } else {
            if (!document.body.contains(hoverZone)) {
                document.body.appendChild(hoverZone);
            }
        }
    });
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Modal windows functionality
function initModals() {
    initGameModal();
    initHistoryModal();
}

function initGameModal() {
    const closeModal = document.querySelector('.close-modal');
    const gameModal = document.getElementById('gameModal');

    if (closeModal && gameModal) {
        closeModal.addEventListener('click', () => {
            closeGameModal();
        });

        window.addEventListener('click', function(e) {
            if (e.target === gameModal) {
                closeGameModal();
            }
        });

        window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && gameModal.style.display === 'block') {
                closeGameModal();
            }
        });
    }
}

function closeGameModal() {
    const gameModal = document.getElementById('gameModal');
    const modalGameVideo = document.getElementById('modalGameVideo');
    
    if (gameModal) gameModal.style.display = 'none';
    if (modalGameVideo) modalGameVideo.src = '';
    document.body.style.overflow = 'auto';
}

function initHistoryModal() {
    const closeHistoryModal = document.querySelector('.close-history-modal');
    const historyModal = document.getElementById('historyModal');

    if (closeHistoryModal && historyModal) {
        closeHistoryModal.addEventListener('click', () => {
            closeHistoryModalFunc();
        });

        window.addEventListener('click', function(e) {
            if (e.target === historyModal) {
                closeHistoryModalFunc();
            }
        });

        window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && historyModal.style.display === 'block') {
                closeHistoryModalFunc();
            }
        });
    }
}

function closeHistoryModalFunc() {
    const historyModal = document.getElementById('historyModal');
    if (historyModal) historyModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Hero image easter egg - ТОЛЬКО для главного фото
function initHeroImageEasterEgg() {
    const mainPhotoContainer = document.querySelector('.main-photo-container');
    const mainPhoto = document.querySelector('.main-photo');
    let clickCount = 0;
    const historyModal = document.getElementById('historyModal');

    if (mainPhoto) {
        mainPhoto.addEventListener('click', (e) => {
            e.stopPropagation(); // Останавливаем всплытие
            clickCount++;
            
            // Подсвечиваем ТОЛЬКО главное фото
            mainPhotoContainer.classList.add('clicked');
            
            setTimeout(() => {
                mainPhotoContainer.classList.remove('clicked');
            }, 300);
            
            if (clickCount >= 14 && historyModal) {
                historyModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                clickCount = 0;
                
                // Добавляем анимацию появления модального окна
                setTimeout(() => {
                    historyModal.classList.add('show');
                }, 50);
            }
        });
    }

    // Отдельные обработчики для планет
    const planets = document.querySelectorAll('.planet-img');
    planets.forEach((planet, index) => {
        planet.addEventListener('click', (e) => {
            e.stopPropagation(); // Останавливаем всплытие к главному фото
            
            // Анимация клика на планету
            planet.style.transform = 'scale(1.2)';
            setTimeout(() => {
                planet.style.transform = 'scale(1)';
            }, 300);
            
            // Можно добавить разную логику для каждой планеты
            console.log(`Клик по планете ${index + 1}`);
            
            // Пример: открыть модальное окно для каждой планеты
            // showPlanetModal(index);
        });
    });

    // Обработчик для закрытия модального окна истории при клике вне его
    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                closeHistoryModalFunc();
            }
        });
    }
}

// Card number copy functionality
function initCardCopy() {
    const cardNumberElement = document.getElementById('card-number');
    if (cardNumberElement) {
        cardNumberElement.addEventListener('click', copyCardNumber);
    }
}

function copyCardNumber() {
    const cardNumber = '4276 1805 5058 1960';
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''))
        .then(() => {
            const tooltip = document.getElementById('copy-tooltip');
            if (tooltip) {
                const originalText = tooltip.textContent;
                tooltip.textContent = 'Скопировано!';
                tooltip.style.color = '#39ff14';
                
                setTimeout(() => {
                    tooltip.textContent = originalText;
                    tooltip.style.color = '';
                }, 2000);
            }
            
            // Визуальная обратная связь
            const cardElement = document.getElementById('card-number');
            if (cardElement) {
                cardElement.style.background = 'rgba(57, 255, 20, 0.2)';
                setTimeout(() => {
                    cardElement.style.background = '';
                }, 500);
            }
        })
        .catch(err => {
            console.error('Ошибка при копировании: ', err);
            const tooltip = document.getElementById('copy-tooltip');
            if (tooltip) {
                tooltip.textContent = 'Ошибка копирования';
                tooltip.style.color = '#ff6464';
                setTimeout(() => {
                    tooltip.textContent = 'Нажмите чтобы скопировать';
                    tooltip.style.color = '';
                }, 2000);
            }
        });
}

// Utility function to set tab slider position
export function setTabSliderPosition(tabElement, sliderElement) {
    if (!tabElement || !sliderElement) return;
    const activeTab = tabElement.querySelector('.active');
    if (activeTab) {
        sliderElement.style.width = `${activeTab.offsetWidth}px`;
        sliderElement.style.left = `${activeTab.offsetLeft}px`;
    }
}

// Show modal with item details
export function showModal(item) {
    const modalGameTitle = document.getElementById('modalGameTitle');
    const modalGameRating = document.getElementById('modalGameRating');
    const modalGameDescription = document.getElementById('modalGameDescription');
    const modalGameVideo = document.getElementById('modalGameVideo');
    const gameModal = document.getElementById('gameModal');
    
    if (!modalGameTitle || !modalGameRating || !modalGameDescription || !modalGameVideo || !gameModal) {
        console.error('Modal elements not found');
        return;
    }
    
    modalGameTitle.textContent = item.title;
    modalGameRating.innerHTML = `${generateStars(item.rating)}<span>${item.rating}/5</span>`;
    modalGameDescription.textContent = item.description;
    modalGameVideo.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1&mute=1`;
    gameModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Добавляем анимацию появления
    setTimeout(() => {
        gameModal.classList.add('show');
    }, 50);
}

// Generate stars for rating
export function generateStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// Добавляем CSS для анимации модальных окон
function addModalAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        .modal.show .modal-content {
            animation: modalSlideIn 0.3s ease-out;
        }
        
        .history-modal.show .history-modal-content {
            animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .planet {
            transition: transform 0.3s ease;
        }
        
        .planet-img {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Export for external use
export default {
    initializeApp,
    setTabSliderPosition,
    showModal,
    generateStars
};
