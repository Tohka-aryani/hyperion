import { useState, useEffect, useCallback } from 'react'
import { useWallMap } from '../context/WallMapContext'

const STORAGE_KEY = 'godseye-wall-detail-window'
const MIN_W = 320
const MIN_H = 280
const DEFAULT_W = 420
const DEFAULT_H = 340
const DEFAULT_X = 24
const DEFAULT_Y = 80

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (typeof v?.x === 'number' && typeof v?.y === 'number' && typeof v?.w === 'number' && typeof v?.h === 'number') {
      return { x: v.x, y: v.y, w: v.w, h: v.h }
    }
  } catch (_) {}
  return null
}

function saveState(pos, size) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: pos.x, y: pos.y, w: size.w, h: size.h }))
  } catch (_) {}
}

function clampSize(w, h) {
  const maxW = typeof window !== 'undefined' ? Math.min(560, window.innerWidth * 0.9) : 560
  const maxH = typeof window !== 'undefined' ? Math.min(500, window.innerHeight * 0.8) : 500
  return { w: Math.max(MIN_W, Math.min(maxW, w)), h: Math.max(MIN_H, Math.min(maxH, h)) }
}

function clampPosition(x, y, w, h) {
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 60 : 800
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 60 : 600
  return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) }
}

function formatDate(pubDate) {
  if (!pubDate) return ''
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function domainFromUrl(link) {
  if (!link) return ''
  try {
    const u = new URL(link)
    return u.hostname.replace(/^www\./, '')
  } catch (_) {
    return ''
  }
}

export default function WallArticleDetailWindow() {
  const { selectedItem, setSelectedItem, wallItems } = useWallMap()

  const saved = loadSaved()
  const initialSize = saved ? clampSize(saved.w, saved.h) : { w: DEFAULT_W, h: DEFAULT_H }
  const initialPos = saved ? clampPosition(saved.x, saved.y, initialSize.w, initialSize.h) : { x: DEFAULT_X, y: DEFAULT_Y }

  const [position, setPosition] = useState(initialPos)
  const [size, setSize] = useState(initialSize)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState(null)
  const [resizeStart, setResizeStart] = useState(null)

  const persist = useCallback(() => saveState(position, size), [position, size])
  useEffect(() => {
    if (!dragging && !resizing) persist()
  }, [dragging, resizing, persist])

  useEffect(() => {
    if (!dragging && !resizing) return
    const onMove = (e) => {
      if (dragging) {
        setPosition((prev) => {
          const next = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
          return clampPosition(next.x, next.y, size.w, size.h)
        })
      }
      if (resizing) {
        setSize((prev) => {
          let w = prev.w, h = prev.h
          if (resizing === 'r' || resizing === 'br') w = resizeStart.w + (e.clientX - resizeStart.x)
          if (resizing === 'b' || resizing === 'br') h = resizeStart.h + (e.clientY - resizeStart.y)
          return clampSize(w, h)
        })
      }
    }
    const onUp = () => { setDragging(false); setResizing(null); setResizeStart(null) }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onUp)
    }
  }, [dragging, dragStart, resizing, resizeStart, size.w, size.h])

  const onTitleDown = useCallback((e) => {
    if (e.button !== 0) return
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    setDragging(true)
  }, [position.x, position.y])

  const onResizeDown = useCallback((edge, e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setResizing(edge)
    setResizeStart({ x: e.clientX, y: e.clientY, w: size.w, h: size.h })
  }, [size.w, size.h])

  const translateUrl = selectedItem?.link
    ? `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(selectedItem.link)}`
    : null

  const mentionCount = selectedItem && wallItems
    ? wallItems.filter((i) => i.locationName === selectedItem.locationName).length
    : 0

  if (!selectedItem) return null

  const dateStr = formatDate(selectedItem.pubDate)
  const sourceStr = domainFromUrl(selectedItem.link) || selectedItem.sourceKey || ''

  return (
    <div
      className="wall-detail-wrap"
      style={{ left: position.x, top: position.y, width: size.w, height: size.h }}
    >
      <div className="wall-detail-resize-r" onPointerDown={(e) => onResizeDown('r', e)} aria-hidden />
      <div className="wall-detail-resize-b" onPointerDown={(e) => onResizeDown('b', e)} aria-hidden />
      <div className="wall-detail-resize-br" onPointerDown={(e) => onResizeDown('br', e)} aria-hidden />

      <div className="wall-detail-panel" role="dialog" aria-label="Article details">
        <div
          className="wall-detail-header"
          onPointerDown={(e) => { if (!e.target.closest('button')) onTitleDown(e) }}
        >
          <div className="wall-detail-badges">
            <span className="wall-detail-badge wall-detail-category">{selectedItem.category}</span>
            <span className="wall-detail-badge wall-detail-severity">{selectedItem.severityLabel || selectedItem.severity}</span>
          </div>
          <div className="wall-detail-actions">
            <button
              type="button"
              className="wall-detail-translate"
              onClick={() => translateUrl && window.open(translateUrl, '_blank', 'noopener,noreferrer')}
              title="Open article in Google Translate (to English)"
            >
              TRANSLATE
            </button>
            <span className="wall-detail-mentions">{mentionCount} mention{mentionCount !== 1 ? 's' : ''}</span>
            <button
              type="button"
              className="wall-detail-close"
              aria-label="Close"
              onClick={() => setSelectedItem(null)}
            >
              ×
            </button>
          </div>
        </div>

        <div className="wall-detail-body">
          <p className="wall-detail-location">
            {selectedItem.locationName || 'Unknown'} mentioned in article:
          </p>
          <a
            href={selectedItem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="wall-detail-headline"
          >
            {selectedItem.title || '—'}
          </a>
          <p className="wall-detail-meta">
            {[dateStr, sourceStr].filter(Boolean).join(' | ')}
          </p>
        </div>
      </div>
    </div>
  )
}
