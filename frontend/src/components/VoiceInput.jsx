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
 * Two shapes:
 *   <VoiceInput language="Hindi" onTranscript={fn} />              full bar
 *   <VoiceInput language="Hindi" onTranscript={fn} compact />      mic only
 *
 * The compact form is for sitting beside a single text field (see the
 * account creation screen), where a full-width bar per field would bury
 * the form. onTranscript is called with each newly finished phrase, so the
 * parent decides whether to append it or replace what is there.
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
  compact = false,
}) {
  const [locale, setLocale] = useState(speechLocaleFor(language))
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  // Everything already handed to the parent during this listening session,
  // kept as the text itself rather than a position in the results list.
  // The onresult handler below explains why the text is the only reliable
  // record.
  const emittedRef = useRef('')

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
    // A fresh session starts a fresh results list, so nothing has been
    // emitted from it yet.
    emittedRef.current = ''

    const recognition = new SpeechRecognition()
    recognition.lang = locale
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let live = ''
      let finalText = ''

      // WHY THIS COMPARES TEXT INSTEAD OF COUNTING RESULTS
      // --------------------------------------------------
      // The obvious handler starts at event.resultIndex, "the first result
      // that changed since last time". With continuous = true, several
      // Android Chrome builds report 0 there on every event, so an
      // index-based guard was added - remember the highest index already
      // sent, emit anything above it.
      //
      // That was still not enough, and this is the bug artisans kept
      // hitting: on the phones this app is actually used on, the
      // recogniser re-reports the SAME phrase at a NEW index as it grows,
      // each copy flagged final. "this", "this is", "this is a", "this is
      // a wall" - every one of them sits at a higher index than the last,
      // so every one passed the guard, and the description field filled
      // with a staircase of its own prefixes.
      //
      // So do not trust the browser about what is new. Rebuild the entire
      // final transcript on every event, compare it against what has
      // already been sent, and emit only the part that was not there
      // before. A growing prefix then contributes just its new tail, and a
      // re-report contributes nothing at all - whichever way the browser
      // chooses to behave.
      // Collapse the staircase as we go. When one final result is a
      // longer version of the one before it, they are the SAME phrase
      // being refined, not two phrases - so keep the longer and throw the
      // shorter away. Concatenating them instead is what produced
      // "this this is this is a this is a wall" in the first place.
      const parts = []
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript.trim()
        if (!result.isFinal) {
          live += result[0].transcript
          continue
        }
        if (!text) continue
        const last = parts.length ? parts[parts.length - 1] : ''
        if (last && (text.startsWith(last) || last.startsWith(text))) {
          parts[parts.length - 1] = text.length >= last.length ? text : last
        } else {
          parts.push(text)
        }
      }
      finalText = parts.join(' ').replace(/\s+/g, ' ').trim()

      const already = emittedRef.current
      let addition = ''

      if (!finalText || finalText === already) {
        // Nothing new in this event.
        addition = ''
      } else if (already && finalText.startsWith(already)) {
        // The cumulative case: this event repeats everything so far and
        // adds to the end. Only the end is news.
        addition = finalText.slice(already.length).trim()
        emittedRef.current = finalText
      } else if (already && already.startsWith(finalText)) {
        // The recogniser has gone backwards and re-reported a shorter
        // version of what we already sent. Nothing to add.
        addition = ''
      } else {
        // A genuinely separate phrase - browsers whose results list is
        // per-utterance rather than cumulative arrive here.
        addition = finalText
        emittedRef.current = already ? `${already} ${finalText}` : finalText
      }

      if (addition) onTranscript?.(addition)
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

  // ------------------------------------------------------------- compact
  // A single round mic button meant to sit inside/next to one field. It
  // renders nothing at all when the browser can't do speech, rather than
  // an apology - beside a field, an error message about an unrelated
  // capability is just noise, and the field still works by typing.
  if (compact) {
    if (!SPEECH_SUPPORTED) return null
    return (
      <span className={`inline-flex flex-col items-end ${className}`}>
        <button
          type="button"
          onClick={listening ? stop : start}
          aria-label={listening ? 'Stop voice typing' : `${label} — voice typing`}
          aria-pressed={listening}
          title={listening ? 'Stop' : label}
          className={`press w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-sm transition-colors ${
            listening ? 'bg-red-500 text-white animate-pulse' : 'bg-forest/10 text-forest'
          }`}
        >
          {listening ? '⏹' : '🎙️'}
        </button>
        {listening && interim && (
          <span className="text-[10px] italic text-gray-500 mt-0.5 max-w-[8rem] truncate">
            {interim}
          </span>
        )}
        {error && <span className="text-[10px] text-red-600 mt-0.5 max-w-[8rem]">{error}</span>}
      </span>
    )
  }

  // ---------------------------------------------------------------- full
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
