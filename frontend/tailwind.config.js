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
        // Background colour. History: warm off-white (#FAF7F0) -> sky blue
        // (#BEE7F7, didn't work - a cool blue fights against the warm
        // earthy craft palette below it: forest green, terracotta,
        // sandy gold) -> this warm peach-cream, a lightened tint of
        // terracotta itself, so the background now belongs to the same
        // warm family as every accent colour instead of clashing with it.
        // Kept the name "ivory" rather than renaming the class across
        // every page (bg-ivory is used ~15 places) - Tailwind reads the
        // colour from here everywhere it's used, one line updates the
        // whole app's background consistently.
        ivory: '#FBE8DC',
        charcoal: '#252525',
      },
    },
  },
  plugins: [],
}
