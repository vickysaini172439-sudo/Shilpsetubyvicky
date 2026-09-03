import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'

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
// Landing/Login/Register are full-screen without the app chrome.
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
      <Route path="/products" element={<AppShell><Products /></AppShell>} />
      <Route path="/photo-studio" element={<AppShell><PhotoStudio /></AppShell>} />
      <Route path="/catalogue" element={<AppShell><Catalogue /></AppShell>} />
      <Route path="/pricing" element={<AppShell><Pricing /></AppShell>} />
      <Route path="/business-manager" element={<AppShell><BusinessManager /></AppShell>} />
      <Route path="/digitalise" element={<AppShell><Digitalise /></AppShell>} />
      <Route path="/store" element={<AppShell><Store /></AppShell>} />
      <Route path="/market-linkage" element={<AppShell><MarketLinkage /></AppShell>} />
      <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
    </Routes>
  )
}
