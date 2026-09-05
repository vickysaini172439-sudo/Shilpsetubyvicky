import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, getSecurityQuestions } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import { CRAFT_CATEGORIES, INDIAN_STATES, LANGUAGES } from '../constants.js'
import { AuthHeader } from '../components/CraftArt.jsx'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  preferred_language: 'Hindi',
  security_question: '',
  security_answer: '',
  business_name: '',
  craft_category: CRAFT_CATEGORIES[0],
  description: '',
  location: '',
  state: INDIAN_STATES[0],
}

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

export default function Register() {
  const [form, setForm] = useState(emptyForm)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (!form.security_question) {
      setError('Please choose a security question.')
      return
    }

    if (form.security_answer.trim().length < 2) {
      setError('Please write the answer to your security question.')
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

  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-4 first:mt-0'
  const selectedQuestion = questions.find((q) => q.id === form.security_question)

  return (
    <div className="page-in min-h-screen bg-ivory">
      <AuthHeader
        title="Create your account"
        subtitle="Tell us about you and your craft. It takes about two minutes."
      />

      <div className="px-5 -mt-6 relative">
        <form onSubmit={handleSubmit} className="stagger">
          <Section step="1" title="About you">
            <label className={labelClass}>Your Name</label>
            <input className="field" name="name" value={form.name} onChange={handleChange} required />

            <label className={labelClass}>Phone Number</label>
            <input
              className="field"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <label className={labelClass}>Email (optional)</label>
            <input className="field" type="email" name="email" value={form.email} onChange={handleChange} />

            <label className={labelClass}>Password</label>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">At least 6 characters.</p>

            <label className={labelClass}>Preferred Language</label>
            <select className="field" name="preferred_language" value={form.preferred_language} onChange={handleChange}>
              {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </Section>

          <Section
            step="2"
            title="Security Question"
            description="If you ever forget your password, we will ask you this question to make sure it is really you. Choose one you will always remember."
          >
            {questionsError && (
              <div className="fade-in mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-red-700 text-sm">
                  Could not load the security questions. {questionsError}
                </p>
              </div>
            )}

            <label className={labelClass}>Choose your question</label>
            <select
              className="field"
              name="security_question"
              value={form.security_question}
              onChange={handleChange}
              required
            >
              {questions.length === 0 && <option value="">Loading questions...</option>}
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

            <label className={labelClass}>Your answer</label>
            <input
              className="field"
              name="security_answer"
              value={form.security_answer}
              onChange={handleChange}
              placeholder="Write your answer here"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Capital letters and extra spaces do not matter. Keep this answer private.
            </p>
          </Section>

          <Section step="3" title="Your Business">
            <label className={labelClass}>Business / Craft Name</label>
            <input className="field" name="business_name" value={form.business_name} onChange={handleChange} required />

            <label className={labelClass}>Craft Category</label>
            <select className="field" name="craft_category" value={form.craft_category} onChange={handleChange}>
              {CRAFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <label className={labelClass}>Describe your business</label>
            <textarea className="field" name="description" rows={3} value={form.description} onChange={handleChange} />

            <label className={labelClass}>Location (City/Town)</label>
            <input className="field" name="location" value={form.location} onChange={handleChange} />

            <label className={labelClass}>State</label>
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
                  Creating your account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-center mt-4 mb-10 text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-forest font-medium underline">Log in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
