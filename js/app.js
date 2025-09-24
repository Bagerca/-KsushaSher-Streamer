// Main application entry point
import { initializeApp } from './modules/ui.js';
import { initializeLoaders } from './modules/loaders.js';
import { initializeFilters } from './modules/filters.js';

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
        initializeApp();
        initializeLoaders();
        initializeFilters();
        
        console.log('🚀 Ksusha Sher website initialized successfully!');
    }, 100);
}

// Start initialization
init();

// Make sure all external links open in new tab
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
});
