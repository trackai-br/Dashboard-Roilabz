/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#0a0e27',
          900: '#0f1535',
          850: '#1a1f3a',
          800: '#1e2749',
          700: '#2a3154',
        },
        growth: {
          50: '#f0fdf4',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        energy: {
          50: '#f0f9ff',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        primary: '#3B82F6',
        secondary: '#10B981',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.2)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.2)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
