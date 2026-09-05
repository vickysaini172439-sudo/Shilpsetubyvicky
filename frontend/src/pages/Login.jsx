import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import { AuthHeader } from '../components/CraftArt.jsx'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginUser({ phone, password })
      login(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-in min-h-screen bg-ivory">
      <AuthHeader
        title="Welcome back"
        subtitle="Log in to manage your craft business."
      />

      {/* Pulled up over the header panel so the card overlaps it slightly -
          a small depth cue that makes the screen read as layered rather
          than as two stacked blocks. */}
      <div className="px-5 -mt-6 relative">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <form onSubmit={handleSubmit} className="stagger">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Phone Number</label>
              <input
                className="field"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
              <input
                className="field"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-sm text-forest underline">
                Forgot password?
              </Link>
            </div>

            {/* Errors get their own animated block so a failed attempt is
                clearly noticed rather than quietly appearing as grey text. */}
            {error && (
              <div className="fade-in mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="press w-full bg-forest text-white font-semibold py-3 rounded-full mt-5 shadow-md disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" />
                  Logging in...
                </span>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 mb-10 text-gray-600">
          New here?{' '}
          <Link to="/register" className="text-forest font-medium underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
