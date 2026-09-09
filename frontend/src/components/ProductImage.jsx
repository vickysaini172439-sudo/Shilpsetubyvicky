import { useEffect, useState } from 'react'
import { imageUrl, productPhotos } from '../services/api.js'
import { themeFor } from '../theme/categoryTheme.js'
import ImageLightbox from './ImageLightbox.jsx'

/**
 * A product photo that degrades gracefully instead of showing a broken
 * image icon.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every screen did the same thing:
 *
 *     {p.image_url ? <img src={...} /> : <div>{emoji}</div>}
 *
 * which handles "this product has no photo" but not "this product has a
 * photo that will not load". The difference mattered enormously: photos
 * were stored on Render's filesystem, which is rebuilt on every deploy,
 * so image_url stayed in the database long after the file was destroyed.
 * The check above saw a URL, rendered an <img>, the request 404'd, and the
 * artisan's storefront filled up with broken-image icons - which is
 * exactly what a visitor was seeing.
 *
 * The storage bug is fixed (photos live in the database now), but rows
 * uploaded before that fix still carry dead "/uploads/..." URLs, and
 * "the network is flaky" is a permanent possibility on a phone. So a
 * failed load falls back to the same category tile as no photo at all.
 * A tile is not a great product image; it is far better than a broken one.
 *
 * ZOOM (opt-in via `zoomable`)
 * ---------------------------
 * Cards crop with object-cover, which is right for a tidy list and wrong
 * for ever seeing the actual piece - so a zoomable photo opens the full,
 * uncropped frame in ImageLightbox, along with any other views the
 * artisan added.
 *
 * It is opt-in rather than automatic because several screens already wrap
 * this component in a <button>. Nesting one button inside another is
 * invalid, and both handlers would fire on one tap - so callers turn zoom
 * on only where the photo is not already inside something clickable.
 */
export default function ProductImage({
  product,
  fallbackCategory,
  className = '',
  emojiClassName = '',
  alt,
  zoomable = false,
}) {
  const [failed, setFailed] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)

  // A different photo deserves a fresh chance to load - otherwise, once
  // one image failed, every product rendered afterwards in a reused
  // component would show the tile even if its own photo is fine.
  useEffect(() => {
    setFailed(false)
  }, [product?.image_url])

  const theme = themeFor(product?.category || fallbackCategory)
  const showTile = !product?.image_url || failed

  if (showTile) {
    return (
      <div
        className={`flex items-center justify-center ${className} ${emojiClassName}`}
        style={{ backgroundColor: theme.color }}
        role="img"
        aria-label={alt || product?.name || 'Product'}
      >
        {theme.emoji}
      </div>
    )
  }

  const photos = zoomable ? productPhotos(product) : []
  const canZoom = zoomable && photos.length > 0

  return (
    <>
      {/* role/tabIndex rather than a <button> wrapper: the className sizes
          this element, and re-parenting it would break every caller's
          layout. */}
      <img
        src={imageUrl(product.image_url)}
        alt={alt || product.name}
        className={canZoom ? `${className} cursor-zoom-in` : className}
        onError={() => setFailed(true)}
        onClick={canZoom ? () => setZoomOpen(true) : undefined}
        onKeyDown={
          canZoom
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setZoomOpen(true)
                }
              }
            : undefined
        }
        role={canZoom ? 'button' : undefined}
        tabIndex={canZoom ? 0 : undefined}
        loading="lazy"
      />

      {zoomOpen && (
        <ImageLightbox
          photos={photos}
          onClose={() => setZoomOpen(false)}
          caption={product?.name}
        />
      )}
    </>
  )
}
