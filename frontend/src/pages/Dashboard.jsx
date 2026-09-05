import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'
import { listProducts, getReadiness, getBusinessInsight, imageUrl } from '../services/api.js'
import CategoryBanner from '../components/CategoryBanner.jsx'
import { CATEGORY_THEMES } from '../theme/categoryTheme.js'

// Every feature the app offers, each with its own accent colour and a
// one-line description. This single list drives both the "stories" style
// quick-access strip and the "Explore ShilpSetu" grid below it, so the
// dashboard stays in sync automatically if a feature is ever added.
const FEATURES = [
  { to: '/products', label: 'My Products', icon: '📦', color: '#C96B4B', desc: 'Add, edit and manage your listings' },
  { to: '/photo-studio', label: 'Photo Studio', icon: '📷', color: '#6E4A8E', desc: 'AI-enhance your product photos' },
  { to: '/catalogue', label: 'AI Catalogue', icon: '📝', color: '#B5533C', desc: 'Auto-write titles & descriptions' },
  { to: '/pricing', label: 'Smart Pricing', icon: '💰', color: '#B8923F', desc: 'Fair, cost-based price suggestions' },
  { to: '/business-manager', label: 'AI Manager', icon: '💬', color: '#1F4D3A', desc: 'Ask about product, business or budget' },
  { to: '/digitalise', label: 'Digitalise', icon: '🌐', color: '#4C7A4F', desc: 'Step-by-step to go fully online' },
  { to: '/my-store', label: 'My Store', icon: '🏪', color: '#A83D5E', desc: 'Your public storefront & QR code' },
  { to: '/market-linkage', label: 'Market Linkage', icon: '🔗', color: '#71706B', desc: 'Discover buyers & opportunities' },
]

function StoryCircle({ feature }) {
  return (
    <Link to={feature.to} className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center p-[3px]"
        style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}55)` }}
      >
        <span className="w-full h-full rounded-full bg-ivory flex items-center justify-center text-2xl">
          {feature.icon}
        </span>
      </span>
      <span className="text-[10px] text-center leading-tight text-charcoal truncate w-16">{feature.label}</span>
    </Link>
  )
}

function FeatureCard({ feature, badge }) {
  return (
    <Link to={feature.to} className="fade-in bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition">
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl text-white"
        style={{ backgroundColor: feature.color }}
      >
        {feature.icon}
      </span>
      <span className="text-sm font-semibold text-charcoal">{feature.label}</span>
      <span className="text-xs text-gray-500 leading-snug">{feature.desc}</span>
      {badge && (
        <span
          className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full self-start"
          style={{ backgroundColor: feature.color }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

// A single card in the continuously-scrolling "Discover" strip - a small
// coloured banner per feature, always in motion (see .marquee-track in
// index.css) so the dashboard never looks like a static page of links.
function FeatureBannerCard({ feature }) {
  return (
    <Link
      to={feature.to}
      className="relative w-44 h-24 rounded-2xl overflow-hidden flex-shrink-0 flex flex-col justify-end p-3 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}bb 100%)` }}
    >
      <span aria-hidden="true" className="absolute -right-2 -top-3 text-5xl opacity-25 select-none">
        {feature.icon}
      </span>
      <span className="relative text-sm font-semibold leading-tight">{feature.label}</span>
      <span className="relative text-[10px] opacity-90 leading-snug mt-0.5">{feature.desc}</span>
    </Link>
  )
}

// The "proactive AI" card - unlike every other AI feature in the app,
// nobody has to ask it anything. It quietly looks at the artisan's real
// data (product count, drafts, prices, readiness score) and surfaces one
// specific, useful observation the moment the dashboard loads. Fetched
// separately from the rest of the dashboard's data (its own loading
// state) since a live AI call can take a beat longer than the plain
// product/readiness lookups, and the rest of the page shouldn't wait on it.
function InsightCard({ insight, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex gap-3 items-start">
        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton h-3 rounded-full w-3/4" />
          <div className="skeleton h-3 rounded-full w-1/2" />
        </div>
      </div>
    )
  }
  if (!insight?.tip) return null
  return (
    <div
      className="fade-in rounded-2xl p-4 shadow-sm mb-6 flex gap-3 items-start text-white"
      style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #4C7A4F 100%)' }}
    >
      <span
        aria-hidden="true"
        className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0"
      >
        ✨
      </span>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-wide text-white/70 font-semibold mb-1">
          AI Insight {insight.ai_mode === 'demo' ? '· Demo Mode' : insight.ai_provider_label ? `· ${insight.ai_provider_label}` : ''}
        </p>
        <p className="text-sm leading-snug">{insight.tip}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 })
  const [recentProducts, setRecentProducts] = useState([])
  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState(null)
  const [insightLoading, setInsightLoading] = useState(true)

  useEffect(() => {
    Promise.all([listProducts(token), getReadiness(token)])
      .then(([products, readinessData]) => {
        setStats({
          total: products.length,
          published: products.filter((p) => p.status === 'published').length,
          draft: products.filter((p) => p.status === 'draft').length,
        })
        // Most-recently-added first, for a small "what have I been working on" reel.
        setRecentProducts([...products].reverse().slice(0, 6))
        setReadiness(readinessData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    getBusinessInsight(token)
      .then(setInsight)
      .catch(() => setInsight(null))
      .finally(() => setInsightLoading(false))
  }, [token])

  // Badges turn the static feature grid into a "dynamic dashboard" - each
  // tile reflects the artisan's own real data instead of just being a link.
  function badgeFor(feature) {
    if (loading) return null
    if (feature.to === '/products') {
      return stats.total ? `${stats.total} item${stats.total === 1 ? '' : 's'}` : 'Add your first'
    }
    if (feature.to === '/my-store') {
      return stats.published ? `${stats.published} live` : null
    }
    if (feature.to === '/digitalise' && readiness) {
      return `${readiness.score}% ready`
    }
    return null
  }

  return (
    <div>
      <CategoryBanner category={user?.business?.craft_category} className="px-5 py-6 mb-5">
        <h2 className="text-xl font-bold text-white mb-1">
          Welcome, {user?.name || 'Artisan'} 👋
        </h2>
        <p className="text-white/85">{user?.business?.business_name}</p>
        {user?.business?.craft_category && (
          <p className="text-white/70 text-xs mt-1">{user.business.craft_category}</p>
        )}
      </CategoryBanner>

      <div className="px-5">
        <InsightCard insight={insight} loading={insightLoading} />

        <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Discover what you can do</p>
        <div className="overflow-hidden mb-6">
          <div className="flex gap-3 marquee-track">
            {[...FEATURES, ...FEATURES].map((f, i) => (
              <FeatureBannerCard key={`${f.to}-${i}`} feature={f} />
            ))}
          </div>
        </div>

        <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Quick access</p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-6 no-scrollbar">
          {FEATURES.map((f) => (
            <StoryCircle key={f.to} feature={f} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm text-center">
                <div className="skeleton h-7 rounded-lg mx-auto w-10 mb-2" />
                <div className="skeleton h-3 rounded-full mx-auto w-12" />
              </div>
            ))
          ) : (
            <>
              <div className="fade-in bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-forest">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Products</p>
              </div>
              <div className="fade-in bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-forest">{stats.published}</p>
                <p className="text-xs text-gray-500 mt-1">Published</p>
              </div>
              <div className="fade-in bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-forest">{stats.draft}</p>
                <p className="text-xs text-gray-500 mt-1">Drafts</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <p className="text-sm text-gray-500 mb-1">Digital Readiness Score</p>
          {loading ? (
            <div className="skeleton h-8 rounded-lg w-20 mt-1" />
          ) : (
            <p className="fade-in text-3xl font-bold text-terracotta">{`${readiness?.score ?? 0}%`}</p>
          )}

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

        {recentProducts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-charcoal">Recent Products</h3>
              <Link to="/products" className="text-xs text-forest font-medium">See all</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-6 no-scrollbar">
              {recentProducts.map((p) => {
                const theme = CATEGORY_THEMES[p.category] || CATEGORY_THEMES.Other
                return (
                  <Link key={p.id} to="/products" className="fade-in w-28 flex-shrink-0 bg-white rounded-xl shadow-sm overflow-hidden">
                    {p.image_url ? (
                      <img src={imageUrl(p.image_url)} alt={p.name} className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center text-3xl" style={{ backgroundColor: theme.color }}>
                        {theme.emoji}
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-charcoal truncate">{p.name}</p>
                      {p.price != null && <p className="text-[11px] text-terracotta font-semibold">₹{p.price}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        <h3 className="font-semibold text-charcoal mb-3">Explore ShilpSetu</h3>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.to} feature={f} badge={badgeFor(f)} />
          ))}
        </div>
      </div>
    </div>
  )
}
