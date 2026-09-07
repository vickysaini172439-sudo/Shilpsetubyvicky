import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import AddFab from './components/AddFab.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import { useLanguage } from './i18n/LanguageContext.jsx'

import Landing from './pages/Landing.jsx'
import ChooseLanguage from './pages/ChooseLanguage.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PhotoStudio from './pages/PhotoStudio.jsx'
import Catalogue from './pages/Catalogue.jsx'
import Pricing from './pages/Pricing.jsx'
import BusinessManager from './pages/BusinessManager.jsx'
import Products from './pages/Products.jsx'
import Digitalise from './pages/Digitalise.jsx'
import Store from './pages/Store.jsx'
import PublicStore from './pages/PublicStore.jsx'
import MarketLinkage from './pages/MarketLinkage.jsx'
import Profile from './pages/Profile.jsx'
import Help from './pages/Help.jsx'

// Pages that show the app header + bottom navigation (the "logged in" shell).
// Landing/Login/Register/PublicStore are full-screen without this chrome -
// PublicStore especially, since a visitor viewing it isn't logged in at all.
//
// These map to translation keys rather than literal words, so the header
// follows whichever language the artisan chose.
const pageTitleKeys = {
  '/dashboard': 'page.dashboard',
  '/products': 'page.products',
  '/photo-studio': 'page.photoStudio',
  '/catalogue': 'page.catalogue',
  '/pricing': 'page.pricing',
  '/business-manager': 'page.businessManager',
  '/digitalise': 'page.digitalise',
  '/my-store': 'page.myStore',
  '/market-linkage': 'page.marketLinkage',
  '/profile': 'page.profile',
}

function AppShell({ children }) {
  const location = useLocation()
  const { t } = useLanguage()
  const key = pageTitleKeys[location.pathname]
  const title = key ? t(key) : 'ShilpSetu'
  return (
    <div className="min-h-screen bg-ivory pb-16">
      <Header title={title} />
      {/* Keyed on the path so React treats each screen as a new element and
          replays the entrance animation on every navigation. Only <main>
          animates - the header, bottom nav and add button deliberately stay
          still, so the chrome feels fixed and only the content moves, the
          way a native app behaves. */}
      <main key={location.pathname} className="page-in">
        {children}
      </main>
      <AddFab />
      <BottomNav />
    </div>
  )
}

// Shorthand so every protected route doesn't repeat PrivateRoute+AppShell.
function Protected({ children }) {
  return (
    <PrivateRoute>
      <AppShell>{children}</AppShell>
    </PrivateRoute>
  )
}

/**
 * Sends a brand-new visitor to the language question before they see
 * anything else, then never asks again once they have answered.
 *
 * It wraps only the landing screen, not the whole app: someone opening a
 * shared storefront link, or coming back to /login directly, should not be
 * interrupted by a settings question.
 */
function LanguageGate({ children }) {
  const { hasChosen } = useLanguage()
  if (!hasChosen) return <Navigate to="/language" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LanguageGate>
            <Landing />
          </LanguageGate>
        }
      />
      {/* Asked once, before account creation - and reachable again later
          from Profile & Settings if they want to switch. */}
      <Route path="/language" element={<ChooseLanguage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Public storefront - anyone with the link/QR code can view this, no login needed */}
      <Route path="/store/:slug" element={<PublicStore />} />

      {/* Help & Support - reachable logged in or logged out, so it can't gate on Protected */}
      <Route path="/help" element={<Help />} />

      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/photo-studio" element={<Protected><PhotoStudio /></Protected>} />
      <Route path="/catalogue" element={<Protected><Catalogue /></Protected>} />
      <Route path="/pricing" element={<Protected><Pricing /></Protected>} />
      <Route path="/business-manager" element={<Protected><BusinessManager /></Protected>} />
      <Route path="/digitalise" element={<Protected><Digitalise /></Protected>} />
      <Route path="/my-store" element={<Protected><Store /></Protected>} />
      <Route path="/market-linkage" element={<Protected><MarketLinkage /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
    </Routes>
  )
}
