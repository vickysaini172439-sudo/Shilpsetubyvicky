import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { requestSecurityQuestion, resetPassword } from '../services/api.js'

/**
 * Password recovery in three small steps, so a user with low digital
 * confidence is never shown more than one thing to do at a time:
 *   1. "phone"    - type the phone number you registered with
 *   2. "answer"   - answer your own security question + choose a new password
 *   3. "done"     - confirmation, with a link back to login
 */
export default function ForgotPassword() {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handlePhoneSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await requestSecurityQuestion(phone)
      setQuestion(data)
      setStep('answer')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Your new password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The two passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ phone, answer, new_password: newPassword })
      setStep('done')
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
    <div className="min-h-screen bg-ivory flex flex-col justify-center px-6 py-10">
      <div className="text-5xl text-center mb-2">🔑</div>
      <h1 className="text-2xl font-bold text-forest text-center mb-1">Forgot your password?</h1>

      {/* ---------- Step 1: phone number ---------- */}
      {step === 'phone' && (
        <>
          <p className="text-gray-600 text-center mb-4">
            Enter your registered phone number and we will ask you your
            security question.
          </p>
          <form onSubmit={handlePhoneSubmit}>
            <label className={labelClass}>Phone Number</label>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="The number you registered with"
              required
            />

            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-white font-semibold py-3 rounded-full mt-6 shadow-md disabled:opacity-60"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        </>
      )}

      {/* ---------- Step 2: answer + new password ---------- */}
      {step === 'answer' && question && (
        <>
          <p className="text-gray-600 text-center mb-4">
            Answer your security question to set a new password.
          </p>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="font-medium text-charcoal">{question.question_en}</p>
            <p className="text-sm text-gray-500 mt-1">{question.question_hi}</p>
          </div>

          <form onSubmit={handleResetSubmit}>
            <label className={labelClass}>Your answer</label>
            <input
              className={inputClass}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your answer"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Capital letters and extra spaces do not matter.
            </p>

            <label className={labelClass}>New Password</label>
            <input
              className={inputClass}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />

            <label className={labelClass}>Confirm New Password</label>
            <input
              className={inputClass}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-6 shadow-md disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setStep('phone'); setError(''); setAnswer('') }}
            className="w-full text-gray-600 underline mt-4"
          >
            Use a different phone number
          </button>
        </>
      )}

      {/* ---------- Step 3: success ---------- */}
      {step === 'done' && (
        <>
          <div className="text-5xl text-center mt-4 mb-2">✅</div>
          <p className="text-center text-gray-700 mb-6">
            Your password has been changed. You can now log in with your new
            password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-forest text-white font-semibold py-3 rounded-full shadow-md"
          >
            Go to Login
          </button>
        </>
      )}

      <p className="text-center mt-6 text-gray-600">
        Remembered it?{' '}
        <Link to="/login" className="text-forest font-medium underline">Log in</Link>
      </p>
    </div>
  )
}
