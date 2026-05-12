/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
        },
        surface: {
          DEFAULT: '#09090b',
          card:    '#111115',
          elevated:'#18181d',
          border:  '#27272a',
          muted:   '#3f3f46',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(99, 102, 241, 0.35)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.30)',
        'glow-red':   '0 0 20px rgba(239, 68, 68, 0.30)',
        'glow-orange':'0 0 20px rgba(249, 115, 22, 0.30)',
        'glow-sm':    '0 0 10px rgba(99, 102, 241, 0.20)',
        'card':       '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'gradient-page':  'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent)',
        'gradient-card':  'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
      },
      animation: {
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'slide-up':     'slideUp 0.22s ease-out',
        'fade-in':      'fadeIn 0.3s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 25px rgba(99,102,241,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to:   { transform: 'translateY(0)',    opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
