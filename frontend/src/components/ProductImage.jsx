import { useEffect, useState } from 'react'
import { imageUrl } from '../services/api.js'
import { themeFor } from '../theme/categoryTheme.js'

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
 */
export default function ProductImage({
  product,
  fallbackCategory,
  className = '',
  emojiClassName = '',
  alt,
}) {
  const [failed, setFailed] = useState(false)

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

  return (
    <img
      src={imageUrl(product.image_url)}
      alt={alt || product.name}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}
