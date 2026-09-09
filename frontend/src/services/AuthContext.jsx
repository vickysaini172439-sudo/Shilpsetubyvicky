import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, updateMe } from './api.js'

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

  /**
   * Keeps the language the AI WRITES IN in step with the language the app
   * is DISPLAYED IN.
   *
   * These are deliberately two different settings. The interface exists in
   * three languages; the AI can write in twelve. An artisan who sells in
   * Tamil needs Tamil catalogue copy even though we have no Tamil
   * interface to give them - so the two cannot simply be one setting.
   *
   * But that separation produced a bug that looked like the app ignoring
   * them: switch the app from Hindi to Hinglish and the dashboard kept
   * coaching them in Hindi, because every AI route reads
   * user.preferred_language, which was set once at registration and never
   * touched again.
   *
   * So: when someone switches the app language, move their AI language
   * with it - but ONLY if their AI language is currently one of the three
   * the interface supports. If it is Tamil (or any of the other nine),
   * they chose something the app language could not have expressed, and
   * silently overwriting that choice would be far worse than the bug this
   * fixes.
   *
   * Fire-and-forget on purpose. The tap must feel instant, and a failed
   * save is not worth an error message about a setting the artisan did not
   * know existed - the app language still changes either way.
   */
  function syncAiLanguage(uiLanguage, uiLanguageCodes) {
    if (!token || !user) return
    const current = user.preferred_language
    if (current === uiLanguage) return
    if (current && !uiLanguageCodes.includes(current)) return

    setUser({ ...user, preferred_language: uiLanguage })
    updateMe({ preferred_language: uiLanguage }, token)
      .then(setUser)
      .catch(() => {
        /* The app language changed regardless; nothing useful to say. */
      })
  }

  return (
    <AuthContext.Provider value={{ token, user, setUser, loading, login, logout, syncAiLanguage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
