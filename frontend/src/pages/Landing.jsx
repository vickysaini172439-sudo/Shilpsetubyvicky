import { Link } from 'react-router-dom'
import { CATEGORY_THEMES } from '../theme/categoryTheme.js'
import { LogoMark, CraftScene, WovenBand, BlockPrintBackdrop } from '../components/CraftArt.jsx'

// Small showcase strip so a first-time visitor sees, at a glance, that
// ShilpSetu isn't tied to one craft - it's built for weavers, potters,
// wood carvers and every other category in CATEGORY_THEMES alike.
function CategoryShowcase() {
  const entries = Object.entries(CATEGORY_THEMES).filter(([name]) => name !== 'Other')
  return (
    <div className="w-full max-w-md mt-10">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Built for every craft</p>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
        {entries.map(([name, theme]) => (
          <div
            key={name}
            className="press flex-shrink-0 flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-xl text-white shadow-sm"
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
    <div className="page-in min-h-screen bg-ivory">
      {/* --- Hero -------------------------------------------------------
          The dark woven panel carries the brand, and the illustration
          underneath shows what the app is actually for - a pot, a folded
          textile and a thread - without needing a single photograph. */}
      <div className="relative overflow-hidden craft-weave craft-weave-animated rounded-b-[2rem] px-6 pt-12 pb-10 shadow-lg">
        <div className="absolute inset-0 pointer-events-none">
          <BlockPrintBackdrop />
        </div>

        <div className="relative flex flex-col items-center text-center stagger">
          <LogoMark size={84} animated />

          <h1 className="text-3xl font-bold text-ivory mt-3">ShilpSetu</h1>

          <p className="text-ivory/80 mt-2 max-w-xs leading-relaxed">
            Your Virtual Business Manager — turning your craft into a digital business.
          </p>

          <WovenBand className="w-32 h-3 mt-4" light />

          <CraftScene className="w-full max-w-sm mt-4" />
        </div>
      </div>

      {/* --- Actions ---------------------------------------------------- */}
      <div className="px-6 pt-8 pb-12 flex flex-col items-center text-center">
        <div className="w-full max-w-xs stagger">
          <Link
            to="/register"
            className="press block bg-terracotta text-white px-6 py-3 rounded-full font-semibold shadow-md w-full"
          >
            Get Started
          </Link>

          <Link
            to="/login"
            className="press block text-forest font-medium underline mt-4"
          >
            Already have an account? Log in
          </Link>
        </div>

        <CategoryShowcase />

        <Link to="/help" className="text-xs text-gray-500 underline mt-10">
          Need help or have a question? Contact us
        </Link>
      </div>
    </div>
  )
}
