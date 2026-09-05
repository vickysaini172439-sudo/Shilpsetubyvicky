// One visual identity per craft category: an emoji "icon", an accent
// colour, and which background pattern to draw behind it. Used anywhere
// the app should feel like it belongs to THIS artisan's specific craft
// instead of a generic template - the dashboard banner, the public
// storefront banner, and the landing page showcase all read from here,
// so adding a new category later only means editing this one file.
//
// Colours are deliberately drawn from materials real crafts use (clay,
// wood, brass, indigo dye...) rather than random brand colours, so each
// one still feels like it belongs to the same ShilpSetu family.
export const CATEGORY_THEMES = {
  'Textiles & Weaving': { emoji: '🧵', color: '#B5533C', pattern: 'weave' },
  'Pottery & Ceramics': { emoji: '🏺', color: '#A0522D', pattern: 'pottery' },
  'Wood Carving': { emoji: '🪵', color: '#7A5230', pattern: 'wood' },
  'Metal Craft': { emoji: '🔔', color: '#71706B', pattern: 'metal' },
  'Jewelry & Ornaments': { emoji: '💍', color: '#B8923F', pattern: 'jewelry' },
  'Paintings & Art': { emoji: '🎨', color: '#6E4A8E', pattern: 'paint' },
  'Bamboo & Cane Craft': { emoji: '🎋', color: '#4C7A4F', pattern: 'bamboo' },
  'Leather Craft': { emoji: '👜', color: '#6B4226', pattern: 'leather' },
  'Embroidery & Needlework': { emoji: '🧶', color: '#A83D5E', pattern: 'thread' },
  'Other': { emoji: '✂️', color: '#1F4D3A', pattern: 'dots' },
}

export const DEFAULT_THEME = CATEGORY_THEMES['Other']

export function themeFor(category) {
  return CATEGORY_THEMES[category] || DEFAULT_THEME
}
