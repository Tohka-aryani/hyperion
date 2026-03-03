import { useMemo, useEffect, useCallback, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import { useMapContext } from '../context/MapContext'
import { useTheme } from '../context/ThemeContext'
import { useWallMap } from '../context/WallMapContext'
import { SEVERITY_COLORS } from '../data/wallMapConfig'
import { reverseGeocode } from '../api/geocode'
import { fetchCountriesGeoJSON, getCountryFeature } from '../api/countriesGeoJSON'

const COUNTRY_HIGHLIGHT_STYLE = {
  fillColor: '#7c3aed',
  fillOpacity: 0.4,
  color: '#a78bfa',
  weight: 2,
}

function markerColorHex(severity) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.T1
}

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

function CountryClickLayer() {
  const { setSelectedCountry, setCountryLoading } = useMapContext()
  const handler = useCallback(async (e) => {
    if (e.originalEvent?.target?.closest?.('.leaflet-marker-icon, .marker-circle')) return
    const { lat, lng } = e.latlng
    setCountryLoading(true)
    try {
      const country = await reverseGeocode(lat, lng)
      if (country) setSelectedCountry(country)
    } finally {
      setCountryLoading(false)
    }
  }, [setSelectedCountry, setCountryLoading])
  useMapEvents({ click: handler })
  return null
}

function CountryHighlightLayer() {
  const { selectedCountry } = useMapContext()
  const [feature, setFeature] = useState(null)

  useEffect(() => {
    if (!selectedCountry) {
      setFeature(null)
      return
    }
    let cancelled = false
    fetchCountriesGeoJSON().then((geoJson) => {
      if (cancelled || !geoJson) return
      const f = getCountryFeature(geoJson, selectedCountry.name, selectedCountry.code)
      if (!cancelled) setFeature(f || null)
    })
    return () => { cancelled = true }
  }, [selectedCountry])

  if (!feature) return null

  const data = { type: 'FeatureCollection', features: [feature] }
  return (
    <GeoJSON
      key={`${selectedCountry?.code ?? ''}-${selectedCountry?.name ?? ''}`}
      data={data}
      style={COUNTRY_HIGHLIGHT_STYLE}
    />
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

function WallNewsMarkers() {
  const { wallItems, setSelectedItem, filterSeverity } = useWallMap()
  const filtered = filterSeverity ? wallItems.filter((i) => i.severity === filterSeverity) : wallItems
  return (
    <>
      {filtered.map((item) => (
        <WallNewsMarker key={item.id} item={item} onClick={() => setSelectedItem(item)} />
      ))}
    </>
  )
}

function WallNewsMarker({ item, onClick }) {
  const colorHex = markerColorHex(item.severity)
  const icon = useMemo(() => {
    return L.divIcon({
      html: `<div class="marker-circle wall-marker" style="width:24px;height:24px;cursor:pointer;background:${colorHex}"></div>`,
      className: 'wall-marker-wrap',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }, [colorHex])
  return (
    <Marker position={[item.lat, item.lng]} icon={icon} eventHandlers={{ click: onClick }}>
      <Tooltip permanent={false} direction="top" className="marker-tooltip">
        {item.title?.slice(0, 50)}…
      </Tooltip>
    </Marker>
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
      <WallNewsMarkers />
      <CountryHighlightLayer />
      <CoordsListener />
      <CountryClickLayer />
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
