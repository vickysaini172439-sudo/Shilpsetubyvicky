import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicStore, imageUrl } from '../services/api.js'
import CategoryBanner from '../components/CategoryBanner.jsx'
import { themeFor } from '../theme/categoryTheme.js'

// This is the PUBLIC storefront page - anyone with the link or QR code
// can open this without logging in. It's a different route (/store/:slug)
// from the artisan's own "/my-store" management screen.
//
// WHY THIS PAGE WAS REBUILT
// -------------------------
// It used to show a two-column grid of thumbnails with nothing but a
// truncated name and a price. Everything that makes a handmade piece
// worth its price - what it is made of, how it was made, what the AI
// Catalogue wrote about it - existed in the database and was never shown
// to the one person it was written for: the buyer.
//
// A visitor landing here from a WhatsApp link has no idea who this
// artisan is and no reason to trust them yet. So the page now leads with
// the story, gives every product room to make its own case, and lets a
// visitor open any piece to read the full description and features.

// Features are stored as one per line (see models/product.py) so that a
// hand-edit can never produce a parse error - a malformed line just
// becomes an extra bullet.
function featureList(product) {
  return (product.features || '')
    .split('\n')
    .map((line) => line.replace(/^[-•*\d.\s]+/, '').trim())
    .filter(Boolean)
}

function priceLabel(price) {
  if (price == null) return null
  return `₹${Number(price).toLocaleString('en-IN')}`
}

function StockBadge({ quantity }) {
  // null means the artisan does not track stock - stay quiet rather than
  // implying anything about availability.
  if (quantity == null) return null
  if (quantity <= 0) {
    return <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Sold out</span>
  }
  if (quantity <= 3) {
    return (
      <span className="text-xs font-semibold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
        Only {quantity} left
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold text-forest bg-forest/10 px-2 py-0.5 rounded-full">
      {quantity} available
    </span>
  )
}

function ProductDetail({ product, business, onClose }) {
  const features = featureList(product)
  const theme = themeFor(product.category || business.craft_category)
  const description = product.description_english || product.description_hindi

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-ivory w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {product.image_url ? (
          <img src={imageUrl(product.image_url)} alt={product.name} className="w-full h-64 object-cover" />
        ) : (
          <div
            className="w-full h-48 flex items-center justify-center text-6xl"
            style={{ backgroundColor: theme.color }}
          >
            {theme.emoji}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-xl font-bold text-charcoal leading-tight">{product.name}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-gray-500 shadow-sm"
            >
              ✕
            </button>
          </div>

          {product.name_hindi && <p className="text-sm text-gray-500 mb-2">{product.name_hindi}</p>}

          <div className="flex items-center gap-3 flex-wrap mb-4">
            {priceLabel(product.price) && (
              <span className="text-2xl font-bold text-terracotta">{priceLabel(product.price)}</span>
            )}
            <StockBadge quantity={product.stock_quantity} />
          </div>

          {product.caption && (
            <p className="text-sm italic text-charcoal bg-white rounded-xl p-3 mb-4">"{product.caption}"</p>
          )}

          {description && (
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">About this piece</h3>
              <p className="text-sm text-charcoal leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}

          {features.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">What makes it special</h3>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="text-sm text-charcoal flex gap-2">
                    <span className="text-forest flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(product.material || product.craft_type || product.category) && (
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Details</h3>
              <dl className="bg-white rounded-xl divide-y divide-gray-100">
                {product.material && (
                  <div className="flex justify-between px-3 py-2 text-sm">
                    <dt className="text-gray-500">Material</dt>
                    <dd className="text-charcoal font-medium text-right">{product.material}</dd>
                  </div>
                )}
                {product.craft_type && (
                  <div className="flex justify-between px-3 py-2 text-sm">
                    <dt className="text-gray-500">Craft</dt>
                    <dd className="text-charcoal font-medium text-right">{product.craft_type}</dd>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between px-3 py-2 text-sm">
                    <dt className="text-gray-500">Category</dt>
                    <dd className="text-charcoal font-medium text-right">{product.category}</dd>
                  </div>
                )}
                <div className="flex justify-between px-3 py-2 text-sm">
                  <dt className="text-gray-500">Made by</dt>
                  <dd className="text-charcoal font-medium text-right">{business.business_name}</dd>
                </div>
              </dl>
            </div>
          )}

          <p className="text-xs text-gray-500 leading-snug mb-4">
            Handmade, so small variations in colour, size and finish are normal — they are what
            make each piece one of a kind.
          </p>

          {business.whatsapp_number && (
            <a
              href={`https://wa.me/91${business.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hello! I saw "${product.name}" on your ShilpSetu store. Is it available?`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="block text-center w-full bg-forest text-white font-semibold py-3 rounded-full shadow-md"
            >
              💬 Ask about this piece
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PublicStore() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getPublicStore(slug)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [slug])

  if (error) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="skeleton h-40 w-full" />
        <div className="p-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-3 flex gap-3">
              <div className="skeleton w-24 h-24 rounded-xl flex-shrink-0" />
              <div className="flex-1 py-1 space-y-2">
                <div className="skeleton h-4 rounded-full w-2/3" />
                <div className="skeleton h-3 rounded-full w-full" />
                <div className="skeleton h-3 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const { business, products } = data
  const priced = products.filter((p) => p.price != null).map((p) => p.price)

  return (
    <div className="min-h-screen bg-ivory">
      <CategoryBanner category={business.craft_category} className="text-white text-center py-8 px-4">
        {business.logo_url && (
          <img
            src={imageUrl(business.logo_url)}
            alt={business.business_name}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-white"
          />
        )}
        <h1 className="text-2xl font-bold">{business.business_name}</h1>
        <p className="text-sm opacity-90">{business.craft_category}</p>
        {business.location && (
          <p className="text-xs opacity-75 mt-1">
            📍 {business.location}{business.state ? `, ${business.state}` : ''}
          </p>
        )}

        {/* Trust signals. A visitor arriving from a WhatsApp link knows
            nothing about this shop yet - these three facts tell them it is
            a real, stocked business in about one second. */}
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">
            ✋ 100% Handmade
          </span>
          {products.length > 0 && (
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">
              {products.length} piece{products.length === 1 ? '' : 's'}
            </span>
          )}
          {priced.length > 0 && (
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">
              From ₹{Math.min(...priced).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </CategoryBanner>

      {business.description && (
        <div className="px-5 py-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">Our story</h2>
            <p className="text-sm text-charcoal leading-relaxed">{business.description}</p>
          </div>
        </div>
      )}

      <div className="px-5 pb-2">
        <h2 className="font-semibold text-charcoal mb-3">
          {products.length > 0 ? 'Every piece, made by hand' : 'Products'}
        </h2>

        {products.length === 0 ? (
          <p className="text-gray-500 text-sm">No products published yet.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const theme = themeFor(p.category || business.craft_category)
              const blurb = p.caption || p.description_english || p.description_hindi || ''
              const features = featureList(p)

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="w-full text-left bg-white rounded-2xl shadow-sm overflow-hidden flex gap-3 active:scale-[0.99] transition"
                >
                  {p.image_url ? (
                    <img
                      src={imageUrl(p.image_url)}
                      alt={p.name}
                      className="w-28 h-full min-h-[7rem] object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-28 min-h-[7rem] flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ backgroundColor: theme.color }}
                    >
                      {theme.emoji}
                    </div>
                  )}

                  <div className="flex-1 py-3 pr-3 min-w-0">
                    <p className="font-semibold text-charcoal text-sm leading-tight">{p.name}</p>

                    {blurb && (
                      <p className="text-xs text-gray-600 mt-1 leading-snug line-clamp-2">{blurb}</p>
                    )}

                    {features.length > 0 && (
                      <p className="text-[11px] text-forest mt-1 truncate">✓ {features[0]}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {priceLabel(p.price) && (
                        <span className="text-terracotta font-bold text-base">{priceLabel(p.price)}</span>
                      )}
                      <StockBadge quantity={p.stock_quantity} />
                    </div>

                    {p.material && (
                      <p className="text-[11px] text-gray-400 mt-1 truncate">{p.material}</p>
                    )}

                    <p className="text-[11px] text-forest font-medium mt-1">View details →</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {(business.whatsapp_number || business.instagram_url || business.facebook_url) && (
        <div className="p-5 pt-4">
          <p className="text-center text-xs text-gray-500 mb-3">Talk to the maker directly</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {business.whatsapp_number && (
              <a
                href={`https://wa.me/91${business.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="bg-forest text-white px-4 py-2 rounded-full text-sm font-semibold"
              >
                💬 WhatsApp
              </a>
            )}
            {business.instagram_url && (
              <a
                href={business.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="border border-terracotta text-terracotta px-4 py-2 rounded-full text-sm font-semibold"
              >
                Instagram
              </a>
            )}
            {business.facebook_url && (
              <a
                href={business.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="border border-terracotta text-terracotta px-4 py-2 rounded-full text-sm font-semibold"
              >
                Facebook
              </a>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 py-6">Powered by ShilpSetu</p>

      {selected && (
        <ProductDetail product={selected} business={business} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
