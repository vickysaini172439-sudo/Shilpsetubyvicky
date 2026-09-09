import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'
import { listProducts, getReadiness, getBusinessInsight } from '../services/api.js'
import CategoryBanner from '../components/CategoryBanner.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

// Every feature the app offers, each with its own accent colour and a
// one-line description. This single list drives both the "stories" style
// quick-access strip and the "Explore ShilpSetu" grid below it, so the
// dashboard stays in sync automatically if a feature is ever added.
//
// Names and descriptions are translation KEYS, not words - which is what
// lets the Hinglish rule apply here: in Hinglish the feature names stay in
// English ("Photo Studio") while the description underneath switches to
// Hinglish ("AI se apni product photos ko professional banayein").
const FEATURES = [
  { to: '/products', labelKey: 'feature.products.label', descKey: 'feature.products.desc', icon: '📦', color: '#C96B4B' },
  { to: '/photo-studio', labelKey: 'feature.photoStudio.label', descKey: 'feature.photoStudio.desc', icon: '📷', color: '#6E4A8E' },
  { to: '/catalogue', labelKey: 'feature.catalogue.label', descKey: 'feature.catalogue.desc', icon: '📝', color: '#B5533C' },
  { to: '/pricing', labelKey: 'feature.pricing.label', descKey: 'feature.pricing.desc', icon: '💰', color: '#B8923F' },
  { to: '/business-manager', labelKey: 'feature.businessManager.label', descKey: 'feature.businessManager.desc', icon: '💬', color: '#1F4D3A' },
  { to: '/digitalise', labelKey: 'feature.digitalise.label', descKey: 'feature.digitalise.desc', icon: '🌐', color: '#4C7A4F' },
  { to: '/my-store', labelKey: 'feature.myStore.label', descKey: 'feature.myStore.desc', icon: '🏪', color: '#A83D5E' },
  { to: '/market-linkage', labelKey: 'feature.marketLinkage.label', descKey: 'feature.marketLinkage.desc', icon: '🔗', color: '#71706B' },
]

function StoryCircle({ feature, label }) {
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
      <span className="text-[10px] text-center leading-tight text-charcoal truncate w-16">{label}</span>
    </Link>
  )
}

function FeatureCard({ feature, label, desc, badge }) {
  return (
    <Link to={feature.to} className="fade-in bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition">
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl text-white"
        style={{ backgroundColor: feature.color }}
      >
        {feature.icon}
      </span>
      <span className="text-sm font-semibold text-charcoal">{label}</span>
      <span className="text-xs text-gray-500 leading-snug">{desc}</span>
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
function FeatureBannerCard({ feature, label, desc }) {
  return (
    <Link
      to={feature.to}
      className="relative w-44 h-24 rounded-2xl overflow-hidden flex-shrink-0 flex flex-col justify-end p-3 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}bb 100%)` }}
    >
      <span aria-hidden="true" className="absolute -right-2 -top-3 text-5xl opacity-25 select-none">
        {feature.icon}
      </span>
      <span className="relative text-sm font-semibold leading-tight">{label}</span>
      <span className="relative text-[10px] opacity-90 leading-snug mt-0.5">{desc}</span>
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
function InsightCard({ insight, loading, title }) {
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
          {title} {insight.ai_mode === 'demo' ? '· Demo Mode' : insight.ai_provider_label ? `· ${insight.ai_provider_label}` : ''}
        </p>
        <p className="text-sm leading-snug">{insight.tip}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const { t } = useLanguage()
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
  }, [token])

  // Fetched separately from the numbers above because it is the one thing
  // on this screen the AI writes, so it has to be re-asked when the
  // artisan changes the language it should be written in - otherwise
  // switching the app from Hindi to Hinglish left yesterday's Hindi tip
  // sitting on an otherwise Hinglish dashboard.
  useEffect(() => {
    setInsightLoading(true)
    getBusinessInsight(token)
      .then(setInsight)
      .catch(() => setInsight(null))
      .finally(() => setInsightLoading(false))
  }, [token, user?.preferred_language])

  // Badges turn the static feature grid into a "dynamic dashboard" - each
  // tile reflects the artisan's own real data instead of just being a link.
  function badgeFor(feature) {
    if (loading) return null
    if (feature.to === '/products') {
      if (!stats.total) return t('dash.addFirst')
      return `${stats.total} ${stats.total === 1 ? t('dash.itemSuffix') : t('dash.itemsSuffix')}`
    }
    if (feature.to === '/my-store') {
      return stats.published ? `${stats.published} ${t('dash.live')}` : null
    }
    if (feature.to === '/digitalise' && readiness) {
      return `${readiness.score}% ${t('dash.ready')}`
    }
    return null
  }

  return (
    <div>
      <CategoryBanner category={user?.business?.craft_category} className="px-5 py-6 mb-5">
        <h2 className="text-xl font-bold text-white mb-1">
          {t('dash.welcome')}, {user?.name || 'Artisan'} 👋
        </h2>
        <p className="text-white/85">{user?.business?.business_name}</p>
        {user?.business?.craft_category && (
          <p className="text-white/70 text-xs mt-1">{user.business.craft_category}</p>
        )}
      </CategoryBanner>

      <div className="px-5">
        <InsightCard insight={insight} loading={insightLoading} title={t('dash.insight')} />

        <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">{t('dash.discover')}</p>
        <div className="overflow-hidden mb-6">
          <div className="flex gap-3 marquee-track">
            {[...FEATURES, ...FEATURES].map((f, i) => (
              <FeatureBannerCard
                key={`${f.to}-${i}`}
                feature={f}
                label={t(f.labelKey)}
                desc={t(f.descKey)}
              />
            ))}
          </div>
        </div>

        <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">{t('dash.quickAccess')}</p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-6 no-scrollbar">
          {FEATURES.map((f) => (
            <StoryCircle key={f.to} feature={f} label={t(f.labelKey)} />
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
                <p className="text-xs text-gray-500 mt-1">{t('dash.statProducts')}</p>
              </div>
              <div className="fade-in bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-forest">{stats.published}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dash.statPublished')}</p>
              </div>
              <div className="fade-in bg-white rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-forest">{stats.draft}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dash.statDrafts')}</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <p className="text-sm text-gray-500 mb-1">{t('dash.readiness')}</p>
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
            <p className="text-xs text-gray-400 mt-3">{t('dash.readinessHint')}</p>
          )}
        </div>

        {recentProducts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-charcoal">{t('dash.recent')}</h3>
              <Link to="/products" className="text-xs text-forest font-medium">{t('common.seeAll')}</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-6 no-scrollbar">
              {recentProducts.map((p) => (
                <Link key={p.id} to="/products" className="fade-in w-28 flex-shrink-0 bg-white rounded-xl shadow-sm overflow-hidden">
                  <ProductImage
                    product={p}
                    className="w-full h-28 object-cover"
                    emojiClassName="text-3xl"
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium text-charcoal truncate">{p.name}</p>
                    {p.price != null && <p className="text-[11px] text-terracotta font-semibold">₹{p.price}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <h3 className="font-semibold text-charcoal mb-3">{t('dash.explore')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.to}
              feature={f}
              label={t(f.labelKey)}
              desc={t(f.descKey)}
              badge={badgeFor(f)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
