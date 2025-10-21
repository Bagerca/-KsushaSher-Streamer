// Main application entry point
import { initializeApp } from './ui.js';
import { initializeLoaders } from './loaders.js';
import { initializeFilters } from './filters.js';
import { initHologramInterface } from './hologram.js';

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
            
            // Monitor performance
            monitorPerformance();
            
        } catch (error) {
            console.error('❌ Error during application initialization:', error);
            
            // Fallback: try to initialize critical components individually
            try {
                initializeApp();
            } catch (e) {
                console.error('❌ UI initialization failed:', e);
            }
            
            try {
                initializeLoaders();
            } catch (e) {
                console.error('❌ Loaders initialization failed:', e);
            }
        }
    }, 100);
}

// Performance monitoring
function monitorPerformance() {
    if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            console.log('🚀 Page load performance:', {
                'DOM Content Loaded': `${navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart}ms`,
                'Full Load': `${navigationTiming.loadEventEnd - navigationTiming.navigationStart}ms`
            });
        }
    }
}

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('💥 Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('💥 Unhandled promise rejection:', e.reason);
});

// Make sure all external links open in new tab
function initExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// Initialize service worker for caching (optional)
async function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('🔧 ServiceWorker registered:', registration);
        } catch (error) {
            console.log('🔧 ServiceWorker registration failed:', error);
        }
    }
}

// Start initialization
init();

// Initialize external links when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initExternalLinks();
    
    // Optional: Initialize service worker
    // initServiceWorker();
});

// Export for potential external usage
export default {
    initializeApplication,
    monitorPerformance
};

// Debug function to check module status
export function debugModules() {
    const modules = {
        'UI Module': typeof initializeApp,
        'Loaders Module': typeof initializeLoaders, 
        'Filters Module': typeof initializeFilters,
        'Hologram Module': typeof initHologramInterface
    };
    
    console.log('🔍 Module Status:', modules);
    
    // Check if critical elements exist
    const criticalElements = {
        'Header': document.querySelector('header'),
        'Hero Section': document.querySelector('.hero-section'),
        'Hologram Container': document.querySelector('.hologram-container'),
        'Games Section': document.getElementById('games'),
        'Stats Section': document.getElementById('stats')
    };
    
    console.log('🔍 Critical Elements:', criticalElements);
}

// Utility function to reload specific modules
export async function reloadModule(moduleName) {
    try {
        switch(moduleName) {
            case 'hologram':
                // Remove all particles and reinitialize
                document.querySelectorAll('.particle').forEach(particle => particle.remove());
                initHologramInterface();
                console.log('🔄 Hologram module reloaded');
                break;
            case 'games':
                const { loadGames } = await import('./loaders.js');
                await loadGames();
                console.log('🔄 Games module reloaded');
                break;
            case 'movies':
                const { loadMovies } = await import('./loaders.js');
                await loadMovies();
                console.log('🔄 Movies module reloaded');
                break;
            case 'stats':
                const { loadStats } = await import('./loaders.js');
                await loadStats();
                console.log('🔄 Stats module reloaded');
                break;
            default:
                console.warn('❓ Unknown module:', moduleName);
        }
    } catch (error) {
        console.error('❌ Error reloading module:', error);
    }
}

// Global refresh function
export function refreshAllData() {
    console.log('🔄 Refreshing all data...');
    
    const modulesToRefresh = ['hologram', 'games', 'movies', 'stats'];
    modulesToRefresh.forEach(module => {
        setTimeout(() => reloadModule(module), Math.random() * 1000);
    });
}

// Make refresh function available globally for debugging
window.refreshWebsiteData = refreshAllData;
window.debugWebsite = debugModules;

// Auto-refresh data every 5 minutes (optional)
// setInterval(refreshAllData, 300000);
