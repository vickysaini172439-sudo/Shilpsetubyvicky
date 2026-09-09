import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A full-screen photo viewer with zoom.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every photo in this app was displayed with `object-cover`, which fills
 * its box by cropping whatever does not fit. That is the right choice for
 * a card in a list - it keeps the grid tidy - but it meant nobody, artisan
 * or customer, could ever see the whole photograph. A tall wall hanging
 * showed its middle third. The artisan had photographed the piece
 * properly and the app was quietly hiding most of it.
 *
 * So this shows the image with `object-contain` instead: the entire frame,
 * uncropped, letterboxed against black. Zoom is then what makes the detail
 * legible - the stitching, the grain, the hammer marks that justify a
 * handmade price.
 *
 * Gestures are handled here rather than with a library, because the CDN is
 * not reachable from this build and the whole behaviour is a few dozen
 * lines: pinch with two fingers, double-tap to toggle, drag to pan while
 * zoomed, swipe sideways between photos while not.
 */

const MAX_SCALE = 4
const DOUBLE_TAP_MS = 300
const SWIPE_THRESHOLD = 60

export default function ImageLightbox({ photos = [], startIndex = 0, onClose, caption }) {
  const count = photos.length

  const [index, setIndex] = useState(() => {
    if (!count) return 0
    return Math.min(Math.max(startIndex, 0), count - 1)
  })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  // Drives whether the transform animates. Panning and pinching must
  // track the finger exactly; a double-tap zoom looks better eased.
  const [gesturing, setGesturing] = useState(false)

  const gesture = useRef({})
  const lastTapAt = useRef(0)

  const reset = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const go = useCallback(
    (delta) => {
      if (count < 2) return
      setIndex((current) => (current + delta + count) % count)
      reset()
    },
    [count, reset],
  )

  // Keyboard support is not a nicety here: this gets demonstrated on a
  // laptop, where there is no pinch and no swipe.
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose?.()
      else if (event.key === 'ArrowRight') go(1)
      else if (event.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)

    // Stop the page behind the viewer scrolling under it.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [go, onClose])

  if (!count) return null
  const photo = photos[Math.min(index, count - 1)]
  if (!photo) return null

  function spread(touches) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function clampScale(value) {
    return Math.min(MAX_SCALE, Math.max(1, value))
  }

  function handleTouchStart(event) {
    setGesturing(true)
    if (event.touches.length === 2) {
      gesture.current = {
        mode: 'pinch',
        startSpread: spread(event.touches) || 1,
        startScale: scale,
      }
    } else if (event.touches.length === 1) {
      gesture.current = {
        mode: 'drag',
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
        startOffset: offset,
        swipeX: 0,
      }
    }
  }

  function handleTouchMove(event) {
    const active = gesture.current

    if (active.mode === 'pinch' && event.touches.length === 2) {
      const next = clampScale(active.startScale * (spread(event.touches) / active.startSpread))
      setScale(next)
      // Snapping back to 1 should also recentre, otherwise the photo can
      // settle off-screen with no way to bring it back.
      if (next === 1) setOffset({ x: 0, y: 0 })
      return
    }

    if (active.mode === 'drag' && event.touches.length === 1) {
      const dx = event.touches[0].clientX - active.startX
      const dy = event.touches[0].clientY - active.startY

      if (scale > 1) {
        setOffset({ x: active.startOffset.x + dx, y: active.startOffset.y + dy })
      } else {
        // Not zoomed, so a sideways drag means "show me the next view".
        active.swipeX = dx
      }
    }
  }

  function handleTouchEnd() {
    const active = gesture.current
    setGesturing(false)

    if (active.mode === 'drag' && scale === 1 && Math.abs(active.swipeX || 0) > SWIPE_THRESHOLD) {
      go(active.swipeX < 0 ? 1 : -1)
    }
    gesture.current = {}
  }

  // Double-tap toggles zoom. Tracked by hand because a plain dblclick
  // event is unreliable on touch.
  function handleImageTap(event) {
    event.stopPropagation()
    const now = Date.now()
    if (now - lastTapAt.current < DOUBLE_TAP_MS) {
      if (scale > 1) reset()
      else setScale(2.5)
      lastTapAt.current = 0
    } else {
      lastTapAt.current = now
    }
  }

  // Closing the viewer must not also close whatever opened it. On the
  // storefront this sits inside the product modal, whose backdrop closes
  // on click - without stopping the event here, dismissing the zoom would
  // close the product behind it and dump the visitor back in the list.
  function dismiss(event) {
    event.stopPropagation()
    onClose?.()
  }

  function handleWheel(event) {
    const next = clampScale(scale - event.deltaY * 0.002)
    setScale(next)
    if (next === 1) setOffset({ x: 0, y: 0 })
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label={caption || 'Product photo'}
    >
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/70 text-sm font-medium">
          {count > 1 ? `${index + 1} / ${count}` : ''}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="w-10 h-10 rounded-full bg-white/15 text-white text-lg leading-none flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <div
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center relative"
        style={{ touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* object-contain is the actual fix for "we cannot see the full
            photo" - the whole frame, never cropped. */}
        <img
          src={photo.url}
          alt={caption || 'Product photo'}
          onClick={handleImageTap}
          draggable={false}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: gesturing ? 'none' : 'transform 160ms ease-out',
          }}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1) }}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white text-lg flex items-center justify-center"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(1) }}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white text-lg flex items-center justify-center"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="flex-shrink-0 px-4 pb-5 pt-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-white/40 text-[11px] mb-3">
          {scale > 1 ? 'Drag to move · double-tap to fit' : 'Pinch or double-tap to zoom'}
        </p>

        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto justify-start sm:justify-center pb-1">
            {photos.map((item, i) => (
              <button
                key={item.id ?? i}
                type="button"
                onClick={() => { setIndex(i); reset() }}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === index}
                className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                  i === index ? 'border-white' : 'border-transparent opacity-60'
                }`}
              >
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
