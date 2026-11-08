/* js/library/library-utils.js */

export const TAB_COLORS = {
    'completed': '#39ff14',
    'playing': '#00ccff',
    'on-hold': '#ffd700',
    'dropped': '#ff4444',
    'suggested': '#ff2d95'
};

// Объединяем статусы кино и игр под общие знаменатели вкладок
export function normalizeStatus(status) {
    if (status === 'watched') return 'completed';
    if (status === 'watching') return 'playing';
    return status || 'unknown';
}