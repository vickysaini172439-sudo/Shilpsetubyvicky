import { Link } from 'react-router-dom'
import { CATEGORY_THEMES } from '../theme/categoryTheme.js'

// Small showcase strip so a first-time visitor sees, at a glance, that
// ShilpSetu isn't tied to one craft - it's built for weavers, potters,
// wood carvers and every other category in CATEGORY_THEMES alike.
function CategoryShowcase() {
  const entries = Object.entries(CATEGORY_THEMES).filter(([name]) => name !== 'Other')
  return (
    <div className="w-full max-w-md mt-10">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Built for every craft</p>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
        {entries.map(([name, theme]) => (
          <div
            key={name}
            className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-xl text-white shadow-sm"
            style={{ backgroundColor: theme.color }}
            title={name}
          >
            <span className="text-2xl leading-none">{theme.emoji}</span>
            <span className="text-[10px] text-center leading-tight px-1 opacity-90">{name.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory px-6 py-10 text-center">
      <div className="text-6xl mb-4">🧵</div>
      <h1 className="text-3xl font-bold text-forest mb-2">ShilpSetu</h1>
      <p className="text-charcoal mb-8">
        Your Virtual Business Manager — turning your craft into a digital business.
      </p>
      <Link
        to="/register"
        className="bg-terracotta text-white px-6 py-3 rounded-full font-semibold shadow-md mb-3 w-full max-w-xs"
      >
        Get Started
      </Link>
      <Link to="/login" className="text-forest font-medium underline">
        Already have an account? Log in
      </Link>

      <CategoryShowcase />

      <Link to="/help" className="text-xs text-gray-400 underline mt-10">
        Need help or have a question? Contact us
      </Link>
    </div>
  )
}
