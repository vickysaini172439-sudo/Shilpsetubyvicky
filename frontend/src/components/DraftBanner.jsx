import { describeAge } from '../services/drafts.js'

/**
 * "You have unfinished work here" — the bar that appears when an artisan
 * comes back to a screen they left mid-way.
 *
 * The two buttons are deliberately unequal. Continue is the filled,
 * obvious one, because it is what someone who tapped Home by accident
 * wants. Start something new is plain text, because it throws work away
 * and should take a deliberate second look — which is exactly the
 * decision the app used to make silently, for them, every single time.
 */
export default function DraftBanner({ savedAt, what, onContinue, onDiscard }) {
  return (
    <div className="mx-5 mt-4 bg-white border border-sand rounded-2xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-charcoal">You left something unfinished</p>
      <p className="text-xs text-gray-600 mt-1 leading-snug">
        {what} — saved {describeAge(savedAt)}. It is still here.
      </p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={onContinue}
          className="press flex-1 bg-forest text-white text-sm font-semibold py-2.5 rounded-full"
        >
          Continue it
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="press flex-1 text-gray-500 text-sm font-medium py-2.5"
        >
          Start something new
        </button>
      </div>
    </div>
  )
}
