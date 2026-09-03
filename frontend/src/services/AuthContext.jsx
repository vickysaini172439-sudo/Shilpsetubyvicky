import { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from './api.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'shilpsetu_token'

// Makes "who is logged in right now" available to every screen in the
// app, without passing it down through every single component by hand.
// This is called a "React Context" - think of it as a small shared box
// of data that any page can read from using the useAuth() hook below.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    getMe(token)
      .then(setUser)
      .catch(() => {
        // Token is invalid or expired - clear it and send the user to log in again.
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  function login(newToken, newUser) {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
