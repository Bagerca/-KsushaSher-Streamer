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

// Состояние вращения колец
let ringRot1 = 0;
let ringRot2 = 0;
let ringRot3 = 0;

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
    
    // НОВОЕ: Отдельные кольца для вращения
    ring1: document.querySelector('.ring-1'),
    ring2: document.querySelector('.ring-2'),
    ring3: document.querySelector('.ring-3'),
    
    progressArea: document.getElementById('progress-area'),
    progressFill: document.getElementById('progress-fill'),
    volumeTicksContainer: document.getElementById('volume-ticks')
};

let currentVolume = 0.5;
const VOLUME_TICKS_COUNT = 20;

export function initMusicPlayer() {
    if (!els.playlist) return;

    renderPlaylist();
    createVolumeTicks();

    els.btnPlay.addEventListener('click', () => {
        if (!audioCtx) setupAudioContext();
        togglePlay();
    });
    
    els.btnPrev.addEventListener('click', prevTrack);
    els.btnNext.addEventListener('click', nextTrack);
    
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('timeupdate', updateProgress);
    els.progressArea.addEventListener('click', setProgress);

    audio.volume = currentVolume;
    updateVolumeUI(currentVolume);

    let isDraggingVolume = false;
    els.volumeTicksContainer.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        handleVolumeInput(e);
    });
    document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) handleVolumeInput(e);
    });
    document.addEventListener('mouseup', () => {
        isDraggingVolume = false;
    });
}

function createVolumeTicks() {
    els.volumeTicksContainer.innerHTML = '';
    for (let i = 0; i < VOLUME_TICKS_COUNT; i++) {
        const tick = document.createElement('div');
        tick.className = 'vol-tick';
        els.volumeTicksContainer.appendChild(tick);
    }
}

function handleVolumeInput(e) {
    if (!isMusicModeActive) return;
    const rect = els.volumeTicksContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    let newVolume = x / rect.width;
    const step = 1 / VOLUME_TICKS_COUNT;
    newVolume = Math.round(newVolume / step) * step;
    newVolume = Math.max(0, Math.min(1, newVolume));
    audio.volume = newVolume;
    currentVolume = newVolume;
    updateVolumeUI(newVolume);
}

function updateVolumeUI(vol) {
    const ticks = els.volumeTicksContainer.children;
    const activeCount = Math.round(vol * VOLUME_TICKS_COUNT);
    for (let i = 0; i < ticks.length; i++) {
        if (i < activeCount) ticks[i].classList.add('active');
        else ticks[i].classList.remove('active');
    }
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
    const clickX = e.offsetX;
    audio.currentTime = (clickX / width) * audio.duration;
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

    // Расчет средней громкости басов для пульсации и вращения
    let bassTotal = 0;
    for (let i = 0; i < 4; i++) {
        bassTotal += dataArray[i];
    }
    const bassAverage = bassTotal / 4;

    // 2. Кольца (Пульсация - SCALE)
    let scale = 1;
    if (bassAverage > 40) {
        scale = 1 + (bassAverage / 255) * 0.12; 
    }
    els.ringsContainer.style.transform = `scale(${scale})`;

    // 3. Кольца (Вращение - ROTATION) - НОВОЕ
    // Базовая скорость (медленно крутится всегда) + Скорость от баса
    // bassAverage / 255 дает значение от 0 до 1
    // Умножаем на коэффициент скорости (например 3)
    let rotationSpeed = 0.2 + (bassAverage / 255) * 4; 

    // Обновляем углы
    ringRot1 += rotationSpeed;       // По часовой
    ringRot2 -= rotationSpeed * 1.2; // Против часовой (чуть быстрее)
    ringRot3 += rotationSpeed * 0.5; // По часовой (медленнее)

    // Применяем вращение
    if(els.ring1) els.ring1.style.transform = `rotate(${ringRot1}deg)`;
    if(els.ring2) els.ring2.style.transform = `rotate(${ringRot2}deg)`;
    if(els.ring3) els.ring3.style.transform = `rotate(${ringRot3}deg)`;
}

export function toggleMusicMode() {
    isMusicModeActive = !isMusicModeActive;

    if (isMusicModeActive) {
        els.squadView.style.display = 'none';
        els.musicView.style.display = 'flex';
        els.liveStatus.style.display = 'none';
        els.musicControls.style.display = 'flex';
        els.hudRight.classList.add('music-mode-active');
        
        if (isPlaying) startVisualizer();
        updateVolumeUI(currentVolume);

        return "MUSIC MODULE: <span style='color:var(--neon-pink)'>ACTIVATED</span>";
    } else {
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
        audio.play().then(() => { startVisualizer(); }).catch(e => console.error(e));
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
    
    // Снимаем классы управления
    els.waveformContainer.classList.remove('js-controlled');
    els.ringsContainer.classList.remove('js-beat-controlled'); 
    
    // Включаем режим сброса (для плавного scale)
    els.ringsContainer.classList.add('is-resetting');
    
    // Сброс высоты баров
    resetBars(); 
    
    // Сброс масштаба и вращения колец
    els.ringsContainer.style.transform = 'scale(1)';
    // Очищаем инлайн стили вращения, чтобы CSS анимация могла подхватить управление (хотя будет скачок)
    // Либо оставляем как есть, чтобы они замерли в последней позиции? 
    // Лучше сбросить, чтобы вернулась красивая CSS-анимация.
    if(els.ring1) els.ring1.style.transform = '';
    if(els.ring2) els.ring2.style.transform = '';
    if(els.ring3) els.ring3.style.transform = '';
    
    if (resetTimeout) clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
        els.ringsContainer.classList.remove('is-resetting');
        els.ringsContainer.style.transform = ''; 
    }, 500);
}

function resetBars() {
    els.waveformBars.forEach(bar => { bar.style.height = ''; });
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