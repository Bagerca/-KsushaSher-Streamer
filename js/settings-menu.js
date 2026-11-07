/* js/settings-menu.js */
import EventBus from './event-bus.js';
import { AppStore } from './store.js';

export class SettingsMenu {
    constructor() {
        this.init();
    }

    init() {
        this.menuContainer = document.createElement('div');
        this.menuContainer.className = 'magic-menu-container';
        
        this.menuContainer.innerHTML = `
            <div class="magic-toggle" title="Меню"><i class="fas fa-cog"></i></div>
            <ul class="magic-items">
                <li style="--i:0;" title="Наверх"><a href="#hero"><i class="fas fa-arrow-up"></i></a></li>
                <li style="--i:1;" title="Убрать существ"><a href="#" id="btn-clear-creatures"><i class="fas fa-skull"></i></a></li>
                <li style="--i:2;" title="Режим Плеера"><a href="#" id="btn-toggle-music"><i class="fas fa-headphones"></i></a></li>
                <li style="--i:3;" title="YouTube Архив"><a href="#/youtube" id="btn-yt-lib" style="color: #ff0000; border-color: rgba(255,0,0,0.3);"><i class="fab fa-youtube"></i></a></li>
                <li style="--i:4;" title="База Агентов"><a href="#/agents/ksusha"><i class="fas fa-users"></i></a></li>
                <li style="--i:5;" title="Поддержать"><a href="#donation"><i class="fas fa-heart"></i></a></li>
            </ul>
        `;
        
        document.body.appendChild(this.menuContainer);
        
        this.toggleBtn = this.menuContainer.querySelector('.magic-toggle');
        this.btnClear = this.menuContainer.querySelector('#btn-clear-creatures');
        this.btnMusic = this.menuContainer.querySelector('#btn-toggle-music');

        this.setupToggleLogic();
        this.setupButtons();
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

        this.btnMusic.addEventListener('click', (e) => {
            e.preventDefault();
            AppStore.dispatch({ type: 'AUDIO_TOGGLE_MODE' });
        });

        AppStore.subscribe((state, prevState) => {
            if (state.audio.isMusicModeActive !== prevState?.audio?.isMusicModeActive) {
                if (state.audio.isMusicModeActive) this.btnMusic.classList.add('active-state');
                else this.btnMusic.classList.remove('active-state');
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

    setupFooterCollision() {
        const footer = document.querySelector('.cyber-footer');
        if (!footer) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.menuContainer.classList.add('above-footer');
            } else {
                this.menuContainer.classList.remove('above-footer');
            }
        }, { threshold: 0.01 });

        observer.observe(footer);
    }
}