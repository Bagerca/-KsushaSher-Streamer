/* js/utils/Typewriter.js */

export class Typewriter {
    constructor(element) {
        if (!element) throw new Error('[Typewriter] Не передан DOM-элемент');
        this.el = element;
        this.timeout = null;
        this.isStopped = false;
    }

    /**
     * Одноразовая печать текста (используется для описания отряда)
     */
    type(text, speed = 40, onComplete = null) {
        this.stop(); // Очищаем предыдущие таймеры
        this.isStopped = false;
        this.el.innerHTML = "";
        let i = 0;

        const typeChar = () => {
            if (this.isStopped) return;
            
            if (i < text.length) {
                this.el.innerHTML += text.charAt(i);
                i++;
                this.timeout = setTimeout(typeChar, speed);
            } else {
                this.el.innerHTML = this.el.innerHTML.replace('|', ''); 
                if (onComplete) onComplete();
            }
        };
        typeChar();
    }

    /**
     * Бесконечный цикл строк (используется для бегущей строки статистики)
     */
    loop(getMessagesFn, typeSpeed = 80, deleteSpeed = 30, pause = 2000) {
        this.stop();
        this.isStopped = false;
        
        let messageIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const tick = () => {
            if (this.isStopped) return;

            // Получаем актуальный массив сообщений через функцию (чтобы реагировать на обновления Twitch)
            const messages = getMessagesFn();
            if (!messages || messages.length === 0) return;

            // Защита от выхода за пределы массива при его изменении на лету
            messageIndex = messageIndex % messages.length;
            const fullMessage = messages[messageIndex];

            // Формируем текущую строку
            let currentText = isDeleting 
                ? fullMessage.substring(0, charIndex--) 
                : fullMessage.substring(0, charIndex++);

            this.el.textContent = currentText + '|';

            let currentSpeed = isDeleting ? deleteSpeed : typeSpeed;

            // Логика смены состояний
            if (!isDeleting && charIndex === fullMessage.length + 1) {
                isDeleting = true;
                currentSpeed = pause; // Пауза перед стиранием
            } else if (isDeleting && charIndex === -1) {
                isDeleting = false;
                messageIndex = (messageIndex + 1) % messages.length;
            }

            this.timeout = setTimeout(tick, currentSpeed);
        };

        tick();
    }

    stop() {
        this.isStopped = true;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}