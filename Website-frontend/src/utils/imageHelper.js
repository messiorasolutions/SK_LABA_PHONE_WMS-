import { API_BASE_URL } from '../services/axiosInstance.js';

/**
 * Placeholder SVG data URI to prevent broken image icons and layout shift.
 * Styled with a subtle phone silhouette and dark glass styling.
 */
export const CARD_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><rect width="400" height="400" fill="%23080D1A"/><rect x="120" y="60" width="160" height="280" rx="24" fill="%230F172A" stroke="%231E293B" stroke-width="2"/><circle cx="200" cy="80" r="4" fill="%23334155"/><rect x="180" y="78" width="40" height="4" rx="2" fill="%23334155"/><circle cx="200" cy="310" r="10" fill="none" stroke="%23334155" stroke-width="1.5"/><text x="200" y="200" fill="%23475569" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="1">SK LABA PHONE</text></svg>`;

/**
 * Resolves any image URL (full URL, relative storage path, or data URI) to an absolute URL.
 * Automatically prepends backend API_BASE_URL and /uploads/ for stored images.
 *
 * @param {string|null|undefined} photoPath
 * @param {'thumbnail'|'card'|'detail'|'gallery'} [variant='card']
 * @returns {string} Fully qualified URL or fallback placeholder
 */
export function resolveImageUrl(photoPath, variant = 'card') {
  if (!photoPath || typeof photoPath !== 'string') {
    return CARD_PLACEHOLDER_SVG;
  }

  const trimmed = photoPath.trim();
  if (!trimmed) {
    return CARD_PLACEHOLDER_SVG;
  }

  // Already absolute or data URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = (API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
  let cleanPath = trimmed.replace(/^\/+/, '');

  // If path already starts with uploads/, do not duplicate
  if (cleanPath.startsWith('uploads/')) {
    return `${base}/${cleanPath}`;
  }

  return `${base}/uploads/${cleanPath}`;
}

/**
 * Maps condition grade codes to human-friendly labels and styling colors.
 * Matches HCI principles ("Match the Real World").
 *
 * @param {string} grade
 * @returns {{ label: string, colorClass: string, bgClass: string, borderClass: string, description: string }}
 */
export function getConditionGradeMeta(grade) {
  const normalized = String(grade || '').toUpperCase().trim();

  switch (normalized) {
    case 'BRAND_NEW':
    case 'BRAND NEW':
    case 'NEW':
      return {
        label: 'Brand New',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        description: 'Brand new in sealed box with original accessories.',
      };
    case 'LIKE_NEW':
    case 'LIKE NEW':
      return {
        label: 'Like New',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dotClass: 'bg-sky-400',
        description: 'Flawless condition, zero scratches or marks, barely used.',
      };
    case 'EXCELLENT':
      return {
        label: 'Excellent',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dotClass: 'bg-cyan-400',
        description: 'Light superficial wear, no deep scratches, pristine screen.',
      };
    case 'VERY_GOOD':
    case 'VERY GOOD':
      return {
        label: 'Very Good',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        dotClass: 'bg-indigo-400',
        description: 'Normal minor cosmetic use, 100% hardware functionality.',
      };
    case 'GOOD':
      return {
        label: 'Good',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-400',
        description: 'Moderate cosmetic signs of use, fully inspected & operational.',
      };
    case 'FAIR':
      return {
        label: 'Fair',
        badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
        dotClass: 'bg-orange-400',
        description: 'Noticeable cosmetic wear, fully working camera, screen, and battery.',
      };
    default:
      return {
        label: grade || 'Pre-Owned',
        badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        dotClass: 'bg-slate-400',
        description: 'Verified marketplace smartphone.',
      };
  }
}

/**
 * Currency formatter respecting Sri Lankan Rupees (Rs.) or fallback format.
 *
 * @param {number|string} amount
 * @param {'Rs.'|'$'} [currency='Rs.']
 * @returns {string} Formatted price
 */
export function formatCurrency(amount, currency = 'Rs.') {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numeric)) return `${currency} 0`;
  return `${currency} ${numeric.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}
