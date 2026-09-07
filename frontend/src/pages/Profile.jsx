import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'
import { updateMe } from '../services/api.js'
import { CRAFT_CATEGORIES, INDIAN_STATES, LANGUAGES } from '../constants.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { UI_LANGUAGES } from '../i18n/strings.js'

export default function Profile() {
  const { user, token, setUser, logout } = useAuth()
  const { t, activeLanguage, setLanguage } = useLanguage()
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
      {/* --- App language -------------------------------------------------
          Kept at the very top and applied instantly on tap (no Save needed),
          because someone who landed in a language they cannot read has to be
          able to get out of it without first finding a "Save" button they
          also cannot read. */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <p className="text-sm font-medium text-charcoal mb-1">🌐 {t('lang.settingLabel')}</p>
        <p className="text-xs text-gray-500 mb-3">{t('profile.appLanguageHint')}</p>
        <div className="grid grid-cols-3 gap-2">
          {UI_LANGUAGES.map((option) => {
            const active = activeLanguage === option.code
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
                aria-pressed={active}
                className={`press rounded-xl py-2 px-1 text-sm font-medium border-2 transition-colors ${
                  active
                    ? 'border-forest bg-forest text-white'
                    : 'border-gray-200 bg-white text-charcoal'
                }`}
              >
                {option.native}
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSave}>
        <label className={labelClass}>{t('register.name')}</label>
        <input className={inputClass} name="name" value={form.name} onChange={handleChange} />

        <label className={labelClass}>{t('profile.email')}</label>
        <input className={inputClass} type="email" name="email" value={form.email} onChange={handleChange} />

        <label className={labelClass}>{t('register.preferredLanguage')}</label>
        <select className={inputClass} name="preferred_language" value={form.preferred_language} onChange={handleChange}>
          {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">{t('register.preferredLanguageHint')}</p>

        <hr className="my-6 border-gray-200" />
        <h2 className="text-lg font-semibold text-forest mb-2">{t('register.step3')}</h2>

        <label className={labelClass}>{t('register.businessName')}</label>
        <input className={inputClass} name="business_name" value={form.business_name} onChange={handleChange} />

        <label className={labelClass}>{t('register.craftCategory')}</label>
        <select className={inputClass} name="craft_category" value={form.craft_category} onChange={handleChange}>
          {CRAFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className={labelClass}>{t('register.description')}</label>
        <textarea className={inputClass} name="description" rows={3} value={form.description} onChange={handleChange} />

        <label className={labelClass}>{t('register.location')}</label>
        <input className={inputClass} name="location" value={form.location} onChange={handleChange} />

        <label className={labelClass}>{t('register.state')}</label>
        <select className={inputClass} name="state" value={form.state} onChange={handleChange}>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        {saved && <p className="text-forest text-sm mt-4">{t('profile.updated')}</p>}

        <button
          type="submit"
          disabled={loading}
          className="press w-full bg-forest text-white font-semibold py-3 rounded-full mt-6 shadow-md disabled:opacity-60"
        >
          {loading ? t('profile.saving') : t('profile.save')}
        </button>
      </form>

      <Link
        to="/help"
        className="press block w-full text-center border border-forest text-forest font-semibold py-3 rounded-full mt-4"
      >
        {t('page.help')}
      </Link>

      <button
        onClick={handleLogout}
        className="press w-full border border-terracotta text-terracotta font-semibold py-3 rounded-full mt-3"
      >
        {t('profile.logout')}
      </button>
    </div>
  )
}
