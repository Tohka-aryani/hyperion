import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllFeeds } from '../api/rssData'
import { RSS_FEEDS } from '../data/wallConfig'

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
const TICKER_SYNC_INTERVAL_MS = 5 * 60 * 1000
const POPUP_LEAVE_DELAY_MS = 200

function filterLast12Hours(items) {
  if (!Array.isArray(items)) return []
  const cutoff = Date.now() - TWELVE_HOURS_MS
  return items.filter((item) => (item.published || 0) >= cutoff)
}

function stripHtml(html) {
  if (typeof html !== 'string') return ''
  return html.replace(/<[^>]+>/g, '').trim()
}

function TickerPopup({ item }) {
  if (!item) return null
  const title = item.title || '—'
  const description = stripHtml(item.description || '')
  const link = item.link || '#'
  const timeAgo = item.timeAgo || ''

  return (
    <div
      className="ticker-popup"
      role="dialog"
      aria-label="Article preview"
    >
      <h3 className="ticker-popup-title">{title}</h3>
      {description && (
        <div className="ticker-popup-body">{description}</div>
      )}
      <div className="ticker-popup-footer">
        <span className="ticker-popup-time">{timeAgo}</span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="ticker-popup-open"
        >
          OPEN →
        </a>
      </div>
    </div>
  )
}

export default function Footer() {
  const [tickerItems, setTickerItems] = useState([])
  const [hoveredItem, setHoveredItem] = useState(null)
  const closeTimeoutRef = useRef(null)

  const setHoveredWithDelay = useCallback((item) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setHoveredItem(item)
  }, [])

  const scheduleClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setHoveredItem(null), POPUP_LEAVE_DELAY_MS)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const data = await fetchAllFeeds(RSS_FEEDS)
      const recent = filterLast12Hours(data)
      setTickerItems(recent)
    } catch (_) {
      setTickerItems([])
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, TICKER_SYNC_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  const displayItems = tickerItems.length > 0
    ? tickerItems.map((item) => ({
        title: item.title || '—',
        link: item.link || '',
        description: item.description || '',
        timeAgo: item.timeAgo || '',
        full: item,
      }))
    : []

  const content = displayItems.flatMap((item, i) => [
    <span
      key={`item-${i}`}
      className="ticker-item"
      onMouseEnter={() => setHoveredWithDelay(item.full)}
      onMouseLeave={scheduleClose}
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="ticker-item-link"
        onMouseEnter={(e) => {
          e.stopPropagation()
          setHoveredWithDelay(item.full)
        }}
        onMouseLeave={scheduleClose}
      >
        {item.title}
      </a>
    </span>,
    <span key={`sep-${i}`} className="ticker-sep"> — </span>,
  ])
  const contentDup = displayItems.flatMap((item, i) => [
    <span
      key={`dup-item-${i}`}
      className="ticker-item"
      onMouseEnter={() => setHoveredWithDelay(item.full)}
      onMouseLeave={scheduleClose}
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="ticker-item-link"
        onMouseEnter={(e) => {
          e.stopPropagation()
          setHoveredWithDelay(item.full)
        }}
        onMouseLeave={scheduleClose}
      >
        {item.title}
      </a>
    </span>,
    <span key={`dup-sep-${i}`} className="ticker-sep"> — </span>,
  ])

  return (
    <footer className="footer">
      {hoveredItem && (
        <div
          className="ticker-popup-wrap"
          onMouseEnter={cancelClose}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <TickerPopup item={hoveredItem} />
        </div>
      )}
      <div className="footer-row">
        <div className="live-badge">
          <span className="live-dot" />
          <span>LIVE</span>
        </div>
        <div className="ticker-wrap">
          <div className="ticker">
            {displayItems.length > 0 ? (
              <>
                {content}
                {contentDup}
              </>
            ) : (
              <span className="ticker-item">Loading news…</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
