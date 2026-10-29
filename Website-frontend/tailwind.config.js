import { COLORS } from './src/constants/colors.js';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: COLORS.background,
          surface: COLORS.surface,
          hover: COLORS.surfaceHover,
          input: COLORS.surfaceInput,
          border: COLORS.border,
          borderMedium: COLORS.borderMedium,
          borderLight: COLORS.borderLight,
          primary: COLORS.primary,
          primaryDark: COLORS.primaryDark,
          accent: COLORS.accent,
          accentHover: COLORS.accentHover,
          accentLight: COLORS.accentLight,
          textPrimary: COLORS.textPrimary,
          textSecondary: COLORS.textSecondary,
          textMuted: COLORS.textMuted,
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
