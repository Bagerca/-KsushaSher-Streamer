/* js/squad-controller.js */
import { loadData } from './api.js';
import EventBus from './event-bus.js';
import { Typewriter } from './utils/Typewriter.js';
import { AppConfig } from './config.js';

export class SquadController {
    constructor() {
        this.squadPanel = document.getElementById('squad-panel');
        if (!this.squadPanel) return;

        this.els = {
            listContainer: this.squadPanel.querySelector('.squad-list'),
            closeDetailBtn: this.squadPanel.querySelector('.close-detail-btn'),
            detailView: this.squadPanel.querySelector('.squad-detail-view'),
            detailName: this.squadPanel.querySelector('.detail-name'),
            detailDescription: this.squadPanel.querySelector('.detail-description')
        };
        
        this.detailAvatarContainer = this.setupAvatarContainer();
        this.typewriter = new Typewriter(this.els.detailDescription);
        
        this.squadData = {};
        
        // Наблюдатель: если меняется размер окна (или сетка перестраивается), перерисовываем линии
        this.resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => this.drawConnections());
        });

        this.init();
    }

    async init() {
        try {
            const allSubs = await loadData('subscribers.json', []);
            const targetIds = AppConfig.identity.squadMembers || [];

            const squadMembers = targetIds
                .map(id => allSubs.find(sub => sub.id === id))
                .filter(Boolean); 

            squadMembers.forEach(member => {
                this.squadData[member.id] = member;
            });

            this.renderSquadList(squadMembers);
            this.bindEvents();
            
            if (this.els.listContainer) {
                this.resizeObserver.observe(this.els.listContainer);
            }
            
        } catch (e) {
            console.error('❌ [SquadController] Ошибка рендера отряда', e);
        }
    }

    renderSquadList(members) {
        if (!this.els.listContainer) return;
        
        let html = members.map(m => {
            const safeColor = m.color || '#00ffff';
            
            const avatarContent = m.avatarPath 
                ? `<img src="${m.avatarPath}" alt="${m.name}" onerror="this.outerHTML='<i class=\\'${m.mainIcon || 'fas fa-user'}\\'></i>'">` 
                : `<i class="${m.mainIcon || 'fas fa-user'}"></i>`;

            const displayName = m.squadName || m.name;

            return `
                <div class="squad-member" data-member="${m.id}" style="--m-color: ${safeColor};">
                    <div class="avatar-wrapper">
                        <div class="squad-avatar">
                            ${avatarContent}
                        </div>
                        <div class="role-badge"><i class="${m.typeIcon || 'fas fa-star'}"></i></div>
                    </div>
                    <span class="squad-name" title="${displayName}">${displayName}</span>
                </div>
            `;
        }).join('');

        // Вставляем SVG для нейро-линий позади аватарок
        html = `<svg class="squad-connections"><polyline/></svg>` + html;
        this.els.listContainer.innerHTML = html;

        // Ждем пока браузер отрендерит HTML, затем рисуем линии
        setTimeout(() => this.drawConnections(), 100);
    }

    // АЛГОРИТМ "НЕЙРО-ЦЕПЬ" (ЗМЕЙКА)
    drawConnections() {
        if (!this.els.listContainer) return;
        
        const avatars = Array.from(this.els.listContainer.querySelectorAll('.squad-avatar'));
        const svg = this.els.listContainer.querySelector('.squad-connections');
        const polyline = svg?.querySelector('polyline');
        
        if (!svg || !polyline || avatars.length < 2) return;

        const listRect = this.els.listContainer.getBoundingClientRect();
        
        // 1. Собираем центры всех аватарок
        let nodes = avatars.map(av => {
            const rect = av.getBoundingClientRect();
            return {
                x: rect.left - listRect.left + rect.width / 2,
                y: rect.top - listRect.top + rect.height / 2
            };
        });

        // 2. Группируем их по рядам (с погрешностью 20px)
        let rows = [];
        nodes.forEach(node => {
            let row = rows.find(r => Math.abs(r[0].y - node.y) < 20);
            if (row) row.push(node);
            else rows.push([node]);
        });

        // Сортируем ряды сверху вниз
        rows.sort((a, b) => a[0].y - b[0].y);

        // 3. Змейка: четные ряды соединяем слева направо, нечетные — справа налево
        let orderedNodes = [];
        rows.forEach((row, index) => {
            if (index % 2 === 0) {
                row.sort((a, b) => a.x - b.x); // Слева направо
            } else {
                row.sort((a, b) => b.x - a.x); // Справа налево
            }
            orderedNodes.push(...row);
        });

        // 4. Формируем координаты для отрисовки линии
        let points = orderedNodes.map(n => `${n.x},${n.y}`);
        
        // Замыкаем цепь (от последнего человека к первому)
        if (points.length > 2) points.push(points[0]);

        polyline.setAttribute('points', points.join(' '));
    }

    setupAvatarContainer() {
        if (!this.els.detailView) return null;
        let container = this.els.detailView.querySelector('.detail-avatar-container');
        
        if (!container) {
            const oldImg = this.els.detailView.querySelector('.detail-avatar');
            if (oldImg) {
                container = document.createElement('div');
                container.className = 'detail-avatar-container';
                oldImg.parentNode.insertBefore(container, oldImg);
                oldImg.remove();
            }
        }
        return container;
    }

    bindEvents() {
        if (!this.els.listContainer) return;

        this.els.listContainer.addEventListener('click', (e) => {
            const memberEl = e.target.closest('.squad-member');
            if (memberEl) {
                EventBus.emit('PLAY_SOUND', 'click');
                const data = this.squadData[memberEl.dataset.member];
                if (data) this.openDetail(data);
            }
        });

        if (this.els.closeDetailBtn) {
            this.els.closeDetailBtn.addEventListener('click', () => {
                EventBus.emit('PLAY_SOUND', 'click');
                this.closeDetail();
            });
        }
    }

    openDetail(data) {
        if (!this.detailAvatarContainer) return;

        const safeColor = data.color || '#00ffff';
        const displayName = data.squadName || data.name;

        this.detailAvatarContainer.style.borderColor = safeColor;
        this.detailAvatarContainer.style.boxShadow = `0 0 15px ${safeColor}`;
        this.detailAvatarContainer.style.color = safeColor;

        this.detailAvatarContainer.innerHTML = data.avatarPath 
            ? `<img src="${data.avatarPath}" alt="${data.name}" onerror="this.outerHTML='<i class=\\'${data.mainIcon || 'fas fa-user'}\\' style=\\'text-shadow: 0 0 10px ${safeColor}\\'></i>'">`
            : `<i class="${data.mainIcon || 'fas fa-user'}" style="text-shadow: 0 0 10px ${safeColor}"></i>`;

        if (this.els.detailName) {
            this.els.detailName.textContent = displayName;
            this.els.detailName.style.color = safeColor;
        }

        const desc = data.description || "Информация об агенте засекречена.";
        this.typewriter.type(desc);
        
        this.squadPanel.classList.add('expanded');
    }

    closeDetail() {
        this.squadPanel.classList.remove('expanded');
        this.typewriter.stop(); 
    }
}