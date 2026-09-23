import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Marqueurs colorés personnalisés
const iconVert = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const iconRouge = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Composant interne pour ajuster la vue de la carte
function AjusterVue({ coordDepart, coordArrivee }) {
  const map = useMap()
  useEffect(() => {
    if (coordDepart && coordArrivee) {
      const bounds = L.latLngBounds(
        [coordDepart.lat, coordDepart.lon],
        [coordArrivee.lat, coordArrivee.lon]
      )
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [coordDepart, coordArrivee, map])
  return null
}

// Composant interne pour tracer la route OSRM
function TracerRoute({ coordDepart, coordArrivee, onDistanceCalculee }) {
  const map = useMap()
  const polylineRef = useRef(null)

  useEffect(() => {
    if (!coordDepart || !coordArrivee) return

    // Supprime l'ancienne route si elle existe
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }

    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${coordDepart.lon},${coordDepart.lat};${coordArrivee.lon},${coordArrivee.lat}` +
      `?overview=full&geometries=geojson`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])

          // Trace la route en bleu
          polylineRef.current = L.polyline(coords, {
            color: '#1d4ed8',
            weight: 4,
            opacity: 0.8,
          }).addTo(map)

          // Calcule la distance en km
          const distanceKm = Math.round(route.distance / 1000)
          onDistanceCalculee(distanceKm)
        }
      })
      .catch(err => console.error('Erreur OSRM:', err))

    return () => {
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current)
      }
    }
  }, [coordDepart, coordArrivee, map, onDistanceCalculee])

  return null
}

export default function CarteItineraire({ coordDepart, coordArrivee, villeDepart, villeArrivee, onDistanceCalculee }) {
  // Centre par défaut : Madagascar
  const centreMadagascar = [-18.9249, 47.5185]

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={centreMadagascar}
        zoom={6}
        style={{ height: '350px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {coordDepart && (
          <Marker position={[coordDepart.lat, coordDepart.lon]} icon={iconVert}>
            <Popup>🟢 Départ : {villeDepart}</Popup>
          </Marker>
        )}

        {coordArrivee && (
          <Marker position={[coordArrivee.lat, coordArrivee.lon]} icon={iconRouge}>
            <Popup>🔴 Arrivée : {villeArrivee}</Popup>
          </Marker>
        )}

        {coordDepart && coordArrivee && (
          <>
            <AjusterVue coordDepart={coordDepart} coordArrivee={coordArrivee} />
            <TracerRoute
              coordDepart={coordDepart}
              coordArrivee={coordArrivee}
              onDistanceCalculee={onDistanceCalculee}
            />
          </>
        )}
      </MapContainer>
    </div>
  )
}