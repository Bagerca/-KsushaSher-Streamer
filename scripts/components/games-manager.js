// Управление играми
const GamesManager = {
    currentGames: [],
    currentFilter: 'all',

    // Отображение игр
    render(games, filter = 'all') {
        const container = document.getElementById('games-grid');
        if (!container) return;

        this.currentFilter = filter;
        const filteredGames = filter === 'all' ? games : games.filter(game => game.status === filter);

        if (filteredGames.length === 0) {
            container.innerHTML = '<div class="game-card"><div class="game-info"><div class="game-title">Игры не найдены</div></div></div>';
            return;
        }

        container.innerHTML = filteredGames.map(game => `
            <div class="game-card">
                <img src="${game.image}" alt="${game.title}" class="game-image" loading="lazy">
                <div class="game-info">
                    <h3 class="game-title">${game.title}</h3>
                    <span class="game-status status-${game.status}">${Helpers.getStatusText(game.status)}</span>
                    <p class="game-description">${game.description}</p>
                </div>
            </div>
        `).join('');
    },

    // Настройка фильтров
    initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.render(this.currentGames, btn.dataset.filter);
            });
        });
    },

    // Обновление списка игр
    async update() {
        UI.setLoading(true);
        try {
            const games = await Loader.loadGames();
            this.currentGames = games;
            this.render(games);
            this.initFilters();
        } catch (error) {
            console.error('Ошибка загрузки игр:', error);
            UI.showNotification('Ошибка загрузки игр', 'error');
        } finally {
            UI.setLoading(false);
        }
    }
};
