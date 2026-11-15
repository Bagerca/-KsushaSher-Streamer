/* js/music-player.js */
import { AppStore } from './store.js';
import { AudioCore } from './audio-core.js';
import { AudioUI } from './audio-ui.js';
import { AudioVisualizer } from './audio-visualizer.js';

let audioCoreInstance = null;
let audioUIInstance = null;
let audioVisualizerInstance = null;
let initPromise = null;

export async function initMusicPlayer() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        console.log('🎧 [MusicPlayer] Инициализация модуля...');
        try {
            audioCoreInstance = new AudioCore();
            await audioCoreInstance.loadTracks();
            AppStore.dispatch({ type: 'AUDIO_LOAD_TRACKS', payload: audioCoreInstance.tracks });
            AppStore.dispatch({ type: 'AUDIO_SET_VOLUME', payload: audioCoreInstance.audio.volume });

            audioUIInstance = new AudioUI(audioCoreInstance);
            audioVisualizerInstance = new AudioVisualizer(audioCoreInstance);
            console.log(`🎧 [MusicPlayer] Готов. Треков: ${audioCoreInstance.tracks.length}`);
        } catch (error) {
            console.error('🚨 [MusicPlayer] Ошибка инициализации:', error);
            initPromise = null;
        }
    })();

    return initPromise;
}

/**
 * Единственный вход в режим плеера: состояние живёт в Store,
 * UI реагирует подпиской. Прямой вызов toggleMode() без аргумента
 * ломал состояние — теперь такое невозможно.
 */
export function setMusicMode(isActive) {
    const current = AppStore.getState().audio.isMusicModeActive;
    const target = Boolean(isActive);
    if (current !== target) AppStore.dispatch({ type: 'AUDIO_TOGGLE_MODE' });
    return target;
}

export function toggleMusicMode(force) {
    const current = AppStore.getState().audio.isMusicModeActive;
    return setMusicMode(typeof force === 'boolean' ? force : !current);
}

export function getMusicCore() { return audioCoreInstance; }
export function getMusicUI() { return audioUIInstance; }
export function getMusicVisualizer() { return audioVisualizerInstance; }