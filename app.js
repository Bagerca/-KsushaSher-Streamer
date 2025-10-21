// Main application entry point
import { initializeApp } from './js/modules/ui.js';
import { initializeLoaders } from './js/modules/loaders.js';
import { initializeFilters } from './js/modules/filters.js';
import { initHologramInterface } from './js/modules/hologram.js';

// Wait for complete page load
function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeApplication();
        });
    } else {
        // Page already loaded, initialize immediately
        initializeApplication();
    }
}

function initializeApplication() {
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
        try {
            console.log('🚀 Starting Ksusha Sher website initialization...');
            
            // Initialize all modules
            initializeApp();
            initializeLoaders();
            initializeFilters();
            
            // Initialize hologram interface if elements exist
            const hologramContainer = document.querySelector('.hologram-container');
            if (hologramContainer) {
                initHologramInterface();
                console.log('🌌 Hologram interface initialized');
            }
            
            // Initialize external links
            initExternalLinks();
            
            // Initialize card number copy functionality
            initCardNumberCopy();
            
            console.log('✅ Ksusha Sher website initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error during application initialization:', error);
        }
    }, 100);
}

// Make sure all external links open in new tab
function initExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
    console.log('🔗 External links initialized');
}

// Initialize card number copy functionality
function initCardNumberCopy() {
    const cardNumber = document.getElementById('card-number');
    if (cardNumber) {
        cardNumber.addEventListener('click', function() {
            const text = this.textContent.replace('Нажмите чтобы скопировать', '').trim();
            
            // Use modern clipboard API
            navigator.clipboard.writeText(text).then(() => {
                const tooltip = this.querySelector('#copy-tooltip') || this;
                const originalText = tooltip.textContent;
                tooltip.textContent = '✅ Скопировано!';
                
                setTimeout(() => {
                    tooltip.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('❌ Failed to copy text: ', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                const tooltip = this.querySelector('#copy-tooltip') || this;
                const originalText = tooltip.textContent;
                tooltip.textContent = '✅ Скопировано!';
                
                setTimeout(() => {
                    tooltip.textContent = originalText;
                }, 2000);
            });
        });
    }
}

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('🚨 Global error caught:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled promise rejection:', e.reason);
});

// Performance monitoring
function monitorPerformance() {
    if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            console.log('📊 Page load performance:', {
                'DOM Content Loaded': `${navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart}ms`,
                'Full Load': `${navigationTiming.loadEventEnd - navigationTiming.navigationStart}ms`
            });
        }
    }
}

// Initialize when the script loads
console.log('📦 App.js loaded, initializing application...');
init();

// Monitor performance when page fully loads
window.addEventListener('load', monitorPerformance);

// Export for potential debugging
export function debugApp() {
    console.log('🐛 Debug mode activated');
    console.log('Current state:', {
        gamesLoaded: window.gamesLoaded,
        moviesLoaded: window.moviesLoaded,
        currentTab: window.currentTab
    });
    
    // Try to reload data
    if (window.initializeLoaders) {
        console.log('🔄 Reloading data...');
        window.initializeLoaders();
    }
}

// Make debug function globally available for console debugging
window.debugApp = debugApp;
