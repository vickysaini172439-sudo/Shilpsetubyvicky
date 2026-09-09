import { useRef } from 'react'

/**
 * "Take Photo" / "From Gallery" — two buttons, two hidden file inputs.
 *
 * WHY TWO INPUTS AND NOT ONE
 * --------------------------
 * A single <input capture="environment"> behaves differently on every
 * platform: some browsers open the camera and give no way back to the
 * gallery, others ignore the attribute entirely and only ever show the
 * gallery — which is what was happening here. Asking plainly which one
 * the artisan wants is the only version that works the same everywhere.
 *
 * This started life inside Photo Studio. It lives here because Add
 * Product needed the same thing: an artisan holding the piece in one
 * hand should not have to photograph it first, save it to the gallery,
 * and then come back to find it.
 *
 * onPick receives the File. The input's value is cleared either way, so
 * picking the SAME file again still fires a change event — otherwise
 * retaking a photo you just rejected does nothing and looks broken.
 */
export default function PhotoPicker({ onPick, className = '' }) {
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  function handleChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onPick(file)
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="press rounded-xl border-2 border-forest bg-forest text-white py-3 font-semibold flex flex-col items-center gap-1"
        >
          <span aria-hidden="true" className="text-xl leading-none">📷</span>
          <span className="text-sm">Take Photo</span>
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="press rounded-xl border-2 border-forest bg-white text-forest py-3 font-semibold flex flex-col items-center gap-1"
        >
          <span aria-hidden="true" className="text-xl leading-none">🖼️</span>
          <span className="text-sm">From Gallery</span>
        </button>
      </div>

      {/* The camera one carries capture; the gallery one deliberately
          does not. Both restrict to the formats the backend accepts,
          which also nudges iOS into handing over JPEG instead of HEIC. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
