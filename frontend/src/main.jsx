import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './services/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// Dismiss the boot splash painted by index.html now that React has taken
// over the screen.
//
// The short minimum display time is deliberate. On a fast connection React
// mounts almost instantly, and removing the splash immediately produces a
// jarring flash of colour that looks like a glitch. Holding it briefly
// makes it read as an intentional opening animation instead. On a slow
// connection this delay costs nothing, because the bundle took longer than
// this to arrive anyway.
const MINIMUM_VISIBLE_MS = 900
const FADE_MS = 500

const splash = document.getElementById('boot-splash')
if (splash) {
  window.setTimeout(() => {
    splash.classList.add('is-hidden')
    // Remove it from the document once the fade has finished, so it can
    // never intercept taps on the app underneath.
    window.setTimeout(() => splash.remove(), FADE_MS)
  }, MINIMUM_VISIBLE_MS)
}

// Registers the service worker (public/sw.js) so the browser can offer
// "Install App" for ShilpSetu. Wrapped in a feature check + try/catch
// so it never breaks the app on browsers that don't support it.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Not fatal - the app still works fine without the service worker,
      // it just won't be installable on this browser.
    })
  })
}
