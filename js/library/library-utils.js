/* js/library/library-utils.js */
// Нормализация статусов теперь живёт в едином сервисе области поиска.
// Ре-экспорт сохраняет совместимость всех существующих импортов.
export { normalizeStatus } from '../services/search-scope.js';

// Цвета вкладок — только токены из variables.css, без хардкода.
export const TAB_COLORS = {
  'completed': 'var(--color-neon-green)',
  'playing': 'var(--color-accent-blue)',
  'on-hold': 'var(--color-warning-yellow)',
  'dropped': 'var(--color-danger-red)',
  'suggested': 'var(--color-neon-pink)'
};