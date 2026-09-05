import CategoryBackground from './CategoryBackground.jsx'
import { themeFor } from '../theme/categoryTheme.js'

// Ready-made themed hero/banner block: category-colour gradient + the
// matching SVG texture from CategoryBackground + a large faded emoji
// watermark, with real content (passed as children) layered on top. Used
// on the Dashboard (artisan's own craft) and the public storefront
// (buyer-facing) so both feel specific to what the artisan actually makes,
// instead of a generic green header.
export default function CategoryBanner({ category, className = '', children }) {
  const theme = themeFor(category)

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}cc 100%)`,
      }}
    >
      <CategoryBackground category={category} />
      <span
        aria-hidden="true"
        className="absolute -right-4 -bottom-6 text-[7rem] leading-none opacity-20 select-none pointer-events-none"
      >
        {theme.emoji}
      </span>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
