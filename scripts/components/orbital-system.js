import { DOM } from '../utils/helpers.js';

export class OrbitalSystem {
    constructor(containerId) {
        this.container = DOM.getElement(containerId);
        this.satellites = [];
        this.angles = [];
        this.isAnimating = false;
        this.animationId = null;
    }

    init(satellitesData) {
        if (!this.container || !satellitesData) return;

        this.satellites = satellitesData;
        this.angles = new Array(satellitesData.length).fill(0);
        this.render();
        this.startAnimation();
    }

    render() {
        this.container.innerHTML = '';
        
        this.satellites.forEach((satellite, index) => {
            const satelliteEl = this.createSatelliteElement(satellite, index);
            this.container.appendChild(satelliteEl);
        });
    }

    createSatelliteElement(satellite, index) {
        const satelliteEl = DOM.createElement('div', {
            className: 'satellite',
            'data-index': index
        });

        const iconEl = DOM.createElement('div', {
            className: 'satellite-icon',
            innerHTML: satellite.icon
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
        const centerX = this.container.offsetWidth / 2;
        const centerY = this.container.offsetHeight / 2;
        const radius = Math.min(centerX, centerY) - 30;

        satellites.forEach((satellite, index) => {
            const speed = this.satellites[index]?.speed || 0.002;
            this.angles[index] += speed;
            
            const x = centerX + radius * Math.cos(this.angles[index]) - 15;
            const y = centerY + radius * Math.sin(this.angles[index]) - 15;

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

    destroy() {
        this.stopAnimation();
        this.container.innerHTML = '';
    }
}
