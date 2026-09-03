import { NavLink } from 'react-router-dom'

// Simple icon-with-label bottom navigation bar.
// This is what makes the app feel like a mobile app instead of a website.
const navItems = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/store', label: 'My Store', icon: '🏪' },
  { to: '/business-manager', label: 'AI Manager', icon: '💬' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-10">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-xs flex-1 h-full ${
              isActive ? 'text-forest font-semibold' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
