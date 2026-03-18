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
        // NEON DASHBOARD Palette
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
          DEFAULT: '#ff006e',
          dim: '#e8005c',
        },
        'neon-amber': {
          DEFAULT: '#ffb703',
          dim: '#ff9800',
        },
        'neon-purple': {
          DEFAULT: '#a100f2',
          dim: '#8b00d4',
        },
        // Backgrounds
        'deepest': '#0a0a0f',
        'dark': '#1a1a2e',
        'darker': '#16213e',
        page: '#0a0a0f',
        card: '#1a1a2e',
        input: '#16213e',
        'table-alt': '#141429',
        // Text colors
        primary: '#f0f0f0',
        secondary: '#a8a8b8',
        tertiary: '#707080',
        // Semantic
        success: '#00ff88',
        warning: '#ffb703',
        danger: '#ff3333',
        info: '#00d4ff',
        // Sidebar
        'sidebar-text': '#e8e8f0',
        'sidebar-active': '#39ff14',
        // Table
        'table-header': '#16213e',
      },
      boxShadow: {
        card: '0 4px 12px rgba(57,255,20,0.08)',
        'card-hover': '0 8px 24px rgba(57,255,20,0.15)',
        elevated: '0 12px 32px rgba(57,255,20,0.2)',
        neon: '0 0 20px rgba(57,255,20,0.4)',
        'neon-cyan': '0 0 20px rgba(0,240,255,0.3)',
      },
      borderRadius: {
        card: '12px',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
