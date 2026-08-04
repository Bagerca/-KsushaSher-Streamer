/* js/services/MobileOptimizer.js */

export class MobileOptimizer {
    static isMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static applyMobilePatches(terminalCtrl, fxController) {
        if (!this.isMobile()) return false;

        console.log('📱 [MobileOptimizer] Мобильное устройство: Активирован режим энергосбережения и минимализма.');

        // 1. Отключаем тяжелые VFX графические движки (Драконы, ящерицы, кометы)
        if (fxController) {
            document.body.classList.add('state-no-comets', 'state-no-stars');
            fxController.state.fxMode = 3; 
            fxController.engines.matrix.stop();
            fxController.engines.comet.stopIdle();
        }

        // 2. Полностью глушим фоновый шум терминала, так как на мобилках мы его скрываем CSS-ом
        // Это спасет телефон от бесполезных обновлений DOM-дерева в фоне
        if (terminalCtrl && terminalCtrl.fx) {
            clearInterval(terminalCtrl.fx.noiseInterval);
            terminalCtrl.isSystemNoiseAllowed = false;
        }

        // 3. Добавляем глобальный класс для будущих CSS-оптимизаций
        document.body.classList.add('is-mobile-device');

        return true;
    }
}