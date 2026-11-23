/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          50: '#fff5f7',
          100: '#ffe4ea',
          200: '#fcccd7',
          300: '#f8a3b8',
          400: '#f27899',
          500: '#e54d76',
          600: '#d12f5a',
          pastel: '#f2c6d9',
          laptop: '#d9a8e0',
        },
        lavender: {
          50: '#faf7ff',
          100: '#f3ebff',
          200: '#e7d6ff',
          300: '#d4b3ff',
          400: '#b882ff',
          500: '#9d52f7',
          600: '#842fed',
          mist: '#c8b6ff',
        },
        peach: {
          50: '#fff7f2',
          100: '#ffede0',
          200: '#ffd7bf',
          300: '#ffb994',
          400: '#ff9266',
          500: '#f86e3d',
          glow: '#ffd8be',
        },
        dusk: {
          950: '#070810',
          900: '#0d0f1e',
          850: '#13162b',
          800: '#1b1f3c',
          700: '#282e58',
          600: '#3a427d',
          500: '#525eac',
        },
        gold: {
          300: '#f7e39f',
          400: '#e6c875',
          500: '#d4af37',
        },
        washi: {
          bg: '#faf6ee',
          card: 'rgba(250, 246, 238, 0.92)',
          border: '#e6dcbe',
        }
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', '"Noto Serif JP"', 'serif'],
        serif: ['"Playfair Display"', '"Noto Serif JP"', 'serif'],
        sans: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        jp: ['"Noto Serif JP"', 'serif'],
      },
      boxShadow: {
        'glow-pink': '0 0 35px -5px rgba(242, 120, 153, 0.35)',
        'glow-pink-lg': '0 0 55px -5px rgba(242, 120, 153, 0.5)',
        'glow-lavender': '0 0 35px -5px rgba(184, 130, 255, 0.35)',
        'glow-gold': '0 0 25px -3px rgba(230, 200, 117, 0.35)',
        'glass-card': '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
        'glass-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '32px',
        '3xl': '48px',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 10px rgba(242, 120, 153, 0.4))' },
          '50%': { opacity: '0.95', filter: 'drop-shadow(0 0 25px rgba(242, 120, 153, 0.8))' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
