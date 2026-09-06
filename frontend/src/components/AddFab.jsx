import { Link, useLocation } from 'react-router-dom'

// Floating "+" button - the fastest way to add a new product from
// anywhere in the app, instead of navigating to Products first and
// looking for the right button there.
export default function AddFab() {
  const location = useLocation()
  if (location.pathname === '/products') return null // already on the add/list screen
  if (location.pathname === '/business-manager') return null // would overlap the chat input/send button

  return (
    <Link
      to="/products?new=1"
      aria-label="Add a new product"
      className="fixed right-4 bottom-20 z-20 w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl font-light shadow-lg active:scale-95 transition"
      style={{ background: 'linear-gradient(135deg, #C96B4B 0%, #B8923F 50%, #6E4A8E 100%)' }}
    >
      +
    </Link>
  )
}
