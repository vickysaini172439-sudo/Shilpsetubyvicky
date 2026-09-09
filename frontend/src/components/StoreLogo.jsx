import { useEffect, useState } from 'react'
import { imageUrl } from '../services/api.js'

/**
 * A business logo that disappears instead of breaking.
 *
 * Same reasoning as ProductImage: logos used to live on Render's
 * filesystem, which is rebuilt on every deploy, so logo_url outlived the
 * file it pointed at and storefronts opened with a broken-image icon
 * where the shop's identity should be. Photos are stored in the database
 * now, but rows saved before that fix still carry dead URLs.
 *
 * A logo has no sensible stand-in - an emoji tile in place of a shop's
 * mark looks like a mistake - so a failed load renders nothing at all,
 * which is exactly how the page looks for an artisan who never uploaded
 * one. That is a layout the design already handles.
 */
export default function StoreLogo({ url, alt, className = '' }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [url])

  if (!url || failed) return null

  return (
    <img
      src={imageUrl(url)}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
