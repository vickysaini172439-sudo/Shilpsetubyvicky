import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, getSecurityQuestions } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import { CRAFT_CATEGORIES, INDIAN_STATES, LANGUAGES } from '../constants.js'
import { AuthHeader } from '../components/CraftArt.jsx'
import VoiceInput, { SPEECH_SUPPORTED } from '../components/VoiceInput.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const LABEL_CLASS = 'block text-sm font-medium text-charcoal mb-1 mt-4 first:mt-0'

/**
 * One step of the sign-up form, shown as its own card.
 *
 * Splitting a fourteen-field form into three labelled cards is not only
 * a visual change: a long unbroken form is genuinely intimidating, and
 * this app's users are often filling in their first ever online account.
 * Numbered sections tell them how much is left.
 */
function Section({ step, title, description, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-forest text-white text-sm font-semibold flex items-center justify-center">
          {step}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-forest leading-tight">{title}</h2>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

/**
 * A text field with a microphone beside it.
 *
 * This is the change that matters most on this screen: an artisan who
 * cannot type in their own script can now fill in every free-text field by
 * speaking it. The mic sits inline rather than below, so the form stays the
 * same length as before and does not feel heavier.
 *
 * Defined at module scope, NOT inside Register. A component declared inside
 * another component is a brand-new type on every render, so React throws the
 * old input away and mounts a fresh one - which would drop keyboard focus
 * after every single character typed. That bug is invisible on a desktop
 * test and infuriating on a phone.
 */
function SpeakableField({
  label,
  name,
  value,
  onChange,
  onSpoken,
  speakLabel,
  language,
  hint,
  textarea = false,
  ...rest
}) {
  return (
    <>
      <label className={LABEL_CLASS}>{label}</label>
      <div className="flex items-start gap-2">
        {textarea ? (
          <textarea
            className="field flex-1"
            name={name}
            rows={3}
            value={value}
            onChange={onChange}
            {...rest}
          />
        ) : (
          <input
            className="field flex-1"
            name={name}
            value={value}
            onChange={onChange}
            {...rest}
          />
        )}
        <VoiceInput
          compact
          language={language}
          onTranscript={onSpoken}
          label={speakLabel}
          className="pt-0.5"
        />
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </>
  )
}

export default function Register() {
  const { t, activeLanguage } = useLanguage()

  // The account's AI-writing language starts as whatever interface language
  // they just chose - it is almost always the same answer, so pre-filling it
  // saves a decision. They can still change it in the dropdown below.
  const [form, setForm] = useState(() => ({
    name: '',
    phone: '',
    email: '',
    password: '',
    preferred_language: activeLanguage,
    security_question: '',
    security_answer: '',
    business_name: '',
    craft_category: CRAFT_CATEGORIES[0],
    description: '',
    location: '',
    state: INDIAN_STATES[0],
  }))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [questionsError, setQuestionsError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  // Load the security questions from the backend when the page opens, and
  // pre-select the first one so the field is never left empty by accident.
  useEffect(() => {
    getSecurityQuestions()
      .then((data) => {
        setQuestions(data.questions)
        setForm((f) => (f.security_question ? f : { ...f, security_question: data.questions[0].id }))
      })
      .catch((err) => setQuestionsError(err.message))
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Speech appends rather than replaces, so someone can dictate a long
  // description in several goes, or fix a word by typing after speaking.
  function appendSpoken(field) {
    return (text) => {
      setForm((f) => {
        const existing = f[field] || ''
        return { ...f, [field]: existing ? `${existing} ${text}` : text }
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError(t('register.errPassword'))
      return
    }

    if (!form.security_question) {
      setError(t('register.errQuestion'))
      return
    }

    if (form.security_answer.trim().length < 2) {
      setError(t('register.errAnswer'))
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

  const selectedQuestion = questions.find((q) => q.id === form.security_question)

  // Everything each SpeakableField needs that doesn't change per field.
  const speech = {
    language: form.preferred_language,
    speakLabel: t('common.speak'),
    onChange: handleChange,
  }

  return (
    <div className="page-in min-h-screen bg-ivory">
      <AuthHeader title={t('register.title')} subtitle={t('register.subtitle')} />

      <div className="px-5 -mt-6 relative">
        {/* One honest, up-front note that speaking is an option at all -
            a microphone icon on its own is easy to miss if you have never
            used voice input before. */}
        {SPEECH_SUPPORTED && (
          <div className="bg-forest/10 border border-forest/20 rounded-xl px-3 py-2 mb-4 flex items-start gap-2">
            <span aria-hidden="true" className="text-base leading-none mt-0.5">🎙️</span>
            <p className="text-xs text-forest leading-snug">{t('common.voiceHint')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stagger">
          <Section step="1" title={t('register.step1')} description={t('register.step1desc')}>
            <SpeakableField
              {...speech}
              label={t('register.name')}
              name="name"
              value={form.name}
              onSpoken={appendSpoken('name')}
              required
            />

            <label className={LABEL_CLASS}>{t('register.phone')}</label>
            <input
              className="field"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <label className={LABEL_CLASS}>{t('register.email')}</label>
            <input className="field" type="email" name="email" value={form.email} onChange={handleChange} />

            <label className={LABEL_CLASS}>{t('register.password')}</label>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('register.passwordHint')}</p>

            <label className={LABEL_CLASS}>{t('register.preferredLanguage')}</label>
            <select className="field" name="preferred_language" value={form.preferred_language} onChange={handleChange}>
              {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('register.preferredLanguageHint')}</p>
          </Section>

          <Section step="2" title={t('register.step2')} description={t('register.step2desc')}>
            {questionsError && (
              <div className="fade-in mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-red-700 text-sm">
                  {t('register.questionsError')} {questionsError}
                </p>
              </div>
            )}

            <label className={LABEL_CLASS}>{t('register.chooseQuestion')}</label>
            <select
              className="field"
              name="security_question"
              value={form.security_question}
              onChange={handleChange}
              required
            >
              {questions.length === 0 && <option value="">{t('common.loading')}</option>}
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.question_en}
                </option>
              ))}
            </select>

            {/* Show the Hindi version of whichever question is selected, so an
                artisan who reads Hindi more comfortably still understands it. */}
            {selectedQuestion && (
              <p className="text-sm text-gray-500 mt-1">{selectedQuestion.question_hi}</p>
            )}

            <SpeakableField
              {...speech}
              label={t('register.yourAnswer')}
              name="security_answer"
              value={form.security_answer}
              onSpoken={appendSpoken('security_answer')}
              placeholder={t('register.answerPlaceholder')}
              hint={t('register.answerHint')}
              required
            />
          </Section>

          <Section step="3" title={t('register.step3')} description={t('register.step3desc')}>
            <SpeakableField
              {...speech}
              label={t('register.businessName')}
              name="business_name"
              value={form.business_name}
              onSpoken={appendSpoken('business_name')}
              required
            />

            <label className={LABEL_CLASS}>{t('register.craftCategory')}</label>
            <select className="field" name="craft_category" value={form.craft_category} onChange={handleChange}>
              {CRAFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <SpeakableField
              {...speech}
              label={t('register.description')}
              name="description"
              value={form.description}
              onSpoken={appendSpoken('description')}
              textarea
            />

            <SpeakableField
              {...speech}
              label={t('register.location')}
              name="location"
              value={form.location}
              onSpoken={appendSpoken('location')}
            />

            <label className={LABEL_CLASS}>{t('register.state')}</label>
            <select className="field" name="state" value={form.state} onChange={handleChange}>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Section>

          <div>
            {error && (
              <div className="fade-in mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="press w-full bg-terracotta text-white font-semibold py-3 rounded-full shadow-md disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" />
                  {t('register.submitting')}
                </span>
              ) : (
                t('register.submit')
              )}
            </button>

            <p className="text-center mt-4 mb-10 text-gray-600">
              {t('register.haveAccount')}{' '}
              <Link to="/login" className="text-forest font-medium underline">{t('register.login')}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
