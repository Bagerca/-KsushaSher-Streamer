/* js/media-item/ItemRenderer.js */
import { optimizeImageUrl } from '../utils.js';
import { STATUS_MAP } from '../media-store.js';
import { getItemImageUrl } from './item-utils.js';

/* Кэш загрузчика JsBarcode: один <script> на всё приложение. */
let barcodeLibPromise = null;
function ensureBarcodeLib() {
if (window.JsBarcode) return Promise.resolve();
if (!barcodeLibPromise) {
barcodeLibPromise = new Promise((resolve, reject) => {
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
script.onload = () => resolve();
script.onerror = () => {
barcodeLibPromise = null; // даём повторить попытку при следующем вызове
reject(new Error('JsBarcode CDN load failed'));
};
document.head.appendChild(script);
});
}
return barcodeLibPromise;
}

/**
 * Метаданные и тема страницы: заголовок, описание, статус, рейтинг,
 * штрихкод, кинематографичный фон и цвет --item-color.
 */
export class ItemRenderer {
constructor(els) {
this.els = els;
this.barcodeSession = 0;
}

applyDataFields(currentItem, type, initColor) {
this.applyThemeColor(initColor);
this.setTitle(currentItem.title || 'БЕЗ НАЗВАНИЯ');

const description = currentItem.description;
if (!description || description.trim() === '...' || description.trim() === '') {
this.els.desc.style.display = 'none';
} else {
this.els.desc.style.display = 'block';
this.els.desc.textContent = description;
}

const effectiveStatus = currentItem.status || 'unknown';
if (effectiveStatus === 'suggested') {
this.els.ratingBox.style.display = 'none';
this.els.statusBadge.innerHTML = `<i class="fas fa-user"></i> Предложил: ${currentItem.suggestedBy || 'Агент'}`;
} else {
this.els.ratingBox.style.display = 'flex';
this.els.statusBadge.textContent = STATUS_MAP[effectiveStatus] || effectiveStatus;
const rating = currentItem.rating || 0;
if (rating > 0) {
this.els.ratingVal.textContent = rating.toFixed(1);
const rScore = Math.round(rating);
this.els.segments.innerHTML = Array.from({ length: 5 }, (_, i) =>
`<div class="modal-segment-line ${i < rScore ? 'filled' : ''}"></div>`
).join('');
} else {
this.els.ratingVal.textContent = 'N/A';
this.els.segments.innerHTML = `<span style="font-family:monospace;font-size:0.7rem;color:var(--color-text-muted);">NO_DATA</span>`;
}
}

this.els.sysId.textContent = currentItem.id || 'SYS_UNKNOWN';
this.els.dataType.textContent = type ? type.toUpperCase() : 'UNKNOWN';

this.generateBarcode(this.els.sysId.textContent.toUpperCase());
this.setBackground(getItemImageUrl(currentItem));
}

setTitle(title) {
this.els.title.textContent = title;
this.els.googleLink.href = `https://www.google.com/search?q=${encodeURIComponent(title)}`;
}

applyThemeColor(color) {
this.els.page.style.setProperty('--item-color', color);
this.els.ratingVal.style.color = color;
this.els.segments.querySelectorAll('.filled').forEach(s => s.style.color = color);
}

setBackground(url) {
this.els.bg.style.backgroundImage = url ? `url('${optimizeImageUrl(url, 1200, 80)}')` : 'none';
}

generateBarcode(textId) {
const linesContainer = this.els.barcodeContainer.querySelector('.barcode-lines');
if (!linesContainer) return;
const session = ++this.barcodeSession;

const render = () => {
if (session !== this.barcodeSession) return;
linesContainer.innerHTML = '';
try {
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.style.height = '100%';
svg.style.color = 'var(--item-color)';
linesContainer.appendChild(svg);
window.JsBarcode(svg, textId, {
format: 'CODE39',
displayValue: false,
background: 'transparent',
lineColor: 'currentColor',
margin: 0,
width: 2,
height: 40
});
console.log(`🏷️ [ItemRenderer] Баркод сгенерирован (адаптивный цвет): ${textId}`);
} catch (e) {
console.warn('⚠️ [ItemRenderer] Не удалось сгенерировать штрихкод:', e.message);
}
};

if (window.JsBarcode) {
render();
} else {
ensureBarcodeLib()
.then(render)
.catch(e => console.warn('⚠️ [ItemRenderer] JsBarcode недоступен:', e.message));
}
}
}