/* js/music-player.js */
import { AudioCore } from './audio-core.js';
import { AudioUI } from './audio-ui.js';
import { AudioVisualizer } from './audio-visualizer.js';

let audioCoreInstance = null;
let audioUIInstance = null;
let audioVisualizerInstance = null;

export async function initMusicPlayer() {
    console.log('🎧 [MusicPlayer] Инициализация модуля...');
    
    // 1. Создаем ядро звука
    audioCoreInstance = new AudioCore();
    
    // 2. Дожидаемся загрузки плейлиста из API
    await audioCoreInstance.loadTracks();
    
    // 3. Создаем UI (передаем ему ядро для управления)
    audioUIInstance = new AudioUI(audioCoreInstance);
    
    // 4. Создаем визуализатор (передаем ему ядро для получения данных частот)
    audioVisualizerInstance = new AudioVisualizer(audioCoreInstance);
}

// Заглушка для обратной совместимости, если кто-то вызывает это извне
export function toggleMusicMode() {
    if (audioUIInstance) {
        audioUIInstance.toggleMode();
        return null;
    }
}