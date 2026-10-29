/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        popover: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.2', transform: 'scale(0.85)' },
        },
      },
      animation: {
        popover: 'popover 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        fadeIn: 'fadeIn 0.15s ease-out',
        slideInRight: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        blink: 'blink 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
