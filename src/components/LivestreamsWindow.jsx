import { useState } from 'react'
import { LIVESTREAMS } from '../data/livestreamsConfig'

export default function LivestreamsWindow({ onClose, onTitleBarPointerDown }) {
  const [selectedId, setSelectedId] = useState(LIVESTREAMS[0]?.id ?? null)
  const selected = LIVESTREAMS.find((s) => s.id === selectedId) ?? LIVESTREAMS[0]

  return (
    <div className="livestreams-window" role="dialog" aria-label="Live streams">
      <div
        className="livestreams-window-titlebar"
        onPointerDown={(e) => {
          if (e.target.closest('button')) return
          onTitleBarPointerDown?.(e)
        }}
      >
        <div className="livestreams-window-title">
          <span className="livestreams-window-dot" />
          <span>LIVESTREAMS</span>
        </div>
        <div className="livestreams-window-controls">
          <button type="button" className="livestreams-window-btn" aria-label="Minimize" />
          <button type="button" className="livestreams-window-btn" aria-label="Maximize" />
          <button
            type="button"
            className="livestreams-window-btn livestreams-window-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
      </div>

      <div className="livestreams-content">
        <nav className="livestreams-nav" aria-label="Select stream">
          {LIVESTREAMS.map((stream) => (
            <button
              key={stream.id}
              type="button"
              className={`livestreams-nav-btn ${selectedId === stream.id ? 'active' : ''}`}
              onClick={() => setSelectedId(stream.id)}
            >
              {stream.name}
            </button>
          ))}
        </nav>
        <div className="livestreams-player-wrap">
          {selected && (
            <>
              <iframe
                title={selected.name}
                className="livestreams-iframe"
                src={selected.embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              {selected.watchUrl && (
                <a
                  href={selected.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="livestreams-external"
                >
                  Open {selected.name} in new tab
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
