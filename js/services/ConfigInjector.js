/* js/services/ConfigInjector.js */
import { AppConfig } from '../config.js';

export class ConfigInjector {
    static init() {
        this.injectIdentity();
        this.injectAboutVideo();
        this.injectSocials();
        this.injectDonations();
        this.injectFooterInfo();
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
            const el = document.querySelector(selector);
            if (el) el.href = url;
        };

        setHref('.hud-btn.twitch', links.twitch);
        setHref('.hud-btn.youtube', links.youtube);
        setHref('.hud-btn.telegram', links.telegram);
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
            // Используем textContent и символ © вместо innerHTML и &copy;
            // для 100% защиты от XSS инъекций через конфигурацию.
            copyEl.textContent = `© ${AppConfig.system.copyrightYear}. Все права защищены.`;
        }
    }
}