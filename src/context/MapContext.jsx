import { createContext, useContext, useState } from 'react'

const MapContext = createContext(null)

export function MapProvider({ children }) {
  const [map, setMap] = useState(null)
  const [coords, setCoords] = useState(null)
  return (
    <MapContext.Provider value={{ map, setMap, coords, setCoords }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext() {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMapContext must be used within MapProvider')
  return ctx
}
