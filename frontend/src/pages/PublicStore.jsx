import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicStore, imageUrl } from '../services/api.js'

// This is the PUBLIC storefront page - anyone with the link or QR code
// can open this without logging in. It's a different route (/store/:slug)
// from the artisan's own "/my-store" management screen.
export default function PublicStore() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

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
    return <div className="min-h-screen bg-ivory flex items-center justify-center text-gray-500">Loading store...</div>
  }

  const { business, products } = data

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest text-white text-center py-8 px-4">
        {business.logo_url && (
          <img src={imageUrl(business.logo_url)} alt={business.business_name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-white" />
        )}
        <h1 className="text-2xl font-bold">{business.business_name}</h1>
        <p className="text-sm opacity-90">{business.craft_category}</p>
        {business.location && <p className="text-xs opacity-75 mt-1">{business.location}{business.state ? `, ${business.state}` : ''}</p>}
      </div>

      {business.description && (
        <div className="p-5 text-center">
          <p className="text-charcoal">{business.description}</p>
        </div>
      )}

      <div className="p-5 pt-0">
        <h2 className="font-semibold text-charcoal mb-3">Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-500 text-sm">No products published yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {p.image_url ? (
                  <img src={imageUrl(p.image_url)} alt={p.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-ivory flex items-center justify-center text-3xl">📦</div>
                )}
                <div className="p-3">
                  <p className="font-medium text-charcoal text-sm truncate">{p.name}</p>
                  {p.price != null && <p className="text-terracotta font-semibold text-sm">₹{p.price}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(business.whatsapp_number || business.instagram_url || business.facebook_url) && (
        <div className="p-5 pt-0 flex flex-wrap gap-2 justify-center">
          {business.whatsapp_number && (
            <a
              href={`https://wa.me/91${business.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="bg-forest text-white px-4 py-2 rounded-full text-sm font-semibold"
            >
              💬 WhatsApp
            </a>
          )}
          {business.instagram_url && (
            <a href={business.instagram_url} target="_blank" rel="noreferrer" className="border border-terracotta text-terracotta px-4 py-2 rounded-full text-sm font-semibold">
              Instagram
            </a>
          )}
          {business.facebook_url && (
            <a href={business.facebook_url} target="_blank" rel="noreferrer" className="border border-terracotta text-terracotta px-4 py-2 rounded-full text-sm font-semibold">
              Facebook
            </a>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 py-6">Powered by ShilpSetu</p>
    </div>
  )
}
