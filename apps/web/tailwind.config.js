/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#05070A',
        surface: '#0C1018',
        'surface-border': '#1C2333',
        sidebar: '#080A0F',
        accent: '#00D4FF',
        success: '#00FF88',
        warning: '#FFB800',
        error: '#FF4455',
        'text-muted': '#4A5568',
        'text-body': '#8892A4',
        'text-bright': '#E2E8F0',
      },
      fontFamily: {
        mono: ["'DM Mono'", 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};
