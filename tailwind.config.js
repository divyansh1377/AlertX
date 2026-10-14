/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0B0C',
          surface: '#141416',
          card: '#1C1C1F',
          elevated: '#252528',
          textPrimary: '#F5F5F5',
          textSecondary: '#B5B5B8',
          textMuted: '#858589',
          subtle: 'rgba(255, 255, 255, 0.12)',
          hoverSurface: 'rgba(255, 255, 255, 0.08)',
          hoverBorder: 'rgba(255, 255, 255, 0.25)',
          focus: '#E5E5E5',
        },
        safety: {
          normal: '#10B981',    // green
          advisory: '#EAB308',  // yellow
          warning: '#F97316',   // orange
          critical: '#EF4444',  // red
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Plus Jakarta Sans"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        'xs': '6px',
        'sm': '8px',
        'md': '12px',
        'card': '16px',
        'panel': '20px',
        'modal': '24px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '180': '180ms',
        '220': '220ms',
        '260': '260ms',
      },
    },
  },
  plugins: [],
}
