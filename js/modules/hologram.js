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


export function initHologramInterface() {
    initInteractivity();
    
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initHologramInterface();
});
