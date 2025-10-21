// Голографический интерфейс - отдельный JS файл

// Данные о подписчиках
const subscribersData = {
    alexey: {
        name: "Алексей",
        role: "Главный модератор",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        description: "Помогает поддерживать порядок в чате с самого первого дня. Всегда справедлив и внимателен к комьюнити. Организует ивенты и конкурсы.",
        stats: {
            months: "24+",
            messages: "8.7K",
            streams: "156"
        }
    },
    maria: {
        name: "Мария", 
        role: "Легенда комьюнити",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        description: "С нами с первых трансляций. Всегда поддерживает теплую атмосферу и помогает новичкам освоиться. Настоящая душа нашего сообщества.",
        stats: {
            months: "32+",
            messages: "12.4K", 
            streams: "210"
        }
    },
    dmitry: {
        name: "Дмитрий",
        role: "Технический специалист",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        description: "Помогал с настройкой оборудования и делился профессиональными советами по стримингу. Всегда готов помочь с техническими вопросами.",
        stats: {
            months: "18+",
            messages: "3.2K",
            streams: "89"
        }
    },
    olga: {
        name: "Ольга",
        role: "Талантливый художник", 
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        description: "Создала уникальный стиль для канала и продолжает радовать нас потрясающими работами. Её арты стали визитной карточкой сообщества.",
        stats: {
            months: "14+",
            messages: "2.1K",
            streams: "67"
        }
    },
    ivan: {
        name: "Иван",
        role: "Активный саппорт",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        description: "Постоянно поддерживает канал и помогает развиваться. Его донаты и конструктивные предложения помогают делать контент лучше.",
        stats: {
            months: "21+",
            messages: "5.6K",
            streams: "134"
        }
    },
    sergey: {
        name: "Сергей",
        role: "Ветеран сообщества",
        avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        description: "Присоединился одним из первых и с тех пор не пропустил почти ни одного стрима. Его опыт и мудрость помогают сообществу расти.",
        stats: {
            months: "36+",
            messages: "15.8K",
            streams: "245"
        }
    }
};

// Создание улучшенных частиц по краям экрана
function createEdgeParticles() {
    const particleCount = 40;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Случайный размер
        const size = 2 + Math.random() * 6;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Случайный цвет
        const colors = ['#39ff14', '#ff2d95', '#ffffff', '#ffd700', '#64b5f6'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        
        // Случайная позиция по краям
        const side = Math.floor(Math.random() * 4);
        let left, top;
        
        switch(side) {
            case 0: // верх
                left = Math.random() * 100;
                top = 0;
                break;
            case 1: // право
                left = 100;
                top = Math.random() * 100;
                break;
            case 2: // низ
                left = Math.random() * 100;
                top = 100;
                break;
            case 3: // лево
                left = 0;
                top = Math.random() * 100;
                break;
        }
        
        particle.style.left = `${left}vw`;
        particle.style.top = `${top}vh`;
        
        // Выбор типа анимации
        if (Math.random() > 0.5) {
            particle.classList.add('particle-orbital');
            // Случайные параметры орбиты
            const duration = 15 + Math.random() * 25;
            const delay = Math.random() * 5;
            particle.style.animation = `orbitalParticle ${duration}s linear ${delay}s infinite`;
            addOrbitalKeyframes(particle, left, top, duration);
        } else {
            particle.classList.add('particle-floating');
            // Плавающая анимация
            const duration = 10 + Math.random() * 20;
            const delay = Math.random() * 3;
            particle.style.animation = `floatingParticle ${duration}s ease-in-out ${delay}s infinite`;
            addFloatingKeyframes(particle, left, top, duration);
        }
        
        document.body.appendChild(particle);
    }
}

// Добавление keyframes для орбитальных частиц
function addOrbitalKeyframes(particle, startLeft, startTop, duration) {
    const style = document.createElement('style');
    const animationName = `orbitalParticle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Создаем эллиптическую орбиту вокруг центра экрана
    const radiusX = 30 + Math.random() * 20;
    const radiusY = 20 + Math.random() * 15;
    
    style.textContent = `
        @keyframes ${animationName} {
            0% {
                transform: translate(0, 0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            25% {
                transform: translate(${radiusX}vw, ${-radiusY}vh);
            }
            50% {
                transform: translate(0, ${-radiusY * 2}vh);
                opacity: 0.8;
            }
            75% {
                transform: translate(${-radiusX}vw, ${-radiusY}vh);
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translate(0, 0);
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
    particle.style.animationName = animationName;
}

// Добавление keyframes для плавающих частиц
function addFloatingKeyframes(particle, startLeft, startTop, duration) {
    const style = document.createElement('style');
    const animationName = `floatingParticle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Случайные точки для плавающего движения
    const points = [];
    const pointCount = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < pointCount; i++) {
        points.push({
            x: Math.random() * 100,
            y: Math.random() * 100
        });
    }
    
    let keyframes = `@keyframes ${animationName} {`;
    const step = 100 / (points.length - 1);
    
    points.forEach((point, index) => {
        const percentage = index * step;
        keyframes += `
            ${percentage}% {
                left: ${point.x}vw;
                top: ${point.y}vh;
                opacity: ${index === 0 || index === points.length - 1 ? 0 : 0.7};
            }
        `;
    });
    
    keyframes += `}`;
    
    style.textContent = keyframes;
    document.head.appendChild(style);
    particle.style.animationName = animationName;
}

// Показ информации о подписчике
function showSubscriberInfo(userId) {
    const userData = subscribersData[userId];
    if (!userData) return;
    
    const infoPanel = document.getElementById('subscriberInfo');
    document.getElementById('subscriberName').textContent = userData.name;
    document.getElementById('subscriberRole').textContent = userData.role;
    document.getElementById('subscriberAvatar').src = userData.avatar;
    document.getElementById('subscriberDetails').textContent = userData.description;
    document.getElementById('statMonths').textContent = userData.stats.months;
    document.getElementById('statMessages').textContent = userData.stats.messages;
    document.getElementById('statStreams').textContent = userData.stats.streams;
    
    infoPanel.classList.add('show');
}

function hideSubscriberInfo() {
    const infoPanel = document.getElementById('subscriberInfo');
    infoPanel.classList.remove('show');
}

// Инициализация интерактивности
function initInteractivity() {
    const nodes = document.querySelectorAll('.data-node');
    
    nodes.forEach(node => {
        const userId = node.getAttribute('data-user');
        
        node.addEventListener('mouseenter', function() {
            showSubscriberInfo(userId);
        });
        
        node.addEventListener('mouseleave', function() {
            hideSubscriberInfo();
        });
    });
}

// Инициализация голографического интерфейса
export function initHologramInterface() {
    createEdgeParticles();
    initInteractivity();
    
    // Обновляем частицы каждые 15 секунд
    setInterval(() => {
        document.querySelectorAll('.particle').forEach(particle => {
            particle.remove();
        });
        createEdgeParticles();
    }, 15000);
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initHologramInterface();
});
