import { useState } from 'react'
import { useWallMap } from '../context/WallMapContext'
import { WALL_CATEGORIES, SEVERITY_COLORS } from '../data/wallMapConfig'

const CATEGORY_COLORS = {
  Conflict: '#dc2626',
  Political: '#a855f7',
  Humanitarian: '#14b8a6',
  Economic: '#22c55e',
  Disaster: '#ea580c',
}

export default function MapLegend() {
  const { wallItems, filterSeverity, setFilterSeverity } = useWallMap()
  const [legendOpen, setLegendOpen] = useState(true)
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [severityOpen, setSeverityOpen] = useState(true)
  const selectedSeverity = filterSeverity || 'T5'

  const categoryCounts = WALL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = wallItems.filter((i) => i.category === cat).length
    return acc
  }, {})

  return (
    <div className="map-legend">
      <button
        type="button"
        className="map-legend-main-heading"
        onClick={() => setLegendOpen((o) => !o)}
        aria-expanded={legendOpen}
      >
        <span>LEGEND</span>
        <span className="map-legend-chevron" aria-hidden="true">
          {legendOpen ? '▼' : '▶'}
        </span>
      </button>
      {legendOpen && (
        <>
      <section className="map-legend-section">
        <button
          type="button"
          className="map-legend-heading"
          onClick={() => setCategoriesOpen((o) => !o)}
          aria-expanded={categoriesOpen}
        >
          <span>CATEGORIES</span>
          <span className="map-legend-chevron">{categoriesOpen ? '▼' : '▶'}</span>
        </button>
        {categoriesOpen && (
          <ul className="map-legend-categories">
            {WALL_CATEGORIES.map((cat) => (
              <li key={cat} className="map-legend-cat-row">
                <span className="map-legend-cat-dot" style={{ backgroundColor: CATEGORY_COLORS[cat] }} aria-hidden="true" />
                <span className="map-legend-cat-name">{cat}</span>
                <span className="map-legend-cat-count">{categoryCounts[cat] ?? 0}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="map-legend-section">
        <button
          type="button"
          className="map-legend-heading"
          onClick={() => setSeverityOpen((o) => !o)}
          aria-expanded={severityOpen}
        >
          <span>SEVERITY</span>
          <span className="map-legend-chevron">{severityOpen ? '▼' : '▶'}</span>
        </button>
        {severityOpen && (
          <div className="map-legend-severity">
            {(['T1', 'T2', 'T3', 'T4', 'T5']).map((s) => (
              <button
                key={s}
                type="button"
                className={`map-legend-sev-btn ${selectedSeverity === s ? 'active' : ''}`}
                style={{ backgroundColor: SEVERITY_COLORS[s] }}
                onClick={() => setFilterSeverity(s)}
              >
                S{s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  )
}
