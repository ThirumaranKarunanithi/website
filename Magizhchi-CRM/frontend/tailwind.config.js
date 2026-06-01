/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF7A00',   // orange — primary actions / CTAs
          primaryDark: '#E86A00',
          highlight: '#FFC400',  // yellow — highlights / warnings
          info: '#4FC3F7',       // light blue — secondary / info
          navy: '#0D3B66',       // dark blue — nav / primary text
          navyDeep: '#082544',
          surface: '#FFFFFF',
        },
        accent: 'var(--brand-accent, #FF7A00)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -4px rgba(13, 59, 102, 0.12)',
        glow: '0 8px 30px -6px rgba(255, 122, 0, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
