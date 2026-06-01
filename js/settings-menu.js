/* js/settings-menu.js */
import EventBus from './event-bus.js';

export class SettingsMenu {
    constructor() {
        this.init();
    }

    init() {
        // Создаем DOM элементы меню настроек
        this.menuContainer = document.createElement('div');
        this.menuContainer.className = 'magic-menu-container';
        
        this.menuContainer.innerHTML = `
            <div class="magic-toggle" title="Настройки интерфейса"><i class="fas fa-cog"></i></div>
            <ul class="magic-items">
                <li style="--i:0;" title="Убрать существ"><a href="#" id="btn-clear-creatures"><i class="fas fa-skull"></i></a></li>
                <li style="--i:1;" title="Режимы Атмосферы"><a href="#" id="btn-toggle-fx" class="active-state"><i class="fas fa-eye"></i></a></li>
                <li style="--i:2;" title="Режим Плеера"><a href="#" id="btn-toggle-music"><i class="fas fa-headphones"></i></a></li>
                <li style="--i:3;" title="Обновить данные"><a href="#" id="btn-refresh-data"><i class="fas fa-sync-alt"></i></a></li>
                <li style="--i:4;"><a href="#donation"><i class="fas fa-heart"></i></a></li>
                <li style="--i:5;"><a href="#hero"><i class="fas fa-arrow-up"></i></a></li>
            </ul>
        `;
        
        document.body.appendChild(this.menuContainer);
        
        this.toggleBtn = this.menuContainer.querySelector('.magic-toggle');
        this.btnClear = this.menuContainer.querySelector('#btn-clear-creatures');
        this.btnFx = this.menuContainer.querySelector('#btn-toggle-fx');
        this.btnMusic = this.menuContainer.querySelector('#btn-toggle-music');
        this.btnRefresh = this.menuContainer.querySelector('#btn-refresh-data');

        this.setupToggleLogic();
        this.setupButtons();
        
        // ЗАПУСКАЕМ ДИНАМИЧЕСКОЕ УКЛОНЕНИЕ ОТ ФУТЕРА
        this.setupFooterCollision();
        
        console.log('⚙️ [SettingsMenu] Инициализировано и встроено в DOM');
    }

    setupToggleLogic() {
        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.menuContainer.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!this.menuContainer.contains(e.target) && this.menuContainer.classList.contains('active')) {
                this.menuContainer.classList.remove('active');
            }
        });
    }

    setupButtons() {
        this.btnClear.addEventListener('click', (e) => {
            e.preventDefault();
            EventBus.emit('UI_CLICK_CLEAR');
            this.triggerBtnFeedback(this.btnClear, 'var(--neon-pink)');
        });

        this.btnFx.addEventListener('click', (e) => {
            e.preventDefault();
            EventBus.emit('UI_CLICK_FX_CYCLE');
        });

        EventBus.on('STATE_FX_CHANGED', (mode) => {
            this.btnFx.className = ''; 
            if (mode === 0) this.btnFx.classList.add('active-state');
            else if (mode === 3) this.btnFx.classList.add('disabled-state');
        });

        this.btnMusic.addEventListener('click', (e) => {
            e.preventDefault();
            EventBus.emit('UI_CLICK_MUSIC');
        });

        EventBus.on('STATE_MUSIC_CHANGED', (isActive) => {
            if (isActive) this.btnMusic.classList.add('active-state');
            else this.btnMusic.classList.remove('active-state');
        });

        this.btnRefresh.addEventListener('click', (e) => {
            e.preventDefault();
            EventBus.emit('UI_CLICK_REFRESH');
            
            const icon = this.btnRefresh.querySelector('i');
            if (icon) {
                icon.style.transition = 'transform 1s ease';
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transition = 'none';
                    icon.style.transform = 'rotate(0deg)';
                }, 1000);
            }
        });
    }

    triggerBtnFeedback(btnEl, color) {
        btnEl.classList.add('active-state');
        btnEl.style.color = color;
        setTimeout(() => {
            btnEl.classList.remove('active-state');
            btnEl.style.color = '';
        }, 300);
    }

    // НОВЫЙ МЕТОД: Следит за футером
    setupFooterCollision() {
        const footer = document.querySelector('.cyber-footer');
        if (!footer) return;

        // Настраиваем радар (Observer) на футер
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Если футер показался на экране -> поднимаем кнопку
                this.menuContainer.classList.add('above-footer');
            } else {
                // Если ушел -> возвращаем вниз
                this.menuContainer.classList.remove('above-footer');
            }
        }, { threshold: 0.01 });

        observer.observe(footer);
    }
}