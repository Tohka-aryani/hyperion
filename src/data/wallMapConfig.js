/**
 * Wall map: categories, severity (T1–T5), and default locations per source.
 * Used to enrich Wall RSS items for map markers and the detail popup.
 */

export const WALL_CATEGORIES = [
  'Conflict',
  'Political',
  'Humanitarian',
  'Economic',
  'Disaster',
]

export const SEVERITY_LABELS = { T1: 'T1', T2: 'T2', T3: 'T3', T4: 'T4', T5: 'T5' }
export const SEVERITY_DISPLAY = { T1: 'S1', T2: 'S2', T3: 'S3', T4: 'S4', T5: 'S5' }

/** Hex colors for severity (map pins and legend). */
export const SEVERITY_COLORS = {
  T1: '#22c55e',
  T2: '#84cc16',
  T3: '#ea580c',
  T4: '#c2410c',
  T5: '#dc2626',
}

const CATEGORY_KEYWORDS = {
  Conflict: /\b(war|attack|military|invasion|strike|conflict|violence|troops|nuclear|missile|combat|ceasefire)\b/i,
  Political: /\b(election|vote|minister|president|parliament|congress|government|policy|sanctions|diplomat)\b/i,
  Humanitarian: /\b(refugee|aid|crisis|famine|displaced|humanitarian|relief|migration|evacuation)\b/i,
  Economic: /\b(market|economy|inflation|recession|trade|stock|bank|debt|gdp|employment)\b/i,
  Disaster: /\b(flood|earthquake|fire|hurricane|tsunami|disaster|emergency|evacuation|rescue)\b/i,
}

const SEVERITY_KEYWORDS = {
  T5: /\b(nuclear|war|invasion|mass casualty|catastrophe|imminent)\b/i,
  T4: /\b(attack|strike|military|disaster|emergency|critical)\b/i,
  T3: /\b(conflict|violence|crisis|evacuation|protest)\b/i,
  T2: /\b(tension|arrest|incident|outage)\b/i,
}

/** Default coordinates and location name per RSS source (for estimated location when no geocode). */
export const SOURCE_DEFAULT_LOCATION = {
  'BBC News': { lat: 51.5, lng: -0.1, name: 'London, United Kingdom' },
  'CNN': { lat: 40.7, lng: -74.0, name: 'New York, United States' },
  'Reuters': { lat: 51.5, lng: -0.1, name: 'London, United Kingdom' },
  'Associated Press News': { lat: 40.7, lng: -74.0, name: 'New York, United States' },
  'AP News': { lat: 40.7, lng: -74.0, name: 'New York, United States' },
  'The Guardian': { lat: 51.5, lng: -0.1, name: 'London, United Kingdom' },
  'NPR': { lat: 38.9, lng: -77.0, name: 'Washington, United States' },
  'Al Jazeera': { lat: 25.3, lng: 51.5, name: 'Doha, Qatar' },
  'Malay Mail': { lat: 3.14, lng: 101.69, name: 'Kuala Lumpur, Malaysia' },
  'The Star': { lat: 3.14, lng: 101.69, name: 'Kuala Lumpur, Malaysia' },
  'Bernama': { lat: 3.14, lng: 101.69, name: 'Kuala Lumpur, Malaysia' },
  'Free Malaysia Today': { lat: 3.14, lng: 101.69, name: 'Kuala Lumpur, Malaysia' },
  'New Straits Times': { lat: 3.14, lng: 101.69, name: 'Kuala Lumpur, Malaysia' },
}

const DEFAULT_LOC = { lat: 20, lng: 0, name: 'Unknown' }

export function getCategory(text) {
  if (!text || typeof text !== 'string') return 'Political'
  const t = text.slice(0, 800)
  for (const [cat, re] of Object.entries(CATEGORY_KEYWORDS)) {
    if (re.test(t)) return cat
  }
  return 'Political'
}

export function getSeverity(text) {
  if (!text || typeof text !== 'string') return 'T2'
  const t = text.slice(0, 800)
  if (SEVERITY_KEYWORDS.T5.test(t)) return 'T5'
  if (SEVERITY_KEYWORDS.T4.test(t)) return 'T4'
  if (SEVERITY_KEYWORDS.T3.test(t)) return 'T3'
  if (SEVERITY_KEYWORDS.T2.test(t)) return 'T2'
  return 'T1'
}

export function getDefaultLocation(sourceKey) {
  return SOURCE_DEFAULT_LOCATION[sourceKey] || DEFAULT_LOC
}
