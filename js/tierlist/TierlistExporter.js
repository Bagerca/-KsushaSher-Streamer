/* js/tierlist/TierlistExporter.js */
/**
 * Экспорт тирлиста в JSON и PNG.
 * Экспорт гарантирует снятие служебного класса body даже при ошибке
 * или уходе со страницы посреди рендера.
 */
export class TierlistExporter {
    constructor(controller) {
        this.ctrl = controller;
        this.isExporting = false;
        this.btnPng = document.getElementById('btn-export-png');
        this.btnPngDefaultHtml = this.btnPng ? this.btnPng.innerHTML : '';
        this.bindEvents();
    }

    bindEvents() {
        const btnJson = document.getElementById('btn-export-json');
        if (btnJson) btnJson.addEventListener('click', () => this.exportJson());
        if (this.btnPng) this.btnPng.addEventListener('click', () => this.exportPng());
    }

    exportJson() {
        if (!this.ctrl.isEditMode) return;
        try {
            const boardEl = this.ctrl.board.boardEl;
            const payload = {
                metadata: { generatedAt: new Date().toISOString(), category: this.ctrl.currentMode },
                tiers: this.ctrl.tiers.map(tier => {
                    const zone = boardEl.querySelector(`.tier-content[data-zone="${tier.id}"]`);
                    const items = zone ? Array.from(zone.querySelectorAll('.t-card')).map(c => c.dataset.id) : [];
                    return { id: tier.id, name: tier.name, color: tier.color, items };
                }),
                unassigned: Array.from(this.ctrl.poolEl.querySelectorAll('.t-card')).map(c => c.dataset.id)
            };

            const href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
            const link = document.createElement('a');
            link.href = href;
            link.download = `tierlist-static-${this.ctrl.currentMode}.json`;
            link.click();
            console.log(`📋 [Tierlist] JSON экспортирован (${this.ctrl.currentMode})`);
        } catch (error) {
            console.error('🚨 [Tierlist] Ошибка экспорта JSON:', error);
            alert('Не удалось сохранить JSON: ' + error.message);
        }
    }

    async exportPng() {
        if (!this.ctrl.isEditMode || this.isExporting) return;

        if (typeof window.html2canvas !== 'function') {
            alert('Модуль html2canvas не загрузился. Проверьте соединение и повторите.');
            console.warn('⚠️ [Tierlist] html2canvas недоступен — экспорт PNG отменён.');
            return;
        }

        this.isExporting = true;
        if (this.btnPng) this.btnPng.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ОБРАБОТКА...';
        window.scrollTo(0, 0);
        document.body.classList.add('is-exporting');

        try {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const captureZone = document.getElementById('capture-zone');
            if (!captureZone) throw new Error('Область захвата не найдена');

            const bgColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--color-bg-dark').trim() || '#050508';

            const canvas = await window.html2canvas(captureZone, {
                backgroundColor: bgColor,
                scale: 2,
                logging: false,
                useCORS: true,
                scrollY: -window.scrollY
            });

            const link = document.createElement('a');
            link.download = `Tetla_TierList_${this.ctrl.currentMode}_${new Date().toLocaleDateString('ru-RU')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            console.log(`📋 [Tierlist] PNG экспортирован (${this.ctrl.currentMode})`);
        } catch (error) {
            console.error('🚨 [Tierlist] Ошибка экспорта PNG:', error);
            alert('Ошибка при сохранении: ' + error.message);
        } finally {
            this.cleanup();
        }
    }

    cleanup() {
        document.body.classList.remove('is-exporting');
        if (this.btnPng) this.btnPng.innerHTML = this.btnPngDefaultHtml;
        this.isExporting = false;
    }
}