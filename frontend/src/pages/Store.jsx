import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyStorefront, storeQrUrl, storePublicUrl } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

export default function Store() {
  const { token } = useAuth()
  const [business, setBusiness] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getMyStorefront(token).then(setBusiness).catch((err) => setError(err.message))
  }, [token])

  async function handleShare() {
    const url = storePublicUrl(business.slug)
    if (navigator.share) {
      try {
        await navigator.share({ title: business.business_name, url })
        return
      } catch {
        // user cancelled the native share sheet - fall through to copy
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error) return <p className="text-red-600 p-5 text-center">{error}</p>
  if (!business) return <p className="text-gray-500 p-5 text-center">Loading...</p>

  return (
    <div className="p-5">
      {!business.is_published && (
        <div className="bg-sand/30 border border-sand text-charcoal text-sm rounded-lg p-3 mb-4">
          Your store isn't published yet — visitors can't see it.{' '}
          <Link to="/digitalise" className="underline font-medium">Publish it here</Link>.
        </div>
      )}

      <div className="bg-white rounded-xl p-5 shadow-sm text-center mb-4">
        <h2 className="text-xl font-bold text-forest">{business.business_name}</h2>
        <p className="text-sm text-gray-500 mb-4">{business.craft_category}</p>

        <img
          src={storeQrUrl(business.slug)}
          alt="Store QR code"
          className="w-48 h-48 mx-auto border border-gray-200 rounded-lg p-2"
        />
        <p className="text-xs text-gray-400 mt-2 break-all">{storePublicUrl(business.slug)}</p>

        <button
          onClick={handleShare}
          className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-4 shadow-md"
        >
          {copied ? 'Link Copied ✓' : '📤 Share My Store'}
        </button>
      </div>

      <Link
        to={`/store/${business.slug}`}
        target="_blank"
        className="block text-center w-full border border-forest text-forest font-semibold py-3 rounded-full mb-3"
      >
        Preview as a Visitor
      </Link>
      <Link
        to="/digitalise"
        className="block text-center w-full text-gray-500 py-2"
      >
        Edit Storefront Settings
      </Link>
    </div>
  )
}
