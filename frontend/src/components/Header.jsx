import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'
import { themeFor } from '../theme/categoryTheme.js'

export default function Header({ title }) {
  const { user } = useAuth()
  const initial = (user?.name || 'A').trim().charAt(0).toUpperCase()
  const avatarColor = user?.business?.craft_category
    ? themeFor(user.business.craft_category).color
    : '#C96B4B'

  return (
    <header className="sticky top-0 z-10 bg-forest text-white shadow-md">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {user && (
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 border-white/40"
              style={{ backgroundColor: avatarColor }}
            >
              {initial}
            </span>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        <Link
          to="/help"
          aria-label="Help & Support"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-sm flex-shrink-0 ml-3"
        >
          ?
        </Link>
      </div>
      <div className="h-[3px] bg-gradient-to-r from-terracotta via-sand to-forest" />
    </header>
  )
}
