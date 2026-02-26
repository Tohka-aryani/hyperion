/**
 * Telegram channel feed: try RSS-Bridge and RSSHub (with CORS proxy), no Telegram API.
 */

import { getSeverity, SEVERITY_DISPLAY } from '../data/wallMapConfig'

const PROXY_RAW = 'https://api.allorigins.win/raw?url='

/** Channels to fetch (t.me/s/ username). */
export const TELEGRAM_CHANNELS = [
  { username: 'jacksonhinkle', label: 'Jackson Hinkle' },
  { username: 'Irfan_Newboys', label: 'Irfan Newboys' },
]

/** Public preview URL for a channel. */
export function getTelegramChannelUrl(username) {
  return `https://t.me/s/${encodeURIComponent(username)}`
}

/** Deep link to open channel in Telegram app. */
export function getTelegramAppUrl(username) {
  return `tg://resolve?domain=${encodeURIComponent(username)}`
}

function getTimeAgo(ms) {
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 60) return 'now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`
  return `${Math.floor(sec / 86400)}d`
}

function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** RSS-Bridge public instances (Telegram bridge). */
const RSS_BRIDGE_BASES = [
  'https://rss-bridge.bb8.fun',
  'https://rss-bridge.sans-nuage.fr',
  'https://rss-bridge.cheredeprince.net',
  'https://rsshub.app',
]

function timeoutPromise(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

/** Fetch URL; try direct then via CORS proxy. */
async function fetchUrl(url, timeoutMs = 12000) {
  const proxyUrl = PROXY_RAW + encodeURIComponent(url)
  const attempts = [
    () => Promise.race([fetch(url), timeoutPromise(timeoutMs)]).then((r) => (r.ok ? r.text() : Promise.reject())),
    () => Promise.race([fetch(proxyUrl), timeoutPromise(timeoutMs)]).then((r) => (r.ok ? r.text() : Promise.reject())),
  ]
  for (const fn of attempts) {
    try {
      const text = await fn()
      if (text && (text.includes('<item') || text.includes('<entry') || text.includes('<rss') || text.includes('<feed'))) return text
    } catch (_) {}
  }
  return null
}

/** Parse RSS or Atom XML into items. */
function parseFeedXml(xmlText, sourceKey) {
  if (!xmlText || typeof xmlText !== 'string') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  if (doc.querySelector('parsererror')) return []
  const itemList = doc.querySelectorAll('item')
  const entryList = doc.querySelectorAll('entry')
  const nodes = itemList.length ? itemList : entryList
  const out = []
  const now = Date.now()
  for (const node of nodes) {
    const title = node.querySelector('title')?.textContent?.trim() || ''
    if (!title) continue
    let link = node.querySelector('link')?.textContent?.trim() || ''
    if (!link && node.querySelector('link')?.getAttribute('href')) link = node.querySelector('link').getAttribute('href')
    const pubDate = node.querySelector('pubDate')?.textContent?.trim() || node.querySelector('updated')?.textContent?.trim()
    const descEl = node.querySelector('description') || node.querySelector('summary') || node.querySelector('content')
    const rawDesc = descEl?.textContent?.trim() ?? ''
    const description = rawDesc.replace(/<[^>]+>/g, '').trim()
    const published = pubDate ? new Date(pubDate).getTime() : now
    out.push({ id: `${sourceKey}-${(link || published).toString().replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 80)}`, title, link, description, sourceKey, published })
  }
  return out
}

/** Fetch one channel: try RSS-Bridge (multiple instances) then RSSHub. */
async function fetchChannelFeed({ username, label }) {
  const channelName = label || username
  // RSS-Bridge: ?action=display&bridge=Telegram&context=Channel&u=USER&format=Rss
  for (const base of RSS_BRIDGE_BASES) {
    let feedUrl
    if (base === 'https://rsshub.app') {
      feedUrl = `${base}/telegram/channel/${encodeURIComponent(username)}`
    } else {
      feedUrl = `${base}/?action=display&bridge=Telegram&context=Channel&u=${encodeURIComponent(username)}&format=Rss`
    }
    const xml = await fetchUrl(feedUrl, 10000)
    if (!xml) continue
    const items = parseFeedXml(xml, username)
    if (items.length === 0) continue
    return items.map((item) => {
      const text = [item.title, item.description].filter(Boolean).join(' ')
      const severity = getSeverity(text)
      const content = decodeHtmlEntities((item.description || item.title || '').trim())
      return {
        ...item,
        channelUsername: username,
        channelName: channelName,
        content: content || item.title || '—',
        severity,
        severityLabel: SEVERITY_DISPLAY[severity] || severity,
        timeAgo: getTimeAgo(item.published),
        id: `${username}-${(item.link || item.published || '').toString().replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 80)}`,
      }
    })
  }
  return []
}

/**
 * Fetch and merge posts from all configured channels, newest first.
 */
export async function fetchCombinedTelegramFeed() {
  const results = await Promise.allSettled(TELEGRAM_CHANNELS.map((ch) => fetchChannelFeed(ch)))
  const all = []
  results.forEach((r) => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) all.push(...r.value)
  })
  all.sort((a, b) => (b.published || 0) - (a.published || 0))
  return all
}
