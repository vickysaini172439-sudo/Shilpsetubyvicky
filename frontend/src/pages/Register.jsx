import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import { CRAFT_CATEGORIES, INDIAN_STATES, LANGUAGES } from '../constants.js'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  preferred_language: 'Hindi',
  business_name: '',
  craft_category: CRAFT_CATEGORIES[0],
  description: '',
  location: '',
  state: INDIAN_STATES[0],
}

export default function Register() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const data = await registerUser({
        ...form,
        email: form.email || null,
      })
      login(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'
  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-4'

  return (
    <div className="min-h-screen bg-ivory px-5 py-8">
      <h1 className="text-2xl font-bold text-forest mb-1">Create your account</h1>
      <p className="text-gray-600 mb-4">Tell us about you and your craft.</p>

      <form onSubmit={handleSubmit}>
        <label className={labelClass}>Your Name</label>
        <input className={inputClass} name="name" value={form.name} onChange={handleChange} required />

        <label className={labelClass}>Phone Number</label>
        <input className={inputClass} name="phone" value={form.phone} onChange={handleChange} required />

        <label className={labelClass}>Email (optional)</label>
        <input className={inputClass} type="email" name="email" value={form.email} onChange={handleChange} />

        <label className={labelClass}>Password</label>
        <input className={inputClass} type="password" name="password" value={form.password} onChange={handleChange} required />

        <label className={labelClass}>Preferred Language</label>
        <select className={inputClass} name="preferred_language" value={form.preferred_language} onChange={handleChange}>
          {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
        </select>

        <hr className="my-6 border-gray-200" />
        <h2 className="text-lg font-semibold text-forest mb-2">Your Business</h2>

        <label className={labelClass}>Business / Craft Name</label>
        <input className={inputClass} name="business_name" value={form.business_name} onChange={handleChange} required />

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-6 shadow-md disabled:opacity-60"
        >
          {loading ? 'Creating your account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-forest font-medium underline">Log in</Link>
      </p>
    </div>
  )
}
