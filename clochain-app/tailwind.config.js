/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#111111',
        surface: '#f7f7f7',
      },
    },
  },
  plugins: [],
}
