import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext.jsx'

// Public support page - reachable whether or not the artisan is logged in
// (linked from the Landing page footer, the in-app header's help icon, and
// the Profile page), because problems come up mid-work and shouldn't be
// gated behind navigating back to a specific logged-in screen.
const FAQ_ITEMS = [
  {
    q: 'My product photo isn’t improving in AI Photo Studio',
    a: 'Make sure your photo is well-lit and the product fills most of the frame before uploading. If "AI Photo Studio" (OpenAI/Gemini) is unavailable on your setup, the app automatically falls back to "Basic Enhance", which still sharpens and brightens your photo without AI. You can see which one ran from the label under your photo after processing.',
  },
  {
    q: 'The microphone / voice typing button isn’t working',
    a: 'Voice typing needs microphone permission in your browser and works best in Chrome. If your browser asks for microphone access, choose Allow. Some browsers (and most private/incognito windows) block this feature entirely - in that case, just type instead, it works exactly the same.',
  },
  {
    q: 'I forgot my password',
    a: 'On the Login page, tap "Forgot password?" and answer the security question you chose when you registered. If you can’t remember your answer either, contact us below and we’ll help you regain access.',
  },
  {
    q: 'Which language should I write my catalogue in?',
    a: 'Use whichever is easiest for you - Hindi, Hinglish (Hindi written in English letters, like "yeh haathon se bana hai"), English, or any other supported language. Set your preferred language once in Profile and every AI feature (catalogue writing, voice typing, the AI Business Manager) will use it automatically.',
  },
  {
    q: 'My storefront link / QR code isn’t showing my products',
    a: 'Only products marked "Published" (not "Draft") appear on your public storefront. Open My Products, edit the product, and make sure its status is set to Published. It can take a few seconds to reflect after saving.',
  },
  {
    q: 'I don’t understand the price the AI suggested',
    a: 'Smart Pricing breaks the suggestion down into material cost, your labour time, and a fair profit margin. If a number still feels wrong, message the AI Business Manager directly and ask it to explain that specific product’s pricing in your own words - it will answer in your chosen language.',
  },
]

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 text-left px-4 py-3"
      >
        <span className="font-medium text-charcoal text-sm">{item.q}</span>
        <span className="text-forest text-lg flex-shrink-0">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</p>
      )}
    </div>
  )
}

export default function Help() {
  const { user } = useAuth()
  const [openIndex, setOpenIndex] = useState(null)
  const backTo = user ? '/dashboard' : '/'

  return (
    <div className="min-h-screen bg-ivory">
      <header className="sticky top-0 z-10 bg-forest text-white px-4 py-3 shadow-md flex items-center gap-3">
        <Link to={backTo} className="text-xl leading-none" aria-label="Back">
          ←
        </Link>
        <h1 className="text-lg font-semibold">Help & Support</h1>
      </header>

      <div className="p-5">
        <p className="text-charcoal mb-5">
          Facing an issue while photographing, listing, or pricing your products? Check the
          common questions below, or reach out to us directly - we usually reply quickly.
        </p>

        <h2 className="font-semibold text-charcoal mb-3">Common questions</h2>
        <div className="space-y-2 mb-8">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        <h2 className="font-semibold text-charcoal mb-3">Still stuck? Contact us</h2>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-forest text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              V
            </div>
            <div>
              <p className="font-semibold text-charcoal">Vicky</p>
              <p className="text-xs text-gray-500">ShilpSetu Team</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <a href="mailto:vickysaini172439@gmail.com" className="flex items-center gap-3 text-charcoal">
              <span className="text-lg">✉️</span>
              <span className="underline break-all">vickysaini172439@gmail.com</span>
            </a>
            <a href="tel:+919911003813" className="flex items-center gap-3 text-charcoal">
              <span className="text-lg">📞</span>
              <span className="underline">+91 99110 03813</span>
            </a>
            <a
              href="https://wa.me/919911003813"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-3 text-charcoal"
            >
              <span className="text-lg">💬</span>
              <span className="underline">Message on WhatsApp</span>
            </a>
            <div className="flex items-start gap-3 text-charcoal">
              <span className="text-lg">📍</span>
              <span>YMCA University, Faridabad, Haryana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
