import { NavLink } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext.jsx'

// Icon-forward tab bar - the active tab gets a solid colour chip behind
// its icon instead of just changing text colour, so it reads instantly
// at a glance instead of needing to be read.
//
// Labels are translation keys rather than words, so the bar follows the
// artisan's chosen language. The icons carry the meaning either way, which
// is exactly why an icon-forward bar was the right choice for a
// multilingual app.
const navItems = [
  { to: '/dashboard', labelKey: 'nav.home', icon: '🏠' },
  { to: '/products', labelKey: 'nav.products', icon: '📦' },
  { to: '/my-store', labelKey: 'nav.store', icon: '🏪' },
  { to: '/business-manager', labelKey: 'nav.aiChat', icon: '💬' },
  { to: '/profile', labelKey: 'nav.profile', icon: '👤' },
]

export default function BottomNav() {
  const { t } = useLanguage()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className="flex flex-col items-center justify-center text-xs flex-1 h-full">
          {({ isActive }) => (
            <>
              <span
                className={`text-xl leading-none w-9 h-9 flex items-center justify-center rounded-full transition ${
                  isActive ? 'bg-terracotta text-white' : 'text-gray-500'
                }`}
              >
                {item.icon}
              </span>
              <span className={`mt-0.5 truncate max-w-full px-0.5 ${isActive ? 'text-terracotta font-semibold' : 'text-gray-500'}`}>
                {t(item.labelKey)}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
