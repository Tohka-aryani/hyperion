import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import StocksWindow from './StocksWindow'
import TvFloatingWindow from './TvFloatingWindow'
import PredictionsWindow from './PredictionsWindow'

export default function SidebarLeft() {
  const [stocksOpen, setStocksOpen] = useState(false)
  const [tvOpen, setTvOpen] = useState(false)
  const [predictionsOpen, setPredictionsOpen] = useState(false)
  const stocksPanelRef = useRef(null)
  const predictionsPanelRef = useRef(null)

  useEffect(() => {
    if (!stocksOpen) return
    const onPointerDown = (e) => {
      if (stocksPanelRef.current?.contains(e.target)) return
      setStocksOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setStocksOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [stocksOpen])

  useEffect(() => {
    if (!tvOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setTvOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [tvOpen])

  useEffect(() => {
    if (!predictionsOpen) return
    const onPointerDown = (e) => {
      if (predictionsPanelRef.current?.contains(e.target)) return
      setPredictionsOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPredictionsOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [predictionsOpen])

  const stocksPortal = stocksOpen && createPortal(
    <div className="stocks-overlay" role="presentation">
      <div ref={stocksPanelRef} className="stocks-window-wrap">
        <StocksWindow
          onClose={() => setStocksOpen(false)}
          onRefresh={() => window.location.reload()}
        />
      </div>
    </div>,
    document.body
  )

  const tvPortal = tvOpen && createPortal(
    <div className="tv-overlay" role="presentation">
      <TvFloatingWindow onClose={() => setTvOpen(false)} />
    </div>,
    document.body
  )

  const predictionsPortal = predictionsOpen && createPortal(
    <div className="predictions-overlay" role="presentation">
      <div ref={predictionsPanelRef} className="predictions-window-wrap">
        <PredictionsWindow onClose={() => setPredictionsOpen(false)} />
      </div>
    </div>,
    document.body
  )

  return (
    <aside className="sidebar sidebar-left">
      <button type="button" className="icon-btn" title="Search" aria-label="Search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Stocks"
        aria-label="Stocks"
        aria-expanded={stocksOpen}
        onClick={() => setStocksOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Live streams"
        aria-label="Live streams"
        aria-expanded={tvOpen}
        onClick={() => setTvOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Predictions"
        aria-label="Predictions"
        aria-expanded={predictionsOpen}
        onClick={() => setPredictionsOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 17l5-5 4 4 8-10" />
          <circle cx="18" cy="6" r="2.5" />
        </svg>
      </button>
      <button type="button" className="icon-btn" title="Grid" aria-label="Grid">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>
      <button type="button" className="icon-btn" title="Play" aria-label="Play">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      {stocksPortal}
      {tvPortal}
      {predictionsPortal}
    </aside>
  )
}
