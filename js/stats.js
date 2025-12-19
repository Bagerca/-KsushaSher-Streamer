/* js/stats.js */
import { loadData } from './api.js';

let radarChartInstance = null;

export async function initStats() {
    try {
        await loadChartJS();
        const stats = await loadData('stats.json', { followers: 0, hours: 0, loyalty: 0 });
        
        // 1. Обновляем цифры
        const followersEl = document.querySelector('.followers-val');
        if (followersEl) followersEl.textContent = formatNumber(stats.followers);
        
        const hoursEl = document.querySelector('.hours-val');
        if (hoursEl) hoursEl.textContent = formatNumber(stats.hours) + '+';
        
        // 2. Круговая диаграмма
        const circularSvg = document.querySelector('.circular-svg-compact .circle');
        const loyaltyText = document.querySelector('.loyalty-val');
        
        if (circularSvg && loyaltyText) {
            loyaltyText.textContent = `${stats.loyalty}%`;
            circularSvg.style.strokeDasharray = `${stats.loyalty}, 100`;
            if (stats.loyalty >= 90) circularSvg.style.stroke = 'var(--neon-green)';
            else if (stats.loyalty >= 70) circularSvg.style.stroke = '#ffd700';
            else circularSvg.style.stroke = '#ff6464';
        }

        // 3. Радар
        createRadarChart(stats);
        
    } catch (error) {
        console.error('Error rendering stats:', error);
    }
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function loadChartJS() {
    return new Promise((resolve) => {
        if (window.Chart) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = resolve; 
        document.head.appendChild(script);
    });
}

function createRadarChart(stats) {
    const ctx = document.getElementById('radarChart');
    if (!ctx || !window.Chart) return;

    if (radarChartInstance) radarChartInstance.destroy();

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Рост', 'Стримы', 'Контент', 'Чат', 'Лояльность', 'Игры'],
            datasets: [{
                data: [85, 70, 90, 80, stats.loyalty || 50, 60],
                backgroundColor: 'rgba(57, 255, 20, 0.15)',
                borderColor: '#39ff14',
                borderWidth: 2,
                pointBackgroundColor: '#39ff14',
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true, max: 100, ticks: { display: false },
                    angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    grid: { color: 'rgba(57, 255, 20, 0.1)' },
                    pointLabels: { color: '#ccc', font: { size: 10, family: "'Rajdhani'" } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}