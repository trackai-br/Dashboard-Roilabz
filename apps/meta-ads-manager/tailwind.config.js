/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // NEON DASHBOARD Palette — synced with globals.css CSS variables
        'neon-green': {
          DEFAULT: '#39ff14',
          dim: '#2cc611',
          bright: '#4fff24',
        },
        'neon-cyan': {
          DEFAULT: '#00f0ff',
          dim: '#00d4e8',
        },
        'neon-magenta': {
          DEFAULT: '#ff2d78',
          dim: '#e8005c',
        },
        'neon-amber': {
          DEFAULT: '#ffb800',
          dim: '#e8a500',
        },
        'neon-purple': {
          DEFAULT: '#a100f2',
          dim: '#8b00d4',
        },
        // Backgrounds — layered depth system
        'bg-deepest': '#0a0a0f',
        'bg-page': '#0a0a0f',
        'bg-sidebar': '#0f1117',
        'bg-card': '#151822',
        'bg-card-hover': '#1a1f2e',
        'bg-input': '#1e2436',
        'bg-row-hover': '#242b3d',
        'bg-popover': '#1a1f2e',
        // Text colors
        'text-primary': '#f0f0f5',
        'text-secondary': '#8b8fa3',
        'text-tertiary': '#565b6e',
        // Semantic
        success: '#39ff14',
        warning: '#ffb800',
        danger: '#ff2d78',
        info: '#00d4ff',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4)',
        elevated: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        'neon-subtle': '0 0 0 3px rgba(57,255,20,0.08)',
        neon: '0 0 16px rgba(57,255,20,0.25)',
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
        pill: '9999px',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
