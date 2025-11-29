/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'sans-serif'],
      },
      colors: {
        ink: '#111111',
        sand: '#f4efe9',
        beige: '#e7dfd2',
        pearl: '#fbfaf8',
        stone: '#d1c7bc',
        dusk: '#2a2a28',
      },
      letterSpacing: {
        wider: '0.08em',
      },
      boxShadow: {
        subtle: '0 25px 45px rgba(15, 14, 14, 0.08)',
      },
    },
  },
  plugins: [],
}
