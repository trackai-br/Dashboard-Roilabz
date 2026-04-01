/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Primary UI font — IBM Plex Sans
        sans:    ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // Mono / numbers — IBM Plex Mono (tabular figures)
        mono:    ['IBM Plex Mono', 'Fira Code', 'monospace'],
        // Legacy aliases (removed after component migration)
        display: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ROILabz Design Tokens — synced with globals.css CSS variables
        'color-bg-base':          '#0a0a0f',
        'color-bg-surface':       '#151822',
        'color-bg-surface-hover': '#1a1f2e',
        'color-bg-input':         '#1e2436',
        'color-bg-sidebar':       '#0f1117',
        'color-bg-popover':       '#1a1f2e',
        'color-bg-row-hover':     '#242b3d',

        'color-text-primary':     '#f0f0f5',
        'color-text-secondary':   '#8b8fa3',
        'color-text-tertiary':    '#565b6e',
        'color-text-disabled':    '#4a4d60',

        'color-accent':           '#39ff14',
        'color-accent-dim':       '#2cc611',
        'color-accent-bright':    '#4fff24',
        'color-accent-dark':      '#1a7a06',  // button primary bg

        'color-success':  '#39ff14',
        'color-warning':  '#ffb800',
        'color-danger':   '#ff2d78',
        'color-info':     '#00d4ff',

        // Legacy aliases
        'neon-green':   { DEFAULT: '#39ff14', dim: '#2cc611', bright: '#4fff24' },
        'neon-cyan':    { DEFAULT: '#00f0ff' },
        'neon-magenta': { DEFAULT: '#ff2d78' },
        'neon-amber':   { DEFAULT: '#ffb800' },
        'neon-purple':  { DEFAULT: '#a100f2' },
        'bg-deepest':   '#0a0a0f',
        'bg-page':      '#0a0a0f',
        'bg-sidebar':   '#0f1117',
        'bg-card':      '#151822',
        'bg-card-hover':'#1a1f2e',
        'bg-input':     '#1e2436',
        'bg-row-hover': '#242b3d',
        'bg-popover':   '#1a1f2e',
        'text-primary':   '#f0f0f5',
        'text-secondary': '#8b8fa3',
        'text-tertiary':  '#565b6e',
        'success':        '#39ff14',
        'warning':        '#ffb800',
        'danger':         '#ff2d78',
        'info':           '#00d4ff',
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
        'card-hover':'0 4px 12px rgba(0,0,0,0.4)',
        elevated:   '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        'accent-subtle': '0 0 0 3px rgba(57,255,20,0.08)',
        'accent':        '0 0 12px rgba(57,255,20,0.25)',
        'primary-glow':  '0 0 12px rgba(26,122,6,0.35)',
      },
      borderRadius: {
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        pill: '20px',
        // Legacy
        card:  '8px',
        modal: '8px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['12px', { lineHeight: '18px' }],
        base:  ['13px', { lineHeight: '20px' }],
        md:    ['14px', { lineHeight: '20px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '26px' }],
        '2xl': ['22px', { lineHeight: '30px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
