/* js/components/AgentCard.js */
export class AgentCard {
    // Встроенный маппер ролей в цвета
    static getRoleColor(colorName) {
        const ROLE_COLORS = {
            'green': '#39ff14', 'red': '#ff4444', 'orange': '#ff8c00',
            'blue': '#007bff', 'pink': '#ff2d95', 'cyan': '#00ffff', 'purple': '#bd00ff'
        };
        return ROLE_COLORS[colorName] || colorName || '#39ff14';
    }

    /**
     * РПГ-калькулятор уровня на основе возраста аккаунта (дней с момента регистрации)
     * Формула: Уровень = Корень из количества дней.
     */
    static calculateLevelData(createdAtStr) {
        // Если дата не указана, выдаем базовый 1 уровень (заглушка)
        if (!createdAtStr) return { level: 1, progress: 0, daysActive: 0, currentExp: 0, nextLevelExp: 100, daysLeft: 100 };
        const createdDate = new Date(createdAtStr);
        const now = new Date();
        // Разница во времени в миллисекундах переводится в дни
        const diffTime = Math.abs(now - createdDate);
        const daysActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // Если дата из будущего (ошибка), возвращаем 1 уровень
        if (now < createdDate) return { level: 1, progress: 0, daysActive: 0, currentExp: 0, nextLevelExp: 100, daysLeft: 100 };
        // Считаем уровень (корень из дней)
        const level = Math.floor(Math.sqrt(daysActive)) + 1;
        // Пороги для текущего и следующего уровня в днях
        const currentThreshold = Math.pow(level - 1, 2);
        const nextThreshold = Math.pow(level, 2);
        const daysInCurrentLevel = daysActive - currentThreshold;
        const daysNeededForNextLevel = nextThreshold - currentThreshold;
        const progress = (daysInCurrentLevel / daysNeededForNextLevel) * 100;
        return {
            level,
            progress: Math.max(0, Math.min(100, progress)),
            daysActive,
            currentExp: daysInCurrentLevel,         // Выводим как "ОПЫТ"
            nextLevelExp: daysNeededForNextLevel,   // Максимум "ОПЫТА" на этом уровне
            daysLeft: daysNeededForNextLevel - daysInCurrentLevel // Дней до левелапа
        };
    }

    /** Экранирование значений атрибутов. */
    static escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Вторая иконка агента (бейдж роли / уголок карточки).
     * Теперь это бывшая иконка аватарки — mainIcon.
     */
    static getBadgeIcon(agent) {
        return (agent && agent.mainIcon) || 'fas fa-user';
    }

    /**
     * Аватар: фотография, а при её отсутствии или поломке —
     * простая иконка юзера. Единая логика для всех поверхностей.
     */
    static getAvatarContent(agent) {
        const src = agent && (agent.avatarPath || agent.image);
        const alt = this.escapeAttr((agent && (agent.squadName || agent.name)) || 'Агент');
        if (src) {
            return `<img src="${this.escapeAttr(src)}" alt="${alt}" onerror="this.outerHTML='<i class=\\'fas fa-user\\'></i>'">`;
        }
        return '<i class="fas fa-user"></i>';
    }

    static createHTML(agent) {
        const colorVal = this.getRoleColor(agent.color);
        const avatarContent = this.getAvatarContent(agent);
        const badgeIcon = this.getBadgeIcon(agent);

        // Рендер описания
        const descHtml = agent.description
            ? `<div class="holo-desc">${agent.description}</div>`
            : '';

        // Расчет уровня по дате создания аккаунта
        const { level, progress, daysActive } = this.calculateLevelData(agent.createdAt);

        // Подсказка при наведении
        const progressTitle = agent.createdAt ? `Возраст аккаунта: ${daysActive} дн.` : 'Данные засекречены';

        return `
            <div class="holo-card agent-card-component" data-id="${agent.id}" style="--sub-color: ${colorVal}">
                <div class="card-top-deco">
                    <span title="${progressTitle}">LVL.${level}</span>
                    <i class="${badgeIcon}"></i>
                </div>
                <div class="holo-avatar-container">
                    <div class="holo-avatar">${avatarContent}</div>
                    <div class="avatar-ring"></div>
                </div>
                <div class="holo-info">
                    <div class="holo-name" title="${agent.name}">${agent.squadName || agent.name}</div>
                    <div class="holo-role">${agent.role || 'Агент'}</div>
                </div>
                ${descHtml}
                <div class="card-stat-bar" title="${progressTitle}">
                    <div class="fill" style="width: ${progress}%"></div>
                </div>
                <div class="agent-card-hint">[ПКМ - ДОСЬЕ]</div>
            </div>
        `;
    }
}