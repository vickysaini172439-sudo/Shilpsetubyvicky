import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyStorefront, updateStorefront, uploadLogo, imageUrl } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

// Where to send an artisan who does not have the account yet. These are
// the real signup pages, opened in a new tab so they never lose the form
// they are halfway through filling in here.
const SOCIAL_SIGNUP = {
  instagram: 'https://www.instagram.com/accounts/emailsignup/',
  facebook: 'https://www.facebook.com/pages/creation/',
}

/**
 * Turns whatever the artisan typed into a working profile URL.
 *
 * People do not type URLs. They type "myshop", or "@myshop", or
 * "instagram.com/myshop", because that is how a handle is written and
 * spoken everywhere else. Saving that raw would produce a dead link on
 * their public storefront - a broken link on the one page they send to
 * customers - so we repair it here instead of rejecting their input.
 */
function normalizeSocialUrl(value, host) {
  const raw = (value || '').trim()
  if (!raw) return ''

  // Already a full URL - leave it alone apart from tidying the scheme.
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('www.') || raw.includes(`${host}/`)) return `https://${raw.replace(/^www\./i, '')}`

  // A bare handle, with or without the @.
  const handle = raw.replace(/^@/, '').replace(/\s+/g, '')
  if (!handle) return ''
  return `https://www.${host}/${handle}`
}

export default function Digitalise() {
  const { token } = useAuth()
  const [business, setBusiness] = useState(null)
  const [form, setForm] = useState({ whatsapp_number: '', instagram_url: '', facebook_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getMyStorefront(token)
      .then((b) => {
        setBusiness(b)
        setForm({
          whatsapp_number: b.whatsapp_number || '',
          instagram_url: b.instagram_url || '',
          facebook_url: b.facebook_url || '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    setError('')
    try {
      const updated = await uploadLogo(file, token)
      setBusiness(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      // Repair handles into real URLs before saving, and show the artisan
      // the corrected value so they can see what was stored.
      const cleaned = {
        ...form,
        instagram_url: normalizeSocialUrl(form.instagram_url, 'instagram.com'),
        facebook_url: normalizeSocialUrl(form.facebook_url, 'facebook.com'),
      }
      const updated = await updateStorefront(cleaned, token)
      setBusiness(updated)
      setForm({
        whatsapp_number: updated.whatsapp_number || '',
        instagram_url: updated.instagram_url || '',
        facebook_url: updated.facebook_url || '',
      })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish() {
    setSaving(true)
    try {
      const updated = await updateStorefront({ is_published: !business.is_published }, token)
      setBusiness(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'
  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-4'

  if (loading) return <p className="text-gray-500 p-5 text-center">Loading...</p>
  if (!business) return <p className="text-red-600 p-5 text-center">{error}</p>

  return (
    <div className="p-5">
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 text-center">
        <p className="text-sm text-gray-500">Your store is currently</p>
        <p className={`text-lg font-bold ${business.is_published ? 'text-forest' : 'text-gray-400'}`}>
          {business.is_published ? '✅ Live & Public' : '⏸ Not Published'}
        </p>
        <button
          onClick={togglePublish}
          disabled={saving}
          className={`mt-2 px-4 py-2 rounded-full text-sm font-semibold ${
            business.is_published ? 'border border-red-400 text-red-500' : 'bg-forest text-white'
          }`}
        >
          {business.is_published ? 'Unpublish Store' : 'Publish Store'}
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-charcoal mb-1">Business Logo</label>
        {business.logo_url && (
          <img src={imageUrl(business.logo_url)} alt="Logo" className="w-20 h-20 object-cover rounded-full mb-2" />
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="text-sm" />

        <label className={labelClass}>WhatsApp Number (shown publicly)</label>
        <input className={inputClass} name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange} placeholder="e.g. 9876543210" />

        <label className={labelClass}>Instagram</label>
        <input
          className={inputClass}
          name="instagram_url"
          value={form.instagram_url}
          onChange={handleChange}
          placeholder="yourbusiness  (or paste the full link)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Just your username is enough — we'll turn it into a proper link.{' '}
          <a
            href={SOCIAL_SIGNUP.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest font-medium underline"
          >
            Don't have Instagram? Create an account →
          </a>
        </p>

        <label className={labelClass}>Facebook</label>
        <input
          className={inputClass}
          name="facebook_url"
          value={form.facebook_url}
          onChange={handleChange}
          placeholder="yourbusiness  (or paste the full link)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Just your page name is enough — we'll turn it into a proper link.{' '}
          <a
            href={SOCIAL_SIGNUP.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest font-medium underline"
          >
            Don't have a Facebook Page? Create one →
          </a>
        </p>

        <div className="mt-4 bg-ivory rounded-lg p-3">
          <p className="text-xs text-charcoal font-semibold mb-1">Why add these?</p>
          <p className="text-xs text-gray-600 leading-snug">
            Both links appear on your public store page, so a customer who likes your work can
            follow you and see new pieces later. A business page also lets you post photos for
            free and reply to buyers in one place. Adding them is optional — your store works
            without them.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        {saved && <p className="text-forest text-sm mt-3">Saved ✓</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <Link
        to="/my-store"
        className="block text-center w-full bg-forest text-white font-semibold py-3 rounded-full mt-4 shadow-md"
      >
        View My Digital Store →
      </Link>
    </div>
  )
}
