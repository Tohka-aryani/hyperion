import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllFeeds } from '../api/rssData'
import { RSS_FEEDS } from '../data/wallConfig'
import { getCategory, getSeverity, getDefaultLocation, SEVERITY_DISPLAY } from '../data/wallMapConfig'
import { geocodeFromArticleText } from '../api/geocode'

const WallMapContext = createContext(null)
const MAX_ITEMS = 300

function enrichItem(item) {
  const text = [item.title, item.description].filter(Boolean).join(' ')
  const category = getCategory(text)
  const severity = getSeverity(text)
  const loc = getDefaultLocation(item.sourceKey)
  return {
    ...item,
    category,
    severity,
    lat: loc.lat,
    lng: loc.lng,
    locationName: loc.name,
    severityLabel: SEVERITY_DISPLAY[severity] || severity,
  }
}

export function WallMapProvider({ children }) {
  const [wallItems, setWallItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const geocodeAttemptedRef = useRef(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    geocodeAttemptedRef.current.clear()
    try {
      const data = await fetchAllFeeds(RSS_FEEDS)
      const enriched = data.slice(0, MAX_ITEMS).map(enrichItem)
      setWallItems(enriched)
    } catch (_) {
      setWallItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (loading) return
    const pending = wallItems.filter((i) => !geocodeAttemptedRef.current.has(i.id))
    if (pending.length === 0) return
    let cancelled = false
    const run = async () => {
      for (const item of pending) {
        if (cancelled) return
        geocodeAttemptedRef.current.add(item.id)
        const text = [item.title, item.description].filter(Boolean).join(' ')
        const geo = await geocodeFromArticleText(text)
        if (cancelled) return
        if (geo) {
          setWallItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, lat: geo.lat, lng: geo.lng, locationName: geo.name } : p
            )
          )
        }
        await new Promise((r) => setTimeout(r, 1100))
      }
    }
    run()
    return () => { cancelled = true }
  }, [loading, wallItems])

  const [filterSeverity, setFilterSeverity] = useState(null)

  const value = {
    wallItems,
    loading,
    selectedItem,
    setSelectedItem,
    filterSeverity,
    setFilterSeverity,
    refresh: load,
  }

  return (
    <WallMapContext.Provider value={value}>
      {children}
    </WallMapContext.Provider>
  )
}

export function useWallMap() {
  const ctx = useContext(WallMapContext)
  if (!ctx) return { wallItems: [], loading: false, selectedItem: null, setSelectedItem: () => {}, filterSeverity: null, setFilterSeverity: () => {}, refresh: () => {} }
  return ctx
}
