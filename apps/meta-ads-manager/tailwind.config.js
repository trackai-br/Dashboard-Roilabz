/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Sunset Boulevard Palette
        brand: {
          DEFAULT: '#e76f51',
          hover: '#d4603f',
          light: '#fce8e2',
          subtle: '#fdf4f1',
        },
        coral: {
          DEFAULT: '#f4a261',
          hover: '#e09050',
          light: '#fef3e2',
        },
        sand: {
          DEFAULT: '#e9c46a',
          light: '#fdf8e8',
          subtle: '#fefcf4',
        },
        teal: {
          DEFAULT: '#264653',
          light: '#2a4f5f',
          lighter: '#35606e',
        },
        // Page backgrounds
        page: '#faf8f5',
        'page-dark': '#0f0d0a',
        card: '#ffffff',
        'card-dark': '#1a1815',
        input: '#f5f3f0',
        'input-dark': '#2a2420',
        // Semantic colors
        success: '#2d9f6f',
        'success-bg': '#e8f7f0',
        warning: '#e9a23b',
        'warning-bg': '#fef6e4',
        danger: '#dc4446',
        'danger-bg': '#fde8e8',
        info: '#3b82f6',
        'info-bg': '#eff6ff',
        // Text layers
        primary: '#1a1815',
        'primary-dark': '#f5f3f0',
        secondary: '#6b6360',
        'secondary-dark': '#a89d98',
        tertiary: '#8b8480',
        'tertiary-dark': '#7a7570',
        // Sidebar
        'sidebar-text': '#f5f3f0',
        'sidebar-active': '#e9c46a',
        // Table
        'table-header': '#f4e4d4',
        'table-header-dark': '#2a2420',
        'table-row-alt': '#faf8f5',
        'table-row-alt-dark': '#1a1815',
      },
      boxShadow: {
        card: '0 1px 2px rgba(38,70,83,0.04)',
        'card-hover': '0 4px 12px rgba(38,70,83,0.06)',
        elevated: '0 8px 24px rgba(38,70,83,0.08)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
