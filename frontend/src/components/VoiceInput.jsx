import { useEffect, useRef, useState } from 'react'

/**
 * A reusable "speak instead of typing" button.
 *
 * Why this exists: typing Hindi on a phone means installing and learning a
 * Devanagari keyboard, which is a genuine barrier for the artisans this app
 * is built for. Speaking is instant and needs nothing extra. This uses the
 * browser's built-in Web Speech API, so it is completely free and needs no
 * backend, no API key and no app install.
 *
 * Usage:
 *   <VoiceInput language="Hindi" onTranscript={(text) => append(text)} />
 *
 * onTranscript is called with each newly finished phrase, so the parent can
 * decide whether to append it or replace what is there.
 */

// The browser expects locale codes, not language names.
const LOCALES = {
  Hindi: 'hi-IN',
  // Hinglish is Hindi spoken with English words mixed in, written in Roman
  // letters. There is no "hinglish" locale, and hi-IN would return
  // Devanagari, so en-IN is the correct choice - it is trained on Indian
  // accents and returns Roman script, which is exactly what Hinglish is.
  Hinglish: 'en-IN',
  English: 'en-IN',
  Bengali: 'bn-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Marathi: 'mr-IN',
  Gujarati: 'gu-IN',
  Punjabi: 'pa-IN',
  Kannada: 'kn-IN',
  Malayalam: 'ml-IN',
  Odia: 'or-IN',
}

export function speechLocaleFor(language) {
  return LOCALES[language] || 'hi-IN'
}

export const SPEECH_SUPPORTED =
  typeof window !== 'undefined' &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

// Friendly explanations instead of raw browser error codes.
const ERROR_MESSAGES = {
  'not-allowed': 'Microphone blocked. Allow microphone access for this site and try again.',
  'service-not-allowed': 'Microphone blocked by your browser settings.',
  'no-speech': "Didn't catch that — please speak a little louder.",
  'audio-capture': 'No microphone found. Please check your device.',
  network: 'Voice typing needs an internet connection.',
}

export default function VoiceInput({
  onTranscript,
  language = 'Hindi',
  showLanguagePicker = true,
  label = 'Speak',
  className = '',
}) {
  const [locale, setLocale] = useState(speechLocaleFor(language))
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  // If the artisan changes their language elsewhere, follow it.
  useEffect(() => {
    setLocale(speechLocaleFor(language))
  }, [language])

  // Never leave the microphone running when the screen closes.
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop()
      } catch {
        /* already stopped */
      }
    }
  }, [])

  function start() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    setError('')
    setInterim('')

    const recognition = new SpeechRecognition()
    recognition.lang = locale
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let live = ''
      // Only send phrases the browser has finalised; show the rest as a
      // live preview so the user can see it is hearing them.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          const clean = text.trim()
          if (clean) onTranscript?.(clean)
        } else {
          live += text
        }
      }
      setInterim(live)
    }

    recognition.onerror = (event) => {
      setError(ERROR_MESSAGES[event.error] || 'Voice typing stopped. Please try again.')
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      setInterim('')
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setListening(true)
    } catch {
      setError('Could not start the microphone. Please try again.')
    }
  }

  function stop() {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* already stopped */
    }
    setListening(false)
  }

  if (!SPEECH_SUPPORTED) {
    return (
      <p className={`text-xs text-gray-500 ${className}`}>
        Voice typing isn't supported in this browser. Chrome or Edge support it — for now,
        please type instead.
      </p>
    )
  }

  return (
    <div className={className}>
      <div className="flex gap-2 items-center">
        {showLanguagePicker && (
          <select
            className="p-2 rounded-lg border border-gray-300 text-sm"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={listening}
            aria-label="Speaking language"
          >
            <option value="hi-IN">हिंदी</option>
            <option value="en-IN">English / Hinglish</option>
            <option value="bn-IN">বাংলা</option>
            <option value="ta-IN">தமிழ்</option>
            <option value="te-IN">తెలుగు</option>
            <option value="mr-IN">मराठी</option>
            <option value="gu-IN">ગુજરાતી</option>
            <option value="pa-IN">ਪੰਜਾਬੀ</option>
            <option value="kn-IN">ಕನ್ನಡ</option>
            <option value="ml-IN">മലയാളം</option>
            <option value="or-IN">ଓଡ଼ିଆ</option>
          </select>
        )}

        <button
          type="button"
          onClick={listening ? stop : start}
          className={`flex-1 rounded-full font-semibold py-2 px-4 text-sm transition-colors ${
            listening ? 'bg-red-500 text-white animate-pulse' : 'bg-forest text-white'
          }`}
        >
          {listening ? '⏹ Stop' : `🎙️ ${label}`}
        </button>
      </div>

      {listening && (
        <p className="text-xs text-forest mt-1">
          Listening… {interim && <span className="italic text-gray-500">{interim}</span>}
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
