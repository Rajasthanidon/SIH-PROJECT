export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#c9a2271a',
          100: '#c9a22733',
          200: '#c9a2274d',
          300: '#c9a22766',
          400: '#D8B63F',
          500: '#C9A227',
          600: '#9E7C16',
          700: '#6d560f',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
