import { DOM, NumberUtils } from '../utils/helpers.js';
import { ORBITAL_CONFIG } from '../utils/constants.js';

export class OrbitalSystem {
    constructor(containerId) {
        this.container = DOM.getElement(containerId);
        this.satellites = [];
        this.angles = [];
        this.isAnimating = false;
        this.animationId = null;
        this.radius = 0;
        this.center = { x: 0, y: 0 };
    }

    init(satellitesData) {
        if (!this.container) {
            console.error('Orbital container not found:', this.container);
            return;
        }

        if (!satellitesData || satellitesData.length === 0) {
            console.log('No satellites data provided');
            return;
        }

        this.satellites = satellitesData;
        this.angles = new Array(satellitesData.length).fill(0);
        this.calculateOrbit();
        this.render();
        this.startAnimation();

        console.log('🛰️ OrbitalSystem initialized with', satellitesData.length, 'satellites');
    }

    calculateOrbit() {
        const containerRect = this.container.getBoundingClientRect();
        this.center = {
            x: containerRect.width / 2,
            y: containerRect.height / 2
        };
        this.radius = Math.min(this.center.x, this.center.y) - 50;
    }

    render() {
        if (!this.container) return;

        DOM.setHTML(this.container, '');
        
        this.satellites.forEach((satellite, index) => {
            const satelliteEl = this.createSatelliteElement(satellite, index);
            this.container.appendChild(satelliteEl);
        });

        this.updateSatellitesPosition();
    }

    createSatelliteElement(satellite, index) {
        const satelliteEl = DOM.createElement('div', {
            className: 'satellite',
            'data-index': index,
            'data-name': satellite.name
        });

        const iconEl = DOM.createElement('div', {
            className: 'satellite-icon',
            innerHTML: satellite.icon || '⭐'
        });

        const tooltipEl = DOM.createElement('div', {
            className: 'satellite-tooltip',
            textContent: satellite.name
        });

        satelliteEl.appendChild(iconEl);
        satelliteEl.appendChild(tooltipEl);
        
        return satelliteEl;
    }

    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    animate() {
        if (!this.isAnimating) return;

        this.updateSatellitesPosition();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateSatellitesPosition() {
        const satellites = this.container.querySelectorAll('.satellite');
        
        satellites.forEach((satellite, index) => {
            const speed = this.satellites[index]?.speed || ORBITAL_CONFIG.baseSpeed;
            this.angles[index] += speed;
            
            const x = this.center.x + this.radius * Math.cos(this.angles[index]) - 20;
            const y = this.center.y + this.radius * Math.sin(this.angles[index]) - 20;

            satellite.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    addSatellite(satelliteData) {
        this.satellites.push(satelliteData);
        this.angles.push(0);
        this.render();
    }

    removeSatellite(index) {
        if (index >= 0 && index < this.satellites.length) {
            this.satellites.splice(index, 1);
            this.angles.splice(index, 1);
            this.render();
        }
    }

    onResize() {
        this.calculateOrbit();
        this.updateSatellitesPosition();
    }

    destroy() {
        this.stopAnimation();
        if (this.container) {
            DOM.setHTML(this.container, '');
        }
    }
}
