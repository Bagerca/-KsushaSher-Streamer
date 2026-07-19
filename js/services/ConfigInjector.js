/* js/services/ConfigInjector.js */
import { AppConfig } from '../config.js';

export class ConfigInjector {
    static init() {
        this.injectIdentity();
        this.injectAboutVideo();
        this.injectSocials();
        this.injectDonations();
        this.injectFooterInfo();
        this.injectRealBarcode(); // Запускаем генерацию штрихкода
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
        setHref('.twitch-link', links.twitch);
    }

    static injectDonations() {
        const daLink = document.querySelector('a[href*="donationalerts"]');
        const maLink = document.querySelector('a[href*="memealerts"]');
        const subLink = document.querySelector('a[href*="twitch.tv"]');

        if (daLink) daLink.href = AppConfig.donations.donationAlerts;
        if (maLink) maLink.href = AppConfig.donations.memeAlerts;
        if (subLink) subLink.href = AppConfig.socials.twitch;
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

    // НОВЫЙ МЕТОД: Генерация секретного штрихкода
    static async injectRealBarcode() {
        const container = document.querySelector('.footer-barcode-container');
        if (!container) return;

        // Массив секретных фраз (можешь добавлять сюда любые новые)
        const secrets = [
            "01010011 01001111 01010011", // SOS
            "angel",
            "godmode"
        ];
        // Выбираем рандомный код
        const randomSecret = secrets[Math.floor(Math.random() * secrets.length)];

        try {
            // Фоново, не мешая загрузке сайта, подгружаем микро-библиотеку генератора
            if (!window.JsBarcode) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            // Создаем SVG элемент
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.classList.add('barcode-svg');
            container.appendChild(svg);

            // Генерируем реальный считываемый код
            window.JsBarcode(svg, randomSecret, {
                format: "CODE128",
                displayValue: false,  // Скрываем текст под кодом, чтобы его можно было только отсканировать
                background: "transparent",
                lineColor: "#ffffff", // Изначальный цвет линий
                margin: 0,
                width: 2,
                height: 30 // Высота линий (обрежется CSS для красоты)
            });
            
            console.log('🕵️‍♂️ [Secret] Штрих-код сгенерирован.');
        } catch (e) {
            console.warn('⚠️ [Secret] Не удалось загрузить генератор штрих-кода.');
        }
    }
}