/* js/music-player.js */

const tracks = [
    { title: "СЛАВА БОССУ", artist: "5opka", url: "assets/music/5opka_slava_bossu.mp3" },
    { title: "Cyberpunk City", artist: "Infraction", url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3" },
    { title: "Night Runner", artist: "Synthwave", url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Elips.mp3" },
    { title: "Neon Drive", artist: "Retrowave", url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Ketsa/Raising_Frequency/Ketsa_-_10_-_Dreaming_Days.mp3" },
    { title: "Hack the Mainframe", artist: "Glitch", url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3" },
    { title: "System Failure", artist: "Dark Techno", url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Rolemusic/The_Black_Dot/Rolemusic_-_04_-_The_Black_Dot.mp3" }
];

let audio = new Audio();
audio.crossOrigin = "anonymous"; 

let currentTrackIdx = 0;
let isPlaying = false;
let isMusicModeActive = false;
let currentVolume = 1; // НОВОЕ: Текущая громкость (от 0 до 1)

// Web Audio API
let audioCtx;
let analyser;
let source;
let animationId;
let resetTimeout; 

// DOM Элементы
const els = {
    squadView: document.getElementById('squad-view'),
    musicView: document.getElementById('music-view'),
    liveStatus: document.getElementById('live-status-container'),
    musicControls: document.getElementById('music-controls-container'),
    playlist: document.getElementById('playlist-list'),
    btnPlay: document.getElementById('btn-play'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    hudRight: document.querySelector('.hud-side-panel.right'),
    
    waveformContainer: document.querySelector('.sync-waveform'),
    waveformBars: document.querySelectorAll('.sync-waveform .bar'),
    ringsContainer: document.querySelector('.main-display-rings'),
    
    progressArea: document.getElementById('progress-area'),
    progressFill: document.getElementById('progress-fill'),

    // НОВЫЕ ЭЛЕМЕНТЫ ГРОМКОСТИ
    volumeArea: document.getElementById('volume-area'),
    volumeFill: document.getElementById('volume-fill'),
    volumeHandle: document.getElementById('volume-handle')
};

export function initMusicPlayer() {
    if (!els.playlist) return;

    renderPlaylist();

    els.btnPlay.addEventListener('click', () => {
        if (!audioCtx) setupAudioContext();
        togglePlay();
    });
    
    els.btnPrev.addEventListener('click', prevTrack);
    els.btnNext.addEventListener('click', nextTrack);
    
    audio.addEventListener('ended', nextTrack);

    audio.addEventListener('timeupdate', updateProgress);
    els.progressArea.addEventListener('click', setProgress);

    // НОВОЕ: Инициализация и слушатели для громкости
    audio.volume = currentVolume; // Устанавливаем начальную громкость
    updateVolumeUI(currentVolume); // Обновляем UI громкости
    els.volumeArea.addEventListener('click', setVolume);
    
    // Перетаскивание ползунка громкости (drag and drop)
    let isDraggingVolume = false;
    els.volumeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Предотвращаем выделение текста
        isDraggingVolume = true;
    });
    // Слушаем движения мыши на всем документе, чтобы можно было перетаскивать за пределы бара
    document.addEventListener('mousemove', (e) => {
        if (!isDraggingVolume) return;
        setVolume(e); // Используем тот же обработчик для обновления громкости
    });
    // Останавливаем перетаскивание при отпускании кнопки мыши
    document.addEventListener('mouseup', () => {
        isDraggingVolume = false;
    });
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (isNaN(duration)) return;
    const progressPercent = (currentTime / duration) * 100;
    els.progressFill.style.width = `${progressPercent}%`;
}

function setProgress(e) {
    if (!isMusicModeActive || isNaN(audio.duration)) return;

    const width = els.progressArea.clientWidth;
    const clickX = e.offsetX; // Позиция клика относительно элемента
    
    audio.currentTime = (clickX / width) * audio.duration;
}

// НОВАЯ ФУНКЦИЯ: Установка громкости по клику/перетаскиванию
function setVolume(e) {
    // Проверяем, что это Music Mode и что мы перетаскиваем или кликаем по области
    if (!isMusicModeActive && !isDraggingVolume) return;
    if (e.target !== els.volumeArea && e.target !== els.volumeHandle && isDraggingVolume === false) return; // Уточненная проверка для клика

    const volumeAreaRect = els.volumeArea.getBoundingClientRect();
    let clientX = e.clientX; // Позиция курсора на странице

    // Ограничиваем clientX в пределах ползунка
    let newX = clientX - volumeAreaRect.left;
    newX = Math.max(0, Math.min(newX, volumeAreaRect.width));
    
    let newVolume = newX / volumeAreaRect.width;
    newVolume = Math.max(0, Math.min(1, newVolume)); // Громкость от 0 до 1

    audio.volume = newVolume;
    currentVolume = newVolume; // Сохраняем для обновления UI
    updateVolumeUI(newVolume);
}

// НОВАЯ ФУНКЦИЯ: Обновление UI громкости
function updateVolumeUI(volume) {
    const volumePercent = volume * 100;
    els.volumeFill.style.width = `${volumePercent}%`;
    // Позиционируем бегунок (нужно учесть его ширину, чтобы не вылезал)
    els.volumeHandle.style.right = `${100 - volumePercent}%`;
    // Если громкость 0, сдвигаем хендл влево на его ширину
    if (volume === 0) {
        els.volumeHandle.style.right = `${100 - (els.volumeHandle.clientWidth / els.volumeArea.clientWidth) * 100}%`;
    } else {
        els.volumeHandle.style.right = `${100 - volumePercent}%`;
    }
}


function setupAudioContext() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyser.fftSize = 64; 
    } catch (e) {
        console.warn("Web Audio API Error", e);
    }
}

function visualizerLoop() {
    if (!isPlaying || !analyser || !isMusicModeActive) return;

    animationId = requestAnimationFrame(visualizerLoop);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);

    // 1. Волны
    els.waveformBars.forEach((bar, index) => {
        let value = dataArray[index] || 0;
        let heightPercent = (value / 255) * 100;
        bar.style.height = heightPercent < 2 ? '4px' : `${heightPercent}%`;
    });

    // 2. Кольца
    let bassTotal = 0;
    for (let i = 0; i < 4; i++) {
        bassTotal += dataArray[i];
    }
    const bassAverage = bassTotal / 4;

    let scale = 1;
    if (bassAverage > 40) {
        scale = 1 + (bassAverage / 255) * 0.12; 
    }

    els.ringsContainer.style.transform = `scale(${scale})`;
}

export function toggleMusicMode() {
    isMusicModeActive = !isMusicModeActive;

    if (isMusicModeActive) {
        // ВКЛЮЧАЕМ
        els.squadView.style.display = 'none';
        els.musicView.style.display = 'flex';
        els.liveStatus.style.display = 'none';
        els.musicControls.style.display = 'flex';
        els.hudRight.classList.add('music-mode-active');
        
        if (isPlaying) {
            startVisualizer();
        }
        
        // НОВОЕ: Обновляем UI громкости при входе в режим
        updateVolumeUI(currentVolume);

        return "MUSIC MODULE: <span style='color:var(--neon-pink)'>ACTIVATED</span>";
    } else {
        // ВЫКЛЮЧАЕМ
        if (isPlaying) pauseTrack();

        els.squadView.style.display = 'flex';
        els.musicView.style.display = 'none';
        els.liveStatus.style.display = 'flex';
        els.musicControls.style.display = 'none';
        els.hudRight.classList.remove('music-mode-active');
        
        els.progressFill.style.width = '0%';
        
        stopVisualizer();
        
        return "MUSIC MODULE: <span style='color:var(--neon-green)'>DEACTIVATED</span>";
    }
}

function renderPlaylist() {
    els.playlist.innerHTML = tracks.map((track, index) => `
        <div class="track-item ${index === currentTrackIdx ? 'active' : ''}" data-index="${index}">
            <div class="track-icon">
                ${index === currentTrackIdx && isPlaying ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-music"></i>'}
            </div>
            <div class="track-info">
                <span class="track-title">${track.title}</span>
                <span class="track-artist">${track.artist}</span>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            if (!audioCtx) setupAudioContext();
            playTrack(index);
        });
    });
}

function loadTrack(index) {
    currentTrackIdx = index;
    audio.src = tracks[index].url;
    audio.load();
    renderPlaylist();
}

function togglePlay() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if (isPlaying) {
        pauseTrack();
    } else {
        if (!audio.src) loadTrack(currentTrackIdx);
        audio.play().then(() => {
            startVisualizer();
        }).catch(e => console.error(e));
        
        isPlaying = true;
        updatePlayIcon();
        renderPlaylist();
    }
}

function playTrack(index) {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    
    loadTrack(index);
    audio.play();
    isPlaying = true;
    startVisualizer();
    updatePlayIcon();
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    stopVisualizer();
    updatePlayIcon();
    renderPlaylist();
}

function startVisualizer() {
    if (isMusicModeActive) {
        if (resetTimeout) clearTimeout(resetTimeout);
        els.ringsContainer.classList.remove('is-resetting');
        
        els.waveformContainer.classList.add('js-controlled');
        els.ringsContainer.classList.add('js-beat-controlled');
        visualizerLoop();
    }
}

function stopVisualizer() {
    cancelAnimationFrame(animationId);
    
    els.waveformContainer.classList.remove('js-controlled');
    els.ringsContainer.classList.remove('js-beat-controlled'); 
    
    els.ringsContainer.classList.add('is-resetting');
    
    resetBars(); 
    els.ringsContainer.style.transform = 'scale(1)'; 
    
    if (resetTimeout) clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
        els.ringsContainer.classList.remove('is-resetting');
        els.ringsContainer.style.transform = ''; 
    }, 500);
}

function resetBars() {
    els.waveformBars.forEach(bar => {
        bar.style.height = ''; 
    });
}

function nextTrack() {
    let nextIdx = currentTrackIdx + 1;
    if (nextIdx >= tracks.length) nextIdx = 0;
    playTrack(nextIdx);
}

function prevTrack() {
    let prevIdx = currentTrackIdx - 1;
    if (prevIdx < 0) prevIdx = tracks.length - 1;
    playTrack(prevIdx);
}

function updatePlayIcon() {
    const icon = els.btnPlay.querySelector('i');
    if (isPlaying) {
        icon.className = 'fas fa-pause';
    } else {
        icon.className = 'fas fa-play';
    }
}