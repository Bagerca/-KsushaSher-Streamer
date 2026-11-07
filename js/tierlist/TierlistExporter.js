/* js/tierlist/TierlistExporter.js */

export class TierlistExporter {
    constructor(controller) {
        this.ctrl = controller;
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-export-json').addEventListener('click', () => {
            if (!this.ctrl.isEditMode) return;
            const exportData = {
                metadata: { generatedAt: new Date().toISOString(), category: this.ctrl.currentMode },
                tiers: this.ctrl.tiers.map(t => {
                    const zone = document.querySelector(`.tier-content[data-zone="${t.id}"]`);
                    const items = zone ? Array.from(zone.querySelectorAll('.t-card')).map(c => c.dataset.id) : [];
                    return { id: t.id, name: t.name, color: t.color, items: items };
                }),
                unassigned: Array.from(this.ctrl.poolEl.querySelectorAll('.t-card')).map(c => c.dataset.id)
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `tierlist-static-${this.ctrl.currentMode}.json`);
            dlAnchorElem.click();
        });

        document.getElementById('btn-export-png').addEventListener('click', async () => {
            if (!this.ctrl.isEditMode) return;
            const btn = document.getElementById('btn-export-png');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ОБРАБОТКА...';
            
            window.scrollTo(0, 0);
            document.body.classList.add('is-exporting');
            
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            
            const captureZone = document.getElementById('capture-zone');
            
            // ИСПРАВЛЕНИЕ: Берем реальный цвет фона из CSS-токена
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-dark').trim() || '#050508';
            
            try {
                // Предполагаем, что html2canvas подключен глобально (через CDN в index.html)
                const canvas = await window.html2canvas(captureZone, {
                    backgroundColor: bgColor, scale: 2, logging: false, useCORS: true, scrollY: -window.scrollY
                });

                const link = document.createElement('a');
                link.download = `Tetla_TierList_${this.ctrl.currentMode}_${new Date().toLocaleDateString()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                alert('Ошибка при сохранении: ' + err.message);
            }
            
            document.body.classList.remove('is-exporting');
            btn.innerHTML = '<i class="fas fa-camera"></i> PNG';
        });
    }
}