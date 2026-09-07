import { useEffect, useState } from 'react'
import { SPEECH_SUPPORTED } from './VoiceInput.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

/**
 * Lets the artisan decide how they want to fill a form in: by typing, or by
 * speaking.
 *
 * WHY THIS IS AN EXPLICIT SETTING
 * -------------------------------
 * Both ways always work - a microphone never replaces a text box, and every
 * field stays fully typeable no matter what is selected here. So strictly
 * speaking the app could just show the mics to everyone and let people
 * ignore them.
 *
 * It doesn't, for two reasons:
 *
 *  1. A mic beside every field takes real width away from the text box on a
 *     small phone. Someone who is a confident typist is paying for a feature
 *     they will never touch, on the screen where space is tightest.
 *
 *  2. For a first-time smartphone user, an unfamiliar button next to every
 *     single box reads as clutter, or worse as something they are *supposed*
 *     to use. Being asked once, in plain language, is calmer than fourteen
 *     unexplained microphones.
 *
 * So the choice is theirs, it is remembered, and it is reversible at any
 * moment. The "Speak" option is worded to make clear that typing still works,
 * because the point is to add a way in, never to take one away.
 */

const STORAGE_KEY = 'shilpsetu_input_mode'

export const INPUT_MODES = {
  KEYBOARD: 'keyboard',
  VOICE: 'voice',
}

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === INPUT_MODES.KEYBOARD || stored === INPUT_MODES.VOICE ? stored : null
  } catch {
    return null
  }
}

/**
 * Returns [mode, setMode].
 *
 * Defaults to VOICE when the browser supports speech, because the artisans
 * this app is built for are far more likely to be blocked by a Devanagari
 * keyboard than by a microphone - and the mics are visibly optional either
 * way. On a browser with no speech support the answer is forced to KEYBOARD,
 * since offering a choice that cannot be honoured is worse than not asking.
 */
export function useInputMode() {
  const [mode, setModeState] = useState(
    () => (SPEECH_SUPPORTED ? readStored() || INPUT_MODES.VOICE : INPUT_MODES.KEYBOARD),
  )

  useEffect(() => {
    if (!SPEECH_SUPPORTED && mode !== INPUT_MODES.KEYBOARD) {
      setModeState(INPUT_MODES.KEYBOARD)
    }
  }, [mode])

  function setMode(next) {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not fatal - the choice just won't survive a refresh.
    }
  }

  return [mode, setMode]
}

export default function InputModeToggle({ mode, onChange, className = '' }) {
  const { t } = useLanguage()

  // Nothing to choose between on a browser that can't listen. Rendering an
  // explanation here would just be an apology attached to a form that works
  // perfectly well by typing.
  if (!SPEECH_SUPPORTED) return null

  const options = [
    { value: INPUT_MODES.KEYBOARD, icon: '⌨️', label: t('input.keyboard') },
    { value: INPUT_MODES.VOICE, icon: '🎙️', label: t('input.voice') },
  ]

  const hint = mode === INPUT_MODES.VOICE ? t('input.voiceHint') : t('input.keyboardHint')

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-4 ${className}`}>
      <p className="text-sm font-medium text-charcoal mb-2">{t('input.label')}</p>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('input.label')}>
        {options.map((option) => {
          const active = mode === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`press rounded-xl py-2.5 px-2 border-2 flex items-center justify-center gap-2 font-medium transition-colors ${
                active
                  ? 'border-forest bg-forest text-white'
                  : 'border-gray-200 bg-white text-charcoal'
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">{option.icon}</span>
              <span className="text-sm">{option.label}</span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 mt-2 leading-snug">{hint}</p>
      <p className="text-[11px] text-gray-400 mt-1">{t('input.changeAnytime')}</p>
    </div>
  )
}
