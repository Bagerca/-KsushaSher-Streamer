/* js/services/ConfigInjector.js */
import { AppConfig } from '../config.js';

export class ConfigInjector {
    static init() {
        this.injectIdentity();
        this.injectAboutVideo();
        this.injectSocials();
        this.injectDonations();
        this.injectHardware();
        this.injectFooterInfo();
        console.log('💉 [ConfigInjector] Данные успешно внедрены в DOM');
    }

    static injectIdentity() {
        const iden = AppConfig.identity;
        
        if (document.title !== undefined) {
            document.title = iden.pageTitle;
        }

        const mainAvatarEls = document.querySelectorAll('.main-display-avatar');
        const botAvatarEls = document.querySelectorAll('.main-photo.tetla');
        
        mainAvatarEls.forEach(el => el.src = iden.mainAvatar);
        botAvatarEls.forEach(el => el.src = iden.botAvatar);

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
        if (iframe) {
            iframe.src = `https://www.youtube.com/embed/${AppConfig.about.trailerVideoId}`;
        }
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
        
        if (devNameEl) devNameEl.textContent = AppConfig.system.developer;
        if (copyEl) copyEl.innerHTML = `&copy; ${AppConfig.system.copyrightYear}. Все права защищены.`;
    }

    static injectHardware() {
        const grid = document.querySelector('.specs-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const html = AppConfig.hardware.map(hw => `
            <div class="spec-card">
                <div class="card-glass"></div>
                <div class="spec-content">
                    <div class="spec-icon-box"><i class="${hw.icon}"></i></div>
                    <div class="spec-info">
                        <h3 class="spec-label">${hw.label}</h3>
                        <p class="spec-value">${hw.value}</p>
                        <div class="spec-meta">
                            ${hw.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="tech-corner top-right"></div>
                <div class="tech-corner bottom-left"></div>
            </div>
        `).join('');

        grid.innerHTML = html;
    }
}