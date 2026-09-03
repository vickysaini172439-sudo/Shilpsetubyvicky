import { Navigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'

// Wrap any screen that should only be visible to a logged-in artisan.
// If there's no valid session, we send the visitor to the login page.
export default function PrivateRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}
