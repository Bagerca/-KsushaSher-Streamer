import { GamesManager } from '../components/games-manager.js';
import { StatsManager } from '../components/stats.js';
import { OrbitalSystem } from '../components/orbital-system.js';

export class AppInitializer {
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeGames();
            this.initializeStats();
            this.initializeOrbital();
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
            // Загружаем данные для орбитальной системы
            fetch('/data/satellites.json')
                .then(response => response.json())
                .then(data => {
                    window.orbitalSystem = new OrbitalSystem('#orbital-container');
                    window.orbitalSystem.init(data);
                });
        }
    }

    // Методы для пагинации (вместо inline onclick)
    static nextPage() {
        if (window.gamesManager) {
            window.gamesManager.nextPage();
        }
    }

    static previousPage() {
        if (window.gamesManager) {
            window.gamesManager.previousPage();
        }
    }
}

// Делаем методы глобально доступными для HTML
window.AppInitializer = AppInitializer;
