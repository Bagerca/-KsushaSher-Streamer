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
            
            console.log('🚀 Ksusha Sher website initialized successfully!');
            
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
}

// Start initialization
init();

// Initialize external links when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initExternalLinks();
});
