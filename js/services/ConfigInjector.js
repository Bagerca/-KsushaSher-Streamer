/* js/services/ConfigInjector.js */
import { AppConfig } from '../config.js';

export class ConfigInjector {
    static init() {
        this.injectIdentity();
        this.injectAboutVideo();
        this.injectSocials();
        this.injectDonations();
        this.injectFooterInfo();
        this.injectRealBarcode(); 
        console.log('💉 [ConfigInjector] Статические данные успешно внедрены в DOM');
    }

    static injectIdentity() {
        const iden = AppConfig.identity;
        if (document.title !== undefined) document.title = iden.pageTitle;
        document.querySelectorAll('.main-display-avatar').forEach(el => el.src = iden.mainAvatar);
        document.querySelectorAll('.main-photo.tetla').forEach(el => el.src = iden.botAvatar);

        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        safeSetText('inject-main-name', iden.mainName);
        safeSetText('inject-bot-name', iden.botName);
        safeSetText('inject-squad-title', iden.squadTitle);
        safeSetText('inject-footer-brand', iden.mainName);

        const botVersionEl = document.querySelector('.bot-version');
        if (botVersionEl) botVersionEl.textContent = AppConfig.system.osVersion;
    }

    static injectAboutVideo() {
        const iframe = document.querySelector('.video-frame iframe');
        if (iframe) iframe.src = `https://www.youtube.com/embed/${AppConfig.about.trailerVideoId}`;
    }

    static injectSocials() {
        const links = AppConfig.socials;
        
        const setHref = (selector, url) => {
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                if (url && url !== '#') {
                    el.href = url;
                } else {
                    el.href = '#';
                    el.removeAttribute('target'); 
                }
            });
        };

        setHref('.hud-btn.twitch', links.twitch);
        setHref('.hud-btn.youtube', links.youtube);
        setHref('.hud-btn.youtube-alt', links.youtube2); 
        setHref('.hud-btn.telegram', links.telegram);
        setHref('.hud-btn.vk', links.vk); 
        setHref('.hud-btn.discord', links.discord);
        setHref('.hud-btn.tiktok', links.tiktok);
        setHref('.hud-btn.fetta', links.fetta);
        setHref('.hud-btn.steam', links.steam);
        setHref('.twitch-link', links.twitch);
    }

    static injectDonations() {
        // ИСПРАВЛЕНИЕ: Ищем карточки по их заголовкам (тексту в <h3>), а не по ссылкам
        const donateCards = document.querySelectorAll('.donate-card');
        
        donateCards.forEach(card => {
            const titleEl = card.querySelector('h3');
            if (!titleEl) return;
            
            const titleText = titleEl.textContent.toLowerCase();
            
            if (titleText.includes('donationalerts')) {
                card.href = AppConfig.donations.donationAlerts;
            } else if (titleText.includes('memealerts')) {
                card.href = AppConfig.donations.memeAlerts;
            } else if (titleText.includes('twitch')) {
                card.href = AppConfig.socials.twitch; // Сабка ведет на твич канал
            }
        });
    }

    static injectFooterInfo() {
        const devNameEl = document.querySelector('.dev-name');
        const copyEl = document.querySelector('.copyright');
        
        if (devNameEl) {
            devNameEl.textContent = AppConfig.system.developer;
        }
        
        if (copyEl) {
            const startYear = parseInt(AppConfig.system.copyrightYear) || 2025;
            const currentYear = new Date().getFullYear();
            const yearStr = currentYear > startYear ? `${startYear} - ${currentYear}` : `${startYear}`;
            copyEl.textContent = `© ${yearStr}. Все права защищены.`;
        }
    }

    static async injectRealBarcode() {
        const container = document.querySelector('.footer-barcode-container');
        if (!container) return;

        const secrets = [
            "01010011 01001111 01010011", 
            "angel",
            "godmode"
        ];
        const randomSecret = secrets[Math.floor(Math.random() * secrets.length)];

        try {
            if (!window.JsBarcode) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.classList.add('barcode-svg');
            container.appendChild(svg);

            window.JsBarcode(svg, randomSecret, {
                format: "CODE128",
                displayValue: false,  
                background: "transparent",
                lineColor: "#ffffff", 
                margin: 0,
                width: 2,
                height: 30 
            });
            
            console.log('🕵️‍♂️ [Secret] Штрих-код сгенерирован.');
        } catch (e) {
            console.warn('⚠️ [Secret] Не удалось загрузить генератор штрих-кода.');
        }
    }
}