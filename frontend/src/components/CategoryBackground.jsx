import { useId } from 'react'
import { themeFor } from '../theme/categoryTheme.js'

// Renders a full-bleed, low-opacity SVG texture that matches a craft
// category - basket-weave crossing lines for Textiles, pot silhouettes for
// Pottery, wood-grain rings for Wood Carving, and so on. It's decoration
// only (aria-hidden, pointer-events none) and always sits *behind* real
// content, so it's safe to drop into any relative-positioned container.
//
// Each pattern tile is intentionally subtle (white lines/shapes at ~18-25%
// opacity) so it reads as texture on the category colour rather than
// competing with text or product photos placed on top of it.
function PatternDefs({ id, pattern }) {
  const stroke = 'rgba(255,255,255,0.28)'
  const fill = 'rgba(255,255,255,0.22)'

  switch (pattern) {
    case 'weave':
      // Basket-weave: two families of parallel diagonal lines crossing.
      return (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
          <path d="M0 28 L28 0" stroke={stroke} strokeWidth="2.5" />
          <path d="M-7 7 L7 -7" stroke={stroke} strokeWidth="2.5" />
          <path d="M21 35 L35 21" stroke={stroke} strokeWidth="2.5" />
          <path d="M0 0 L28 28" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        </pattern>
      )
    case 'pottery':
      // Repeating pot/urn silhouette outlines.
      return (
        <pattern id={id} width="46" height="56" patternUnits="userSpaceOnUse">
          <path
            d="M23 6 c-4 0-6 2-6 4 c0 1 1 2 2 2 c-3 3-5 8-5 13 c0 9 4 15 9 15 s9-6 9-15 c0-5-2-10-5-13 c1 0 2-1 2-2 c0-2-2-4-6-4z"
            fill="none" stroke={stroke} strokeWidth="2"
          />
          <ellipse cx="23" cy="6" rx="5" ry="1.6" fill="none" stroke={stroke} strokeWidth="1.5" />
        </pattern>
      )
    case 'wood':
      // Concentric arcs, like wood-grain / tree rings.
      return (
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M-4 40 Q20 8 44 40" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M-8 40 Q20 0 48 40" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
          <path d="M0 40 Q20 18 40 40" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
        </pattern>
      )
    case 'metal':
      // Diamond / lozenge grid, like hammered or engraved metalwork.
      return (
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
          <rect x="7" y="7" width="16" height="16" fill="none" stroke={stroke} strokeWidth="2" transform="rotate(45 15 15)" />
          <circle cx="0" cy="0" r="1.6" fill={fill} />
          <circle cx="30" cy="30" r="1.6" fill={fill} />
        </pattern>
      )
    case 'jewelry':
      // Scattered bead circles of varying size.
      return (
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="10" r="3.4" fill={fill} />
          <circle cx="28" cy="6" r="2" fill={fill} />
          <circle cx="36" cy="26" r="4" fill={fill} />
          <circle cx="14" cy="32" r="2.6" fill={fill} />
          <circle cx="2" cy="38" r="1.8" fill={fill} />
        </pattern>
      )
    case 'paint':
      // Soft brush-stroke blobs.
      return (
        <pattern id={id} width="50" height="42" patternUnits="userSpaceOnUse">
          <ellipse cx="12" cy="12" rx="11" ry="5" fill={fill} transform="rotate(-18 12 12)" />
          <ellipse cx="38" cy="28" rx="9" ry="4" fill="rgba(255,255,255,0.16)" transform="rotate(24 38 28)" />
        </pattern>
      )
    case 'bamboo':
      // Vertical bamboo stalks with node ticks.
      return (
        <pattern id={id} width="24" height="40" patternUnits="userSpaceOnUse">
          <line x1="6" y1="0" x2="6" y2="40" stroke={stroke} strokeWidth="2.5" />
          <line x1="2" y1="13" x2="10" y2="13" stroke={stroke} strokeWidth="2" />
          <line x1="2" y1="27" x2="10" y2="27" stroke={stroke} strokeWidth="2" />
        </pattern>
      )
    case 'leather':
      // Cross-stitch "x" grid, like tooled/stitched leather.
      return (
        <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M4 4 L16 16 M16 4 L4 16" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </pattern>
      )
    case 'thread':
      // Looping scalloped thread, like embroidery chain-stitch.
      return (
        <pattern id={id} width="32" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 14 Q8 2 16 14 T32 14" fill="none" stroke={stroke} strokeWidth="2.2" />
        </pattern>
      )
    case 'dots':
    default:
      // Simple polka-dot grid - the calm, generic default.
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.2" fill={fill} />
        </pattern>
      )
  }
}

/**
 * Full-bleed decorative texture layer. Drop it as the FIRST child inside a
 * `relative` container that already has the category colour as its
 * background (see CategoryBanner.jsx for the common case), then put real
 * content in a sibling with `relative z-10`.
 */
export default function CategoryBackground({ category, pattern, className = '' }) {
  const uid = useId().replace(/[:]/g, '')
  const patternKey = pattern || themeFor(category).pattern
  const patternId = `cat-pattern-${patternKey}-${uid}`

  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <PatternDefs id={patternId} pattern={patternKey} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
