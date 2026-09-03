import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory px-6 text-center">
      <div className="text-6xl mb-4">🧵</div>
      <h1 className="text-3xl font-bold text-forest mb-2">ShilpSetu</h1>
      <p className="text-charcoal mb-8">
        Your Virtual Business Manager — turning your craft into a digital business.
      </p>
      <Link
        to="/register"
        className="bg-terracotta text-white px-6 py-3 rounded-full font-semibold shadow-md mb-3 w-full max-w-xs"
      >
        Get Started
      </Link>
      <Link to="/login" className="text-forest font-medium underline">
        Already have an account? Log in
      </Link>
    </div>
  )
}
