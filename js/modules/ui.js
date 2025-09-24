// UI interactions and animations
export function initializeApp() {
    initMobileMenu();
    initSmoothScroll();
    initHeaderScroll();
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

// Header scroll behavior
function initHeaderScroll() {
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;

    if (header) {
        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > headerHeight) {
                document.body.classList.add('scrolled-down');
                document.body.classList.remove('scrolled-up');
            } else {
                document.body.classList.remove('scrolled-down');
                document.body.classList.add('scrolled-up');
            }
            lastScrollTop = scrollTop;
        });
    }
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

// Hero image easter egg
function initHeroImageEasterEgg() {
    const heroImage = document.getElementById('hero-image-click');
    let clickCount = 0;
    const historyModal = document.getElementById('historyModal');

    if (heroImage) {
        heroImage.addEventListener('click', () => {
            clickCount++;
            heroImage.classList.add('clicked');
            
            setTimeout(() => {
                heroImage.classList.remove('clicked');
            }, 300);
            
            if (clickCount >= 14 && historyModal) {
                historyModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                clickCount = 0;
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
                tooltip.textContent = 'Скопировано!';
                setTimeout(() => tooltip.textContent = 'Нажмите чтобы скопировать', 2000);
            }
        })
        .catch(err => console.error('Ошибка при копировании: ', err));
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
    modalGameVideo.src = `https://www.youtube.com/embed/${item.videoId}`;
    gameModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Generate stars for rating
export function generateStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
    if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';
    
    return starsHtml;
}

// Utility function to check if element exists in DOM
export function elementExists(selector) {
    return document.querySelector(selector) !== null;
}

// Utility function to wait for element to appear
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkElement() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            } else {
                setTimeout(checkElement, 100);
            }
        }
        
        checkElement();
    });
}

// Initialize all UI components when DOM is ready
export function initUIWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        setTimeout(initializeApp, 100);
    }
}
