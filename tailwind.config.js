/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f1',
          100: '#dcebe0',
          200: '#bbd7c3',
          300: '#8fbb9e',
          400: '#5e9774',
          500: '#3d7a57',
          600: '#2c6144',
          700: '#234d37',
          800: '#1d3d2d',
          900: '#163024',
        },
        mint: {
          50: '#effaf3',
          100: '#d8f3e1',
          200: '#b3e6c8',
          300: '#80d3a7',
          400: '#4fba85',
          500: '#2ba36b',
          600: '#1f8657',
          700: '#1b6c48',
          800: '#18563b',
          900: '#154731',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans TC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,48,36,0.06), 0 1px 2px rgba(16,48,36,0.04)',
        cardHover: '0 8px 24px rgba(16,48,36,0.08), 0 2px 6px rgba(16,48,36,0.06)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'grow-bar': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'grow-bar': 'grow-bar 0.9s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
