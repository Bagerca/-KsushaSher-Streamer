/* js/ui/crypto-widget.js */
import { AppConfig } from '../config.js';

export class CryptoCardManager {
    constructor() {
        this.els = {
            card: document.getElementById('card-number')
        };
        
        this.chars = "ABCDEFGHJKLNPQRSTUVWXYZ0123456789#$<>[]/\\";
        this.isAnimating = false;
        
        if (this.els.card) this.init();
    }

    init() {
        this.els.digitsContainer = this.els.card.querySelector('.card-digits');
        this.originalHTML = this.els.digitsContainer.innerHTML;
        
        this.els.card.addEventListener('click', () => {
            if (this.isAnimating) return; 
            this.isAnimating = true;
            
            navigator.clipboard.writeText(AppConfig.crypto.cardNumberClean).then(() => {
                this.els.card.classList.add('copied');
                this.els.digitsContainer.classList.add('success-mode');
                
                this.els.digitsContainer.style.whiteSpace = 'nowrap';
                this.els.digitsContainer.style.wordBreak = 'keep-all';
                
                this.runDecryptEffect(AppConfig.crypto.successMessage, () => {
                    setTimeout(() => {
                        this.runDecryptEffect(AppConfig.crypto.cardNumberRaw, () => {
                            this.els.digitsContainer.style.whiteSpace = ''; 
                            this.els.digitsContainer.style.wordBreak = ''; 
                            this.els.digitsContainer.classList.remove('success-mode');
                            this.els.digitsContainer.innerHTML = this.originalHTML; 
                            this.els.card.classList.remove('copied');
                            this.isAnimating = false;
                        });
                    }, 2000);
                });
            });
        });
    }

    runDecryptEffect(targetText, onComplete) {
        const startText = this.els.digitsContainer.innerText;
        const startLen = startText.length;
        const targetLen = targetText.length;
        
        const glitchWidth = 4; 
        const maxIters = Math.max(startLen, targetLen) + glitchWidth;
        let iterations = 0;
        
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            let displayText = "";
            const progress = Math.min(iterations / maxIters, 1);
            const currentLen = Math.floor(startLen + (targetLen - startLen) * progress);
            
            for (let i = 0; i < currentLen; i++) {
                if (i < iterations - glitchWidth) {
                    displayText += targetText[i] !== undefined ? targetText[i] : "";
                } else if (i < iterations) {
                    displayText += this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    displayText += startText[i] !== undefined ? startText[i] : "";
                }
            }
            
            this.els.digitsContainer.textContent = displayText.replace(/ /g, '\u00A0');
            iterations += 0.5; 
            
            if (iterations >= maxIters) { 
                clearInterval(this.intervalId);
                this.els.digitsContainer.textContent = targetText.replace(/ /g, '\u00A0'); 
                if (onComplete) onComplete();
            }
        }, 30); 
    }
}

export function initCryptoWidget() {
    new CryptoCardManager();
    console.log('💳 [UI] Крипто-виджет инициализирован');
}