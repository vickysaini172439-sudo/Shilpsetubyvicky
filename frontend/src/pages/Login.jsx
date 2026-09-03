import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

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

  const inputClass =
    'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center px-6">
      <div className="text-5xl text-center mb-2">🧵</div>
      <h1 className="text-2xl font-bold text-forest text-center mb-6">Welcome back</h1>

      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-charcoal mb-1">Phone Number</label>
        <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />

        <label className="block text-sm font-medium text-charcoal mb-1 mt-4">Password</label>
        <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-white font-semibold py-3 rounded-full mt-6 shadow-md disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-600">
        New here?{' '}
        <Link to="/register" className="text-forest font-medium underline">Create an account</Link>
      </p>
    </div>
  )
}
