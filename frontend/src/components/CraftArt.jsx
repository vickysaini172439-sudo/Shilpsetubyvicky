/**
 * Original artwork for ShilpSetu, drawn as SVG rather than loaded as
 * image files.
 *
 * Why vector art instead of photographs:
 *   - It downloads with the page itself. No extra network request, which
 *     matters on a demo venue's wifi and on an artisan's 3G connection.
 *   - It stays sharp on every screen, from a cheap phone to a projector.
 *   - It is drawn from scratch here, so there is no licence, attribution
 *     or copyright question attached to any of it.
 *   - It recolours itself from the app's own palette, so it can never
 *     look "stock" or pasted in from somewhere else.
 *
 * The motifs are deliberately drawn from the craft world the app serves:
 * a bridge threaded like a loom (the name literally means "craft bridge"),
 * warp-and-weft weaving, a potter's vessel, and a repeating block-print
 * diamond of the kind hand-stamped onto Indian textiles.
 */

const FOREST = '#1F4D3A'
const TERRACOTTA = '#C96B4B'
const SAND = '#D6A85F'
const IVORY = '#FBE8DC'

/**
 * The ShilpSetu mark: an arch (setu = bridge) with a thread weaving
 * through it (shilp = craft). Used on the landing, login and register
 * screens, and mirrored by the boot splash in index.html.
 *
 * `animated` draws the strokes on as if being sketched. The dash values
 * are generous overestimates of each path's length - anything larger
 * than the true length still produces a clean draw-on.
 */
export function LogoMark({ size = 88, animated = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role="img"
      aria-label="ShilpSetu"
    >
      {/* The bridge arch */}
      <path
        d="M14 74 C14 38, 86 38, 86 74"
        stroke={SAND}
        strokeWidth="5.5"
        strokeLinecap="round"
        className={animated ? 'draw-on' : ''}
        style={animated ? { animationDelay: '0.05s' } : undefined}
      />
      {/* The craft thread, weaving over and under */}
      <path
        d="M18 62 C31 50, 37 74, 50 62 C63 50, 69 74, 82 62"
        stroke={TERRACOTTA}
        strokeWidth="4.5"
        strokeLinecap="round"
        className={animated ? 'draw-on' : ''}
        style={animated ? { animationDelay: '0.4s' } : undefined}
      />
      {/* Piers the arch stands on */}
      <path
        d="M14 74 L14 88 M86 74 L86 88"
        stroke={FOREST}
        strokeWidth="5.5"
        strokeLinecap="round"
        className={animated ? 'draw-on' : ''}
        style={animated ? { animationDelay: '0.7s' } : undefined}
      />
    </svg>
  )
}

/**
 * A woven band: warp threads crossed by weft threads, the way cloth is
 * actually built on a loom. Used as a slim decorative divider under
 * headings. `light` flips it for use on dark backgrounds.
 */
export function WovenBand({ className = '', light = false }) {
  const warp = light ? 'rgba(251,232,220,0.55)' : 'rgba(31,77,58,0.35)'
  const weft = light ? SAND : TERRACOTTA
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {/* warp - the threads held taut on the loom */}
      {Array.from({ length: 25 }, (_, i) => (
        <line
          key={`warp-${i}`}
          x1={i * 8 + 2}
          y1="0"
          x2={i * 8 + 2}
          y2="12"
          stroke={warp}
          strokeWidth="1.5"
        />
      ))}
      {/* weft - the thread passed across them */}
      <path
        d="M0 6 Q 8 1, 16 6 T 32 6 T 48 6 T 64 6 T 80 6 T 96 6 T 112 6 T 128 6 T 144 6 T 160 6 T 176 6 T 192 6 T 208 6"
        stroke={weft}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * A repeating block-print diamond, of the kind hand-stamped onto cloth
 * with a carved wooden block. Rendered as an SVG <pattern> so it tiles
 * seamlessly at any size, and kept at low opacity so it sits behind
 * content as texture rather than competing with it.
 */
export function BlockPrintBackdrop({ className = '', color = SAND, opacity = 0.14 }) {
  return (
    <svg className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id="shilp-block" width="44" height="44" patternUnits="userSpaceOnUse">
          {/* central diamond */}
          <path
            d="M22 8 L34 22 L22 36 L10 22 Z"
            fill="none"
            stroke={color}
            strokeWidth="1.4"
          />
          {/* inner dot */}
          <circle cx="22" cy="22" r="2.6" fill={color} />
          {/* corner quarter-motifs, so the tile reads as continuous cloth */}
          <path d="M0 0 L6 0 M0 0 L0 6" stroke={color} strokeWidth="1.4" fill="none" />
          <path d="M44 44 L38 44 M44 44 L44 38" stroke={color} strokeWidth="1.4" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#shilp-block)" opacity={opacity} />
    </svg>
  )
}

/**
 * A small still-life of the crafts the app serves - a potter's vessel, a
 * folded textile, and a length of thread. Used as the hero illustration
 * on the landing screen in place of a stock photograph.
 */
export function CraftScene({ className = '' }) {
  return (
    <svg viewBox="0 0 240 140" className={className} role="img" aria-label="Handmade craft illustration">
      {/* ground line */}
      <line x1="16" y1="122" x2="224" y2="122" stroke={FOREST} strokeWidth="2" opacity="0.25" strokeLinecap="round" />

      {/* --- potter's vessel --- */}
      <path
        d="M74 62 C58 62, 52 84, 60 100 C66 114, 94 114, 100 100 C108 84, 102 62, 86 62 Z"
        fill={TERRACOTTA}
        opacity="0.9"
      />
      {/* rim */}
      <ellipse cx="80" cy="62" rx="13" ry="4.5" fill={FOREST} opacity="0.8" />
      {/* decorative bands, the way a thrown pot is usually banded */}
      <path d="M60 82 C70 86, 90 86, 100 82" stroke={IVORY} strokeWidth="2.5" fill="none" opacity="0.75" />
      <path d="M62 92 C72 96, 88 96, 98 92" stroke={SAND} strokeWidth="2" fill="none" opacity="0.85" />

      {/* --- folded textile --- */}
      <path d="M132 96 L188 96 L182 122 L138 122 Z" fill={FOREST} opacity="0.85" />
      <path d="M136 104 L184 104" stroke={SAND} strokeWidth="2" opacity="0.7" />
      <path d="M137 112 L183 112" stroke={TERRACOTTA} strokeWidth="2" opacity="0.7" />
      {/* fold highlight */}
      <path d="M132 96 L160 88 L188 96" fill={SAND} opacity="0.55" />

      {/* --- spool of thread, unwinding --- */}
      <circle cx="196" cy="66" r="14" fill={SAND} opacity="0.9" />
      <circle cx="196" cy="66" r="5" fill={IVORY} opacity="0.9" />
      <path
        d="M182 66 C160 62, 150 78, 132 72 C118 68, 112 56, 100 58"
        stroke={TERRACOTTA}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* --- sun / warmth mark --- */}
      <circle cx="46" cy="34" r="11" fill={SAND} opacity="0.55" />
    </svg>
  )
}

/**
 * The dark, textured panel that tops the login and register screens.
 * Combines the woven CSS texture, the block-print pattern and the logo
 * mark into one reusable header so both screens feel like one product.
 */
export function AuthHeader({ title, subtitle }) {
  return (
    <div className="relative overflow-hidden craft-weave craft-weave-animated rounded-b-3xl px-6 pt-10 pb-8 shadow-lg">
      {/* block-print texture layer */}
      <div className="absolute inset-0 pointer-events-none">
        <BlockPrintBackdrop />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <LogoMark size={72} animated />
        <h1 className="mt-3 text-2xl font-bold text-ivory">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ivory/75 max-w-xs">{subtitle}</p>}
        <WovenBand className="w-28 h-3 mt-4" light />
      </div>
    </div>
  )
}
