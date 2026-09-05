import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'
import { updateMe } from '../services/api.js'
import { CRAFT_CATEGORIES, INDIAN_STATES, LANGUAGES } from '../constants.js'

export default function Profile() {
  const { user, token, setUser, logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    preferred_language: user?.preferred_language || 'Hindi',
    business_name: user?.business?.business_name || '',
    craft_category: user?.business?.craft_category || CRAFT_CATEGORIES[0],
    description: user?.business?.description || '',
    location: user?.business?.location || '',
    state: user?.business?.state || INDIAN_STATES[0],
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const updated = await updateMe(form, token)
      setUser(updated)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  const inputClass =
    'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'
  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-4'

  if (!user) return null

  return (
    <div className="p-5">
      <form onSubmit={handleSave}>
        <label className={labelClass}>Your Name</label>
        <input className={inputClass} name="name" value={form.name} onChange={handleChange} />

        <label className={labelClass}>Email</label>
        <input className={inputClass} type="email" name="email" value={form.email} onChange={handleChange} />

        <label className={labelClass}>Preferred Language</label>
        <select className={inputClass} name="preferred_language" value={form.preferred_language} onChange={handleChange}>
          {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
        </select>

        <hr className="my-6 border-gray-200" />
        <h2 className="text-lg font-semibold text-forest mb-2">Your Business</h2>

        <label className={labelClass}>Business / Craft Name</label>
        <input className={inputClass} name="business_name" value={form.business_name} onChange={handleChange} />

        <label className={labelClass}>Craft Category</label>
        <select className={inputClass} name="craft_category" value={form.craft_category} onChange={handleChange}>
          {CRAFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className={labelClass}>Describe your business</label>
        <textarea className={inputClass} name="description" rows={3} value={form.description} onChange={handleChange} />

        <label className={labelClass}>Location (City/Town)</label>
        <input className={inputClass} name="location" value={form.location} onChange={handleChange} />

        <label className={labelClass}>State</label>
        <select className={inputClass} name="state" value={form.state} onChange={handleChange}>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        {saved && <p className="text-forest text-sm mt-4">Profile updated.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-white font-semibold py-3 rounded-full mt-6 shadow-md disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <Link
        to="/help"
        className="block w-full text-center border border-forest text-forest font-semibold py-3 rounded-full mt-4"
      >
        Help & Support
      </Link>

      <button
        onClick={handleLogout}
        className="w-full border border-terracotta text-terracotta font-semibold py-3 rounded-full mt-3"
      >
        Log Out
      </button>
    </div>
  )
}
