import { GamesManager } from '../components/games-manager.js';
import { StatsManager } from '../components/stats.js';
import { OrbitalSystem } from '../components/orbital-system.js';

export class AppInitializer {
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeGames();
            this.initializeStats();
            this.initializeOrbital();
            this.setupGlobalHandlers();
        });
    }

    static initializeGames() {
        const gamesContainer = document.getElementById('games-container');
        if (gamesContainer) {
            window.gamesManager = new GamesManager('#games-container');
            window.gamesManager.init();
        }
    }

    static initializeStats() {
        const statsContainer = document.getElementById('stats-container');
        if (statsContainer) {
            window.statsManager = new StatsManager('#stats-container');
            window.statsManager.init();
        }
    }

    static initializeOrbital() {
        const orbitalContainer = document.getElementById('orbital-container');
        if (orbitalContainer) {
            fetch('/data/satellites.json')
                .then(response => response.json())
                .then(data => {
                    window.orbitalSystem = new OrbitalSystem('#orbital-container');
                    window.orbitalSystem.init(data);
                })
                .catch(error => {
                    console.log('Orbital system data not found, skipping initialization');
                });
        }
    }

    static setupGlobalHandlers() {
        // Глобальные обработчики для пагинации
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-next')) {
                e.preventDefault();
                if (window.gamesManager) {
                    window.gamesManager.nextPage();
                }
            } else if (e.target.classList.contains('pagination-prev')) {
                e.preventDefault();
                if (window.gamesManager) {
                    window.gamesManager.previousPage();
                }
            }
        });
    }
}

// Автоматическая инициализация
AppInitializer.init();
