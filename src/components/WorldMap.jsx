import { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useMapContext } from '../context/MapContext'
import { useTheme } from '../context/ThemeContext'
import { MARKERS, markerColor, markerRadius } from '../data/markers'

const TILE_URL_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_URL_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

function MapReady() {
  const map = useMap()
  const { setMap } = useMapContext()
  useEffect(() => {
    setMap(map)
    return () => setMap(null)
  }, [map, setMap])
  return null
}

function formatDms(deg, isLat) {
  const abs = Math.abs(deg)
  const d = Math.floor(abs)
  const m = (abs - d) * 60
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')
  return `${d}° ${m.toFixed(2)} ${dir}`
}

function CoordsListener() {
  const { setCoords } = useMapContext()
  useMapEvents({
    mousemove: (e) => {
      const { lat, lng } = e.latlng
      setCoords({
        dms: `${formatDms(lat, true)}\n${formatDms(lng, false)}`,
        decimal: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      })
    },
    mouseout: () => setCoords(null),
  })
  return null
}

function NumberedMarker({ point }) {
  const color = markerColor(point.value)
  const r = markerRadius(point.value)
  const icon = useMemo(() => {
    return L.divIcon({
      html: `<div class="marker-circle ${color}" style="width:${r * 2}px;height:${r * 2}px">${point.value}</div>`,
      className: '',
      iconSize: [r * 2, r * 2],
      iconAnchor: [r, r],
    })
  }, [point.value, color, r])

  return (
    <Marker position={[point.lat, point.lng]} icon={icon}>
      <Tooltip permanent={false} direction="top" className="marker-tooltip">
        {point.value}
      </Tooltip>
    </Marker>
  )
}

function ThemeTileLayer() {
  const { theme } = useTheme()
  const url = theme === 'light' ? TILE_URL_LIGHT : TILE_URL_DARK
  return (
    <TileLayer
      key={theme}
      url={url}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      subdomains="abcd"
      maxZoom={19}
    />
  )
}

export default function WorldMap() {
  return (
    <MapContainer
      className="map-container"
      center={[20, 0]}
      zoom={2}
      zoomControl={false}
      attributionControl
    >
      <MapReady />
      <ThemeTileLayer />
      {MARKERS.map((point, i) => (
        <NumberedMarker key={`${point.lat}-${point.lng}-${i}`} point={point} />
      ))}
      <CoordsListener />
    </MapContainer>
  )
}

export function CoordsBox() {
  const { coords } = useMapContext()
  if (!coords) return null
  return (
    <div className="coords-box visible" aria-hidden="false">
      <div className="coords-dms" style={{ whiteSpace: 'pre-line' }}>{coords.dms}</div>
      <div className="coords-decimal">{coords.decimal}</div>
    </div>
  )
}
