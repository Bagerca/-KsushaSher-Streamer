/* js/matrix-engine.js */

let canvas = null;
let ctx = null;
let curtain = null;
let matrixInterval = null;
let drops = [];
let isGodMode = false; // Храним состояние режима

// --- ПАСХАЛКИ ---
const secretWords = [
    "KSUSHA", "SHER", "TETLA", "BAGERCA", "ANGEL", "KIRIKI", 
    "FOLLOW", "SUBSCRIBE", "DONATE", "LOVE", "MATRIX", "SYSTEM",
    "STREAM", "LIVE", "TWITCH", "ERROR", "GLITCH"
];

// Хранилище активных слов: { columnIndex: { word: "KSUSHA", charIndex: 0, color: "#FFF" } }
const activeEasterEggs = {}; 

// Символы: Катакана + Латиница + Цифры
const chars = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function initMatrixRain() {
    if (canvas) return;

    // 1. CANVAS (Матрица - самый глубокий слой)
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');

    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '-10',
        pointerEvents: 'none',
        opacity: '0.15'
    });
    
    document.body.appendChild(canvas);

    // 2. CURTAIN (Шторка - фон сайта)
    curtain = document.createElement('div');
    curtain.id = 'matrix-curtain';
    Object.assign(curtain.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#050508',
        zIndex: '-5',
        pointerEvents: 'none',
        transition: 'opacity 2s ease-in-out',
        opacity: '1'
    });
    
    document.body.appendChild(curtain);

    resizeMatrix();
    window.addEventListener('resize', resizeMatrix);

    startMatrixLoop();
    console.log('🤖 MATRIX BACKGROUND: ACTIVE (EGG MODE)');
}

function resizeMatrix() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    
    // Сброс позиций
    drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }
}

function startMatrixLoop() {
    if (matrixInterval) clearInterval(matrixInterval);

    matrixInterval = setInterval(() => {
        if (!ctx || !canvas) return;

        // Рисуем полупрозрачный след
        ctx.fillStyle = 'rgba(5, 5, 8, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '14px monospace';

        for (let i = 0; i < drops.length; i++) {
            let text = "";
            
            // --- ЛОГИКА ПАСХАЛОК ---
            if (activeEasterEggs[i]) {
                // Если слово уже падает
                const egg = activeEasterEggs[i];
                text = egg.word[egg.charIndex]; 
                ctx.fillStyle = egg.color; 
                
                activeEasterEggs[i].charIndex++;
                
                if (activeEasterEggs[i].charIndex >= egg.word.length) {
                    delete activeEasterEggs[i];
                }
            } 
            else if (Math.random() > 0.999) {
                // Шанс начать новое слово
                const randomWord = secretWords[Math.floor(Math.random() * secretWords.length)];
                const colors = ['#ff2d95', '#ffffff', '#ffd700']; 
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                activeEasterEggs[i] = {
                    word: randomWord,
                    charIndex: 0,
                    color: randomColor
                };
                
                text = randomWord[0];
                ctx.fillStyle = randomColor;
                activeEasterEggs[i].charIndex++;
            }
            else {
                // Обычный символ
                text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillStyle = '#0F0'; 
            }

            ctx.fillText(text, i * 16, drops[i] * 16);

            // Сброс капли наверх
            if (drops[i] * 16 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
                if (activeEasterEggs[i]) delete activeEasterEggs[i];
            }
            
            drops[i]++;
        }
    }, 33);
}

export function stopMatrix() {
    if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
    }
    if (canvas) {
        canvas.remove();
        canvas = null;
    }
    if (curtain) {
        curtain.remove();
        curtain = null;
    }
    window.removeEventListener('resize', resizeMatrix);
}

// --- УПРАВЛЕНИЕ РЕЖИМОМ GOD MODE ---

export function toggleGodMode() {
    if (!curtain) return false;
    
    isGodMode = !isGodMode; // Переключаем флаг
    
    // Если God Mode включен -> шторка прозрачная (видим матрицу)
    // Если выключен -> шторка черная (видим сайт)
    curtain.style.opacity = isGodMode ? '0' : '1';
    
    return isGodMode;
}

// Экспорт состояния для проверки в других файлах (например, в терминале)
export function isGodModeActive() {
    return isGodMode;
}