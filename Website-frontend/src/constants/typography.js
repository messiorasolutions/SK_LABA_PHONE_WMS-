// ============================================================
// TYPOGRAPHY DESIGN TOKENS
// ============================================================

export const FONT_SIZE = {
  xxs: '10px',
  xs: '12px',
  sm: '13px',
  base: '14px',
  md: '15px',
  lg: '16px',
  xl: '18px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '38px',
  '5xl': '48px',
  '6xl': '60px',
};

export const FONT_WEIGHT = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const TYPOGRAPHY = {
  heroTitle: 'text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]',
  heroSubtitle: 'text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-slate-400',
  heroDesc: 'text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed',
  sectionTitle: 'text-2xl sm:text-3xl font-bold text-white tracking-tight',
  sectionDesc: 'text-xs sm:text-sm text-slate-400',
  cardTitle: 'text-sm sm:text-base font-bold text-white',
  cardSubtitle: 'text-xs text-slate-400 font-normal',
  navLink: 'text-sm font-medium text-slate-300 hover:text-white transition-colors',
  navLinkActive: 'text-sm font-semibold text-white',
  body: 'text-sm text-slate-300 font-normal',
  caption: 'text-xs text-slate-400',
  badge: 'text-[11px] font-bold uppercase tracking-wider',
};

export default { FONT_SIZE, FONT_WEIGHT, TYPOGRAPHY };
