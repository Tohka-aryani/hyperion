/**
 * GDELT Project GEO 2.0 API — global events with coordinates.
 * Replaces RSS for map pinpoints, The Wall, and ticker.
 * All events have native lat/lng; no geocoding needed.
 */

import { getCategory, getSeverity, SEVERITY_DISPLAY } from '../data/wallMapConfig'

const GDELT_GEO_BASE = 'https://api.gdeltproject.org/api/v2/geo/geo'
const PROXY_RAW = 'https://api.allorigins.win/raw?url='
const MAX_RECORDS = 500

function getTimeAgo(ms) {
  if (!ms) return '—'
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 60) return 'Just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}M AGO`
  if (sec < 86400) return `${Math.floor(sec / 3600)}H AGO`
  return `${Math.floor(sec / 86400)}D AGO`
}

/** Fetch URL; try direct then CORS proxy. Returns parsed JSON or null. */
async function fetchUrl(url, timeoutMs = 20000) {
  const proxyUrl = PROXY_RAW + encodeURIComponent(url)
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), timeoutMs)
  for (const u of [url, proxyUrl]) {
    try {
      const res = await fetch(u, { signal: controller.signal })
      clearTimeout(to)
      if (!res.ok) continue
      const text = await res.text()
      if (!text || !text.trim()) continue
      try {
        return JSON.parse(text)
      } catch (_) {
        continue
      }
    } catch (_) {
      continue
    }
  }
  clearTimeout(to)
  throw new Error('Could not fetch GDELT data')
}

/**
 * Normalize GeoJSON Feature or JSONFeed item to our wall item shape.
 * GDELT GEO returns GeoJSON: features with geometry.coordinates and properties (name, urls/article list).
 */
function featureToItems(feature, index) {
  const coords = feature.geometry?.coordinates
  let lat = coords && coords.length >= 2 ? Number(coords[1]) : null
  let lng = coords && coords.length >= 2 ? Number(coords[0]) : null
  const props = feature.properties || {}
  if (lat == null || lng == null) {
    lat = props.lat ?? props.latitude ?? props.LAT ?? null
    lng = props.lng ?? props.longitude ?? props.LON ?? props.LNG ?? null
  }
  const name = props.name || props.NAME || 'Unknown'
  const urls = props.url || props.urls || props.URL || (props.articles && props.articles.map((a) => a.url || a.URL)) || []
  const articles = Array.isArray(props.articles) ? props.articles : Array.isArray(urls) ? urls.map((u) => (typeof u === 'string' ? { url: u, title: name } : u)) : [{ url: props.url || '', title: props.title || name }]
  if (articles.length === 0 && (props.url || props.URL)) articles.push({ url: props.url || props.URL, title: props.title || name })
  const out = []
  articles.forEach((art, i) => {
    const url = typeof art === 'string' ? art : art.url || art.URL
    const title = typeof art === 'string' ? name : art.title || art.Title || name
    if (!url && !title) return
    const id = `gdelt-${index}-${i}-${(url || title).toString().replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 60)}`
    const text = [title].filter(Boolean).join(' ')
    const category = getCategory(text)
    const severity = getSeverity(text)
    out.push({
      id,
      title,
      description: typeof art === 'string' ? '' : (art.desc || art.description || ''),
      link: url || '#',
      sourceKey: typeof art === 'string' ? 'GDELT' : (art.domain || art.outletName || 'GDELT'),
      published: typeof art === 'string' ? Date.now() : (art.date ? new Date(art.date).getTime() : Date.now()),
      lat: lat != null ? lat : 0,
      lng: lng != null ? lng : 0,
      locationName: name,
      category,
      severity,
      severityLabel: SEVERITY_DISPLAY[severity] || severity,
    })
  })
  if (out.length === 0 && lat != null && lng != null) {
    out.push({
      id: `gdelt-${index}-0-${name.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 60)}`,
      title: name,
      description: '',
      link: props.url || '#',
      sourceKey: 'GDELT',
      published: Date.now(),
      lat,
      lng,
      locationName: name,
      category: getCategory(name),
      severity: getSeverity(name),
      severityLabel: SEVERITY_DISPLAY[getSeverity(name)] || 'S2',
    })
  }
  return out
}

/**
 * Fetch GDELT GEO events. Uses broad query for global coverage.
 * Returns array of { id, title, description, link, sourceKey, published, lat, lng, locationName, category, severity, severityLabel, timeAgo }.
 * All pinpoints use native GDELT coordinates (no geocoding).
 */
export async function fetchGdeltEvents() {
  const query = encodeURIComponent('world OR conflict OR election OR disaster')
  const url = `${GDELT_GEO_BASE}?query=${query}&format=geojson&maxrecords=${MAX_RECORDS}&maxrows=${MAX_RECORDS}`
  let data
  try {
    data = await fetchUrl(url)
  } catch (e) {
    throw e
  }
  if (!data || typeof data !== 'object') return []
  const features = data?.features || []
  const all = []
  features.forEach((f, i) => {
    try {
      const items = featureToItems(f, i)
      if (items && items.length) all.push(...items)
    } catch (_) {}
  })
  if (all.length === 0 && Array.isArray(data?.items)) {
    data.items.forEach((item, i) => {
      const lat = item.lat ?? item.latitude ?? 0
      const lng = item.lng ?? item.longitude ?? 0
      const title = item.title || item.name || '—'
      const text = [title, item.content_text || item.description].filter(Boolean).join(' ')
      all.push({
        id: `gdelt-${i}-${(item.id || item.url || '').toString().replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 60)}`,
        title,
        description: item.content_text || item.description || '',
        link: item.url || item.link || '#',
        sourceKey: item.domain || item.outletName || 'GDELT',
        published: item.date_published ? new Date(item.date_published).getTime() : Date.now(),
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        locationName: item.name || title,
        category: getCategory(text),
        severity: getSeverity(text),
        severityLabel: SEVERITY_DISPLAY[getSeverity(text)] || 'S2',
      })
    })
  }
  const withTime = all
    .filter((i) => i.lat != null && i.lng != null)
    .map((i) => ({ ...i, timeAgo: getTimeAgo(i.published) }))
  withTime.sort((a, b) => (b.published || 0) - (a.published || 0))
  return withTime
}
