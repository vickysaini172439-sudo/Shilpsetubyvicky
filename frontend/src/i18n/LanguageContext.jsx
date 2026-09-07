import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, FALLBACK_UI_LANGUAGE, STRINGS, translate, UI_LANGUAGES } from './strings.js'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'shilpsetu_ui_language'

// The set of languages the interface itself has been translated into.
const SUPPORTED = UI_LANGUAGES.map((l) => l.code)

/**
 * Given whatever language the artisan picked for their AI writing (which can
 * be any of the twelve in constants.js), work out which of our three
 * interface languages to actually render the app in.
 *
 * Someone who writes their catalogue in Tamil still needs buttons they can
 * read, and we have not translated the interface into Tamil - so they get
 * English chrome while the AI keeps writing to them in Tamil. That is an
 * honest degradation rather than a broken half-Tamil screen.
 */
export function uiLanguageFor(language) {
  return SUPPORTED.includes(language) ? language : FALLBACK_UI_LANGUAGE
}

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return SUPPORTED.includes(stored) ? stored : null
  } catch {
    // Private browsing or blocked storage - fall through to the default.
    return null
  }
}

export function LanguageProvider({ children }) {
  // null means "this person has never been asked yet", which is what the
  // language chooser screen keys off. It is deliberately different from
  // "they chose English", so we never re-ask someone who already answered.
  const [language, setLanguageState] = useState(readStored)

  function setLanguage(next) {
    if (!SUPPORTED.includes(next)) return
    setLanguageState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not fatal - the choice just won't survive a refresh.
    }
  }

  // Keep the <html lang> attribute honest, so screen readers and the
  // browser's own translate prompt behave sensibly.
  useEffect(() => {
    if (!language) return
    document.documentElement.lang = language === 'Hindi' ? 'hi' : 'en'
  }, [language])

  const value = useMemo(() => {
    const active = language || DEFAULT_LANGUAGE
    return {
      // The raw stored answer: null until they have actually chosen.
      language,
      // What to render in right now - never null, so t() is always safe.
      activeLanguage: active,
      hasChosen: Boolean(language),
      setLanguage,
      t: (key) => translate(key, active),
      // Exposed so a screen can check a key exists before using it.
      has: (key) => Boolean(STRINGS[key]),
    }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    // Rendering outside the provider should be impossible, but returning a
    // working fallback beats crashing the whole app over a label.
    return {
      language: null,
      activeLanguage: DEFAULT_LANGUAGE,
      hasChosen: false,
      setLanguage: () => {},
      t: (key) => translate(key, DEFAULT_LANGUAGE),
      has: (key) => Boolean(STRINGS[key]),
    }
  }
  return ctx
}

/** Shorthand for screens that only need the translator. */
export function useT() {
  return useLanguage().t
}
