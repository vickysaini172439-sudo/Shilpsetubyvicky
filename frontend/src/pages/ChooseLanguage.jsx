import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogoMark, WovenBand, BlockPrintBackdrop } from '../components/CraftArt.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { UI_LANGUAGES } from '../i18n/strings.js'

/**
 * The very first screen a new user sees, before they are asked for a single
 * detail about themselves.
 *
 * The one design rule that matters here: the QUESTION ITSELF cannot be
 * written in only one language. Asking "which language do you prefer?" in
 * English is useless to the person who needed to be asked. So the heading
 * appears in all three at once, and each option is written in its own
 * language with a real sample sentence underneath - someone who cannot read
 * two of the three can still recognise and pick their own.
 */
export default function ChooseLanguage() {
  const { language, setLanguage } = useLanguage()
  const [picked, setPicked] = useState(language || null)
  const navigate = useNavigate()
  const locationHook = useLocation()

  // If we were sent here from somewhere specific (e.g. the user tapped
  // "Get Started"), go back there afterwards instead of always to Landing.
  const nextPath = locationHook.state?.next || '/'

  function confirm() {
    if (!picked) return
    setLanguage(picked)
    navigate(nextPath, { replace: true })
  }

  return (
    <div className="page-in min-h-screen bg-ivory flex flex-col">
      {/* --- Brand panel ------------------------------------------------- */}
      <div className="relative overflow-hidden craft-weave craft-weave-animated px-6 pt-10 pb-8 rounded-b-[2rem] shadow-lg">
        <div className="absolute inset-0 pointer-events-none">
          <BlockPrintBackdrop />
        </div>
        <div className="relative flex flex-col items-center text-center">
          <LogoMark size={64} animated />
          <h1 className="text-2xl font-bold text-ivory mt-3">ShilpSetu</h1>
          <WovenBand className="w-24 h-3 mt-3" light />
        </div>
      </div>

      {/* --- The question, in all three languages ------------------------ */}
      <div className="px-6 pt-7 flex-1">
        <div className="text-center mb-6 stagger">
          <h2 className="text-xl font-bold text-forest leading-snug">अपनी भाषा चुनें</h2>
          <h2 className="text-xl font-bold text-forest leading-snug">Apni language chunein</h2>
          <h2 className="text-xl font-bold text-forest leading-snug">Choose your language</h2>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            आप किस भाषा में सबसे आसानी से पढ़ पाते हैं?
            <br />
            Aap kis language mein sabse aaraam se padh paate hain?
          </p>
        </div>

        <div className="space-y-3 stagger">
          {UI_LANGUAGES.map((option) => {
            const active = picked === option.code
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setPicked(option.code)}
                aria-pressed={active}
                className={`press w-full text-left rounded-2xl p-4 border-2 flex items-start gap-3 transition-colors ${
                  active
                    ? 'border-forest bg-white shadow-md'
                    : 'border-transparent bg-white/70 shadow-sm'
                }`}
              >
                <span aria-hidden="true" className="text-2xl leading-none mt-0.5">
                  {option.flag}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-lg font-semibold text-charcoal">{option.native}</span>
                  <span className="block text-sm text-gray-600 leading-snug mt-0.5">
                    {option.sample}
                  </span>
                </span>
                {/* A filled circle rather than a tick glyph, so it reads as
                    "selected" without depending on reading anything. */}
                <span
                  aria-hidden="true"
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center ${
                    active ? 'border-forest' : 'border-gray-300'
                  }`}
                >
                  {active && <span className="w-3 h-3 rounded-full bg-forest" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* --- Confirm ----------------------------------------------------- */}
      <div className="px-6 pt-6 pb-8">
        <button
          type="button"
          onClick={confirm}
          disabled={!picked}
          className="press w-full bg-terracotta text-white font-semibold py-3 rounded-full shadow-md disabled:opacity-50"
        >
          {picked === 'Hindi' ? 'आगे बढ़ें' : 'Continue'}
        </button>
        <p className="text-center text-xs text-gray-500 mt-3 leading-relaxed">
          इसे बाद में बदल सकते हैं · You can change this later
        </p>
      </div>
    </div>
  )
}
