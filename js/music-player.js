/* js/music-player.js */

import { addLogLine, setSystemNoiseState } from './app.js';

// СПИСОК ТРЕКОВ
const tracks = [
    { 
        title: "СЛАВА БОССУ", 
        artist: "5opka", 
        url: "assets/music/5opka_slava_bossu.mp3" 
    },
    { 
        title: "ДРУЗЬЯ НАВСЕГДА", 
        artist: "НИНТЕР", 
        url: "assets/music/ninter_druzya_navsegda.mp3" 
    },
    { 
        title: "Котлетки с Пюрешкой", 
        artist: "Enjoykin", 
        url: "assets/music/enjoykin_kotletki.mp3" 
    },
    { 
        title: "Швайне (Schweine)", 
        artist: "Глюк'oZa", 
        url: "assets/music/glukoza_schweine.mp3" 
    },
    { 
        title: "PUTIN (My Heart Is Cold)", 
        artist: "Bad History", 
        url: "assets/music/bad_history_putin.mp3" 
    },
    { 
        title: "Депутат", 
        artist: "Евгений Сергеевич", 
        url: "assets/music/evgeniy_sergeevich_deputat.mp3" 
    },
    { 
        title: "comedoz", 
        artist: "comedoztv", 
        url: "assets/music/comedoztv_comedoz.mp3" 
    }
];

let audio = new Audio();
audio.crossOrigin = "anonymous"; 

let currentTrackIdx = 0;
let isPlaying = false;
let isMusicModeActive = false;

let ringRot1 = 0;
let ringRot2 = 0;
let ringRot3 = 0;

// Web Audio API
let audioCtx;
let analyser;
let source;
let animationId = null; 

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
    mainAvatar: document.querySelector('.main-display-avatar'),
    
    ring1: document.querySelector('.ring-1'),
    ring2: document.querySelector('.ring-2'),
    ring3: document.querySelector('.ring-3'),
    
    progressArea: document.getElementById('progress-area'),
    progressFill: document.getElementById('progress-fill'),
    volumeTicksContainer: document.getElementById('volume-ticks')
};

let currentVolume = 0.5;
const VOLUME_TICKS_COUNT = 20;

function logMusicAction(action, detail = "") {
    const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    addLogLine(
        `<span style="color:#ff2d95">[MUSIC] ${time}</span> ${action} <span style="color:#fff">${detail}</span>`, 
        false, 
        true
    );
}

function injectSeamlessKeyframes() {
    if (document.getElementById('seamless-rotation-style')) return;
    const style = document.createElement('style');
    style.id = 'seamless-rotation-style';
    style.innerHTML = `
        @keyframes rotate-seamless {
            from { transform: rotate(var(--rot-start, 0deg)); }
            to { transform: rotate(calc(var(--rot-start, 0deg) + 360deg)); }
        }
    `;
    document.head.appendChild(style);
}

export function initMusicPlayer() {
    if (!els.playlist) return;

    injectSeamlessKeyframes();
    renderPlaylist();
    createVolumeTicks();

    const initAudio = () => {
        if (!audioCtx) setupAudioContext();
    };

    els.btnPlay.addEventListener('click', () => {
        initAudio();
        togglePlay();
    });
    
    els.btnPrev.addEventListener('click', () => { initAudio(); prevTrack(); });
    els.btnNext.addEventListener('click', () => { initAudio(); nextTrack(); });
    
    els.playlist.addEventListener('click', initAudio);

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
        if (isDraggingVolume && isMusicModeActive) {
            const percent = Math.round(audio.volume * 100);
            logMusicAction("VOL_UPDATE:", `${percent}%`);
        }
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
    const newTime = (clickX / width) * audio.duration;
    
    audio.currentTime = newTime;
    const mins = Math.floor(newTime / 60);
    const secs = Math.floor(newTime % 60).toString().padStart(2, '0');
    logMusicAction("SEEK_TO:", `${mins}:${secs}`);
}

function setupAudioContext() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }

        if (!analyser) {
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64; 
        }

        if (!source) {
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            console.log("✅ Audio Context Connected Successfully");
        }
    } catch (e) {
        console.error("❌ Web Audio API Error:", e);
    }
}

function getComputedRotation(el) {
    if (!el) return 0;
    const style = window.getComputedStyle(el);
    const transform = style.transform || style.webkitTransform;
    if (transform !== 'none') {
        const values = transform.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        let angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
        return angle; 
    }
    return 0;
}

// --- ВИЗУАЛИЗАТОР (ОБНОВЛЕННАЯ ЛОГИКА) ---
function visualizerLoop() {
    if (!isMusicModeActive) {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        return;
    }

    animationId = requestAnimationFrame(visualizerLoop);

    let bassAverage = 0;
    let dataArray = null;

    if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Расчет баса (первые 8 частот)
        let bassTotal = 0;
        for (let i = 0; i < 8; i++) { 
            bassTotal += dataArray[i];
        }
        bassAverage = bassTotal / 8;

        // 1. Анимация волн в панели (справа)
        els.waveformBars.forEach((bar, index) => {
            let value = dataArray[index] || 0;
            let heightPercent = (value / 255) * 100;
            bar.style.height = heightPercent < 2 ? '4px' : `${heightPercent}%`;
        });
        els.waveformContainer.classList.add('js-controlled');

        // 2. Анимация навигационных квадратиков
        // Ищем элементы каждый кадр, чтобы работать даже после скролла
        const liveShapes = document.querySelectorAll('.nav-marker .nav-shape');

        if (liveShapes.length > 0) {
            const pulseDuration = 100;
            
            // Распределение частот: Низкие частоты (басы) дублируем по краям
            const freqBands = [
                { start: 0, end: 4, threshold: 0.4 },   // БАС (Верхний квадрат)
                { start: 2, end: 6, threshold: 0.35 },  // БАС
                { start: 4, end: 8, threshold: 0.3 },   // Низкая середина
                { start: 6, end: 12, threshold: 0.3 },  // Середина
                { start: 8, end: 16, threshold: 0.3 },  // Высокая середина
                { start: 0, end: 5, threshold: 0.4 }    // БАС (Нижний квадрат)
            ];

            liveShapes.forEach((shape, i) => {
                const bandIndex = i % freqBands.length;
                const bandConfig = freqBands[bandIndex];
                
                let bandEnergy = 0;
                const safeStart = Math.min(bandConfig.start, bufferLength - 1);
                const safeEnd = Math.min(bandConfig.end, bufferLength - 1);
                
                for (let j = safeStart; j <= safeEnd; j++) {
                    bandEnergy += dataArray[j];
                }
                const count = safeEnd - safeStart + 1;
                const avgIntensity = count > 0 ? (bandEnergy / count) / 255 : 0; 

                // Если энергия выше порога - пульсируем
                if (avgIntensity > bandConfig.threshold) {
                    if (shape.dataset.pulseTimer) {
                        clearTimeout(parseInt(shape.dataset.pulseTimer));
                    }

                    shape.style.borderColor = 'var(--neon-green)';
                    shape.style.backgroundColor = 'var(--neon-green)';
                    shape.style.boxShadow = `0 0 ${25 * avgIntensity}px var(--neon-green)`;
                    shape.style.transform = `rotate(45deg) scale(${1.1 + (avgIntensity * 0.5)})`;
                    
                    const timerId = setTimeout(() => {
                        shape.style.borderColor = ''; 
                        shape.style.backgroundColor = '';
                        shape.style.boxShadow = '';
                        shape.style.transform = ''; 
                    }, pulseDuration);
                    
                    shape.dataset.pulseTimer = timerId;
                }
            });
        }

        // 3. Аватар Glow
        if (els.mainAvatar) {
            const intensity = bassAverage / 255;
            const sharpIntensity = Math.pow(intensity, 2);
            const glowRadius = 10 + (sharpIntensity * 35);
            els.mainAvatar.style.filter = `drop-shadow(0 0 ${glowRadius}px var(--neon-pink))`;
        }

    } else {
        // Режим паузы
        els.waveformBars.forEach(bar => { bar.style.height = '4px'; });
        els.waveformContainer.classList.remove('js-controlled');
        
        // Сброс квадратиков
        const liveShapes = document.querySelectorAll('.nav-marker .nav-shape');
        liveShapes.forEach(shape => {
            if (shape.dataset.pulseTimer) clearTimeout(parseInt(shape.dataset.pulseTimer));
            shape.style = '';
        });
        
        if (els.mainAvatar) {
            els.mainAvatar.style.filter = '';
        }
    }

    // 4. Кольца (Пульсация)
    let scale = 1;
    if (bassAverage > 40) {
        scale = 1 + (bassAverage / 255) * 0.3; 
    }
    if(els.ringsContainer) els.ringsContainer.style.transform = `scale(${scale})`;

    // 5. Кольца (Вращение)
    let rotationSpeed = 0.5 + (bassAverage / 255) * 3.0; 

    ringRot1 += rotationSpeed;       
    ringRot2 -= rotationSpeed * 1.1; 
    ringRot3 += rotationSpeed * 0.4; 

    if(els.ring1) els.ring1.style.transform = `rotate(${ringRot1}deg)`;
    if(els.ring2) els.ring2.style.transform = `rotate(${ringRot2}deg)`;
    if(els.ring3) els.ring3.style.transform = `rotate(${ringRot3}deg)`;
}

export function toggleMusicMode() {
    const panelContent = document.querySelector('.hud-side-panel.right .panel-content');
    const statusContainer = document.querySelector('.main-display-status');
    
    if (panelContent.classList.contains('is-glitching')) return;

    panelContent.classList.add('is-glitching');
    statusContainer.classList.add('status-switching');

    setTimeout(() => {
        isMusicModeActive = !isMusicModeActive;

        if (isMusicModeActive) {
            setSystemNoiseState(false);

            els.squadView.style.display = 'none';
            els.musicView.style.display = 'flex';
            
            els.liveStatus.style.display = 'none';
            els.musicControls.style.display = 'flex';
            
            els.hudRight.classList.add('music-mode-active');
            
            ringRot1 = getComputedRotation(els.ring1);
            ringRot2 = getComputedRotation(els.ring2);
            ringRot3 = getComputedRotation(els.ring3);

            [els.ring1, els.ring2, els.ring3].forEach(el => {
                if(el) el.style.animation = 'none';
            });

            if (animationId) cancelAnimationFrame(animationId);
            visualizerLoop();

            updateVolumeUI(currentVolume);
            logMusicAction("MODULE_INIT", "READY");

        } else {
            setSystemNoiseState(true);

            if (isPlaying) pauseTrack();
            
            els.squadView.style.display = 'flex';
            els.musicView.style.display = 'none';
            
            els.liveStatus.style.display = 'flex';
            els.musicControls.style.display = 'none';
            
            els.hudRight.classList.remove('music-mode-active');
            els.progressFill.style.width = '0%';
            
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }

            if (els.ring1) {
                els.ring1.style.setProperty('--rot-start', `${ringRot1 % 360}deg`);
                els.ring1.style.animationName = 'rotate-seamless';
                els.ring1.style.transform = '';
            }
            if (els.ring2) {
                els.ring2.style.setProperty('--rot-start', `${ringRot2 % 360}deg`);
                els.ring2.style.animationName = 'rotate-seamless';
                els.ring2.style.transform = '';
            }
            if (els.ring3) {
                els.ring3.style.setProperty('--rot-start', `${ringRot3 % 360}deg`);
                els.ring3.style.animationName = 'rotate-seamless';
                els.ring3.style.transform = '';
            }

            // Сброс стилей навигации
            const liveShapes = document.querySelectorAll('.nav-marker .nav-shape');
            liveShapes.forEach(shape => {
                if (shape.dataset.pulseTimer) clearTimeout(parseInt(shape.dataset.pulseTimer));
                shape.style = '';
            });

            if (els.mainAvatar) {
                els.mainAvatar.style.filter = '';
            }
        }
        
        statusContainer.classList.remove('status-switching');

    }, 200);

    setTimeout(() => {
        panelContent.classList.remove('is-glitching');
    }, 400);

    return !isMusicModeActive 
        ? "MUSIC MODULE: <span style='color:var(--neon-pink)'>ACTIVATING...</span>"
        : "MUSIC MODULE: <span style='color:var(--neon-green)'>DEACTIVATING...</span>";
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
        audio.play().catch(e => console.error(e));
        isPlaying = true;
        updatePlayIcon();
        renderPlaylist();
        
        const currentTrack = tracks[currentTrackIdx];
        logMusicAction("PLAYING:", currentTrack.title);
    }
}

function playTrack(index) {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    loadTrack(index);
    audio.play();
    isPlaying = true;
    updatePlayIcon();
    logMusicAction("TRACK_START:", tracks[index].title);
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    updatePlayIcon();
    renderPlaylist();
    logMusicAction("STATUS:", "PAUSED");
}

function nextTrack() {
    let nextIdx = currentTrackIdx + 1;
    if (nextIdx >= tracks.length) nextIdx = 0;
    
    logMusicAction("CMD:", "NEXT_TRACK >>");
    playTrack(nextIdx);
}

function prevTrack() {
    let prevIdx = currentTrackIdx - 1;
    if (prevIdx < 0) prevIdx = tracks.length - 1;
    
    logMusicAction("CMD:", "<< PREV_TRACK");
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