/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#1F4D3A',
        terracotta: '#C96B4B',
        sand: '#D6A85F',
        ivory: '#FAF7F0',
        charcoal: '#252525',
      },
    },
  },
  plugins: [],
}
