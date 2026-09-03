import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PhotoStudio from './pages/PhotoStudio.jsx'
import Catalogue from './pages/Catalogue.jsx'
import Pricing from './pages/Pricing.jsx'
import BusinessManager from './pages/BusinessManager.jsx'
import Products from './pages/Products.jsx'
import Digitalise from './pages/Digitalise.jsx'
import Store from './pages/Store.jsx'
import MarketLinkage from './pages/MarketLinkage.jsx'
import Profile from './pages/Profile.jsx'

// Pages that show the app header + bottom navigation (the "logged in" shell).
// Landing/Login/Register are full-screen without this chrome.
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'My Products',
  '/photo-studio': 'AI Photo Studio',
  '/catalogue': 'AI Catalogue',
  '/pricing': 'Smart Pricing',
  '/business-manager': 'AI Business Manager',
  '/digitalise': 'Digitalise My Business',
  '/store': 'My Digital Store',
  '/market-linkage': 'Market Opportunities',
  '/profile': 'Profile & Settings',
}

function AppShell({ children }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'ShilpSetu'
  return (
    <div className="min-h-screen bg-ivory pb-16">
      <Header title={title} />
      <main>{children}</main>
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/photo-studio" element={<Protected><PhotoStudio /></Protected>} />
      <Route path="/catalogue" element={<Protected><Catalogue /></Protected>} />
      <Route path="/pricing" element={<Protected><Pricing /></Protected>} />
      <Route path="/business-manager" element={<Protected><BusinessManager /></Protected>} />
      <Route path="/digitalise" element={<Protected><Digitalise /></Protected>} />
      <Route path="/store" element={<Protected><Store /></Protected>} />
      <Route path="/market-linkage" element={<Protected><MarketLinkage /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
    </Routes>
  )
}
