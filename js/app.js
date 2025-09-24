// Main application entry point
import { initializeApp } from './modules/ui.js';
import { initializeLoaders } from './modules/loaders.js';
import { initializeFilters } from './modules/filters.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initializeApp();
    initializeLoaders();
    initializeFilters();
    
    console.log('🚀 Ksusha Sher website initialized successfully!');
});

// Make sure all external links open in new tab
document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (!link.href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    }
});
