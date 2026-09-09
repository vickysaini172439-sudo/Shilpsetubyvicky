/**
 * Unfinished work, kept safe when the artisan leaves the screen.
 *
 * THE PROBLEM
 * -----------
 * Every AI screen held its work in React state and nothing else. Tapping
 * Home — or Products, or the back gesture — unmounts the route, and React
 * throws that state away. An artisan who waited a minute for the AI to
 * write their catalogue, then tapped Home to check something, came back
 * to an empty form. Nothing warned them, and nothing could bring it back.
 *
 * TWO LAYERS, ON PURPOSE
 * ----------------------
 * memory   a plain Map that lives as long as the browser tab. It can hold
 *          anything, including File and Blob objects, so an enhanced photo
 *          survives navigation at full quality with no encoding step. This
 *          is what covers the actual complaint: leaving a screen and
 *          coming back is navigation, not a reload.
 *
 * storage  localStorage, holding only the JSON-safe fields. This is the
 *          weaker copy — no photos — but it survives a real page refresh,
 *          a phone killing the tab, and coming back tomorrow. The AI's
 *          written words are exactly what fits here, and they are the
 *          slowest part to recreate.
 *
 * A load prefers memory and falls back to storage, so the artisan gets
 * the richest copy that still exists rather than an all-or-nothing.
 *
 * Every localStorage call is wrapped: private browsing and blocked site
 * data make these throw, and a draft is a convenience. Losing it must
 * never take a working screen down with it.
 */

const PREFIX = 'shilpsetu_draft_'

// Blobs, Files and object URLs cannot be JSON. They are dropped from the
// stored copy rather than crashing the save — the memory copy still has
// them for as long as the tab is open.
function jsonSafe(value) {
  if (value == null) return value
  if (typeof Blob !== 'undefined' && value instanceof Blob) return undefined
  if (typeof File !== 'undefined' && value instanceof File) return undefined
  if (Array.isArray(value)) return value.map(jsonSafe)
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const safe = jsonSafe(v)
      if (safe !== undefined) out[k] = safe
    }
    return out
  }
  if (typeof value === 'function') return undefined
  return value
}

const memory = new Map()

export function saveDraft(key, data) {
  if (!key) return
  const savedAt = Date.now()
  memory.set(key, { data, savedAt })
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data: jsonSafe(data), savedAt }))
  } catch {
    // Quota, private mode, or a blob that slipped through. The in-memory
    // copy is untouched and still covers navigation.
  }
}

export function loadDraft(key) {
  if (!key) return null
  const live = memory.get(key)
  if (live) return live

  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return null
    return parsed
  } catch {
    return null
  }
}

export function clearDraft(key) {
  if (!key) return
  memory.delete(key)
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* nothing to do */
  }
}

/**
 * "2 minutes ago". Deliberately vague at the top end: an artisan does not
 * need to know a draft is 51 hours old, only that it is from a while back.
 */
export function describeAge(savedAt) {
  if (!savedAt) return ''
  const seconds = Math.max(0, Math.round((Date.now() - savedAt) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
