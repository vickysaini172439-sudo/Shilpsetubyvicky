import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'
import { listProducts, getReadiness } from '../services/api.js'

const actions = [
  { to: '/products', label: 'Add Product', icon: '➕' },
  { to: '/photo-studio', label: 'AI Photo Studio', icon: '📷' },
  { to: '/catalogue', label: 'Create Catalogue', icon: '📝' },
  { to: '/pricing', label: 'Smart Pricing', icon: '💰' },
  { to: '/business-manager', label: 'AI Business Manager', icon: '💬' },
  { to: '/digitalise', label: 'Digitalise My Business', icon: '🌐' },
  { to: '/my-store', label: 'My Digital Store', icon: '🏪' },
  { to: '/market-linkage', label: 'Market Linkage', icon: '🔗' },
]

export default function Dashboard() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 })
  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listProducts(token), getReadiness(token)])
      .then(([products, readinessData]) => {
        setStats({
          total: products.length,
          published: products.filter((p) => p.status === 'published').length,
          draft: products.filter((p) => p.status === 'draft').length,
        })
        setReadiness(readinessData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold text-forest mb-1">
        Welcome, {user?.name || 'Artisan'} 👋
      </h2>
      <p className="text-gray-600 mb-5">{user?.business?.business_name}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-2xl font-bold text-forest">{loading ? '–' : stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Products</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-2xl font-bold text-forest">{loading ? '–' : stats.published}</p>
          <p className="text-xs text-gray-500 mt-1">Published</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-2xl font-bold text-forest">{loading ? '–' : stats.draft}</p>
          <p className="text-xs text-gray-500 mt-1">Drafts</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <p className="text-sm text-gray-500 mb-1">Digital Readiness Score</p>
        <p className="text-3xl font-bold text-terracotta">{loading ? '–' : `${readiness?.score ?? 0}%`}</p>

        {readiness && (
          <div className="mt-3 space-y-1">
            {readiness.checklist.map((c) => (
              <p key={c.label} className="text-xs flex items-center gap-2">
                <span>{c.done ? '✅' : '⬜'}</span>
                <span className={c.done ? 'text-gray-500' : 'text-charcoal'}>{c.label}</span>
              </p>
            ))}
          </div>
        )}
        {readiness?.next_steps?.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Complete these {readiness.next_steps.length} step(s) to improve your score.
          </p>
        )}
      </div>

      <h3 className="font-semibold text-charcoal mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center text-center gap-2 active:scale-95 transition"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm font-medium text-charcoal">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
