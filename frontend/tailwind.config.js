/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a5c38',
          50:  '#f0f7f3',
          100: '#d8ede2',
          200: '#aed9bf',
          300: '#79bf98',
          400: '#44a470',
          500: '#27865a',
          600: '#1a5c38',
          700: '#154a2e',
          800: '#0f3320',
          900: '#092015',
          950: '#040e0a',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: {
          50:  '#f7faf9',
          100: '#eef4f1',
          200: '#d5e6dc',
          800: '#152b1f',
          900: '#0d1f17',
          950: '#070f0b',
        },
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-left': {
          '0%':   { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-8px) rotate(1deg)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(26,92,56,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(26,92,56,0.6)' },
        },
        'border-run': {
          '0%':   { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        'ticker': {
          '0%':   { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
      },
      animation: {
        'fade-up':          'fade-up 0.6s ease-out forwards',
        'fade-up-d1':       'fade-up 0.6s 0.1s ease-out both',
        'fade-up-d2':       'fade-up 0.6s 0.2s ease-out both',
        'fade-up-d3':       'fade-up 0.6s 0.3s ease-out both',
        'fade-up-d4':       'fade-up 0.6s 0.4s ease-out both',
        'fade-up-d5':       'fade-up 0.6s 0.5s ease-out both',
        'fade-in':          'fade-in 0.5s ease-out forwards',
        'slide-left':       'slide-left 0.7s 0.2s ease-out both',
        'float':            'float 5s ease-in-out infinite',
        'float-slow':       'float-slow 7s ease-in-out infinite',
        'shimmer':          'shimmer 2s linear infinite',
        'gradient-x':       'gradient-x 6s ease infinite',
        'pulse-ring':       'pulse-ring 1.5s ease-out infinite',
        'count-up':         'count-up 0.5s 0.3s ease-out both',
        'glow':             'glow 2s ease-in-out infinite',
        'ticker':           'ticker 20s linear infinite',
      },
      backgroundSize: {
        '200%': '200%',
        '400%': '400%',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(26,92,56,0.25)',
        'glow':     '0 0 24px rgba(26,92,56,0.35)',
        'glow-lg':  '0 0 48px rgba(26,92,56,0.45)',
        'glow-gold':'0 0 24px rgba(245,158,11,0.35)',
        'card':     '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.1)',
        'deep':     '0 24px 80px rgba(0,0,0,0.2)',
        'inner-brand': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
};
