import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Play, Square, PenLine, Save, X, ImagePlus } from 'lucide-react'
import { useGPS } from '../hooks/useGPS'
import { useRoute } from '../hooks/useRoute'
import { createMemoryIcon, userColor } from './MemoryPin'
import { sanitizeText } from '../lib/sanitize'

const NZ_CENTER = [-41.2865, 174.7762]
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

const DEMO_MEMORIES = [
  { id: 'd1', userId: 'user1', userName: 'user1',   lat: -44.6714, lng: 167.9271, text: 'Milford Sound',   imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=300&q=80' },
  { id: 'd2', userId: 'user2', userName: 'user2',    lat: -45.0312, lng: 168.6626, text: 'Queenstown',      imageUrl: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=300&q=80' },
  { id: 'd3', userId: 'user1', userName: 'user1',   lat: -38.1368, lng: 176.2497, text: 'Rotorua',         imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&q=80' },
  { id: 'd4', userId: 'user2', userName: 'user2',    lat: -43.7350, lng: 170.0987, text: 'Mount Cook',      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80' },
  { id: 'd5', userId: 'user1', userName: 'user1',   lat: -36.8509, lng: 174.7645, text: 'Auckland',        imageUrl: null },
]

const DEMO_ROUTES = [
  [[-36.8509,174.7645],[-37.6878,176.1702],[-38.1368,176.2497]],
  [[-43.5321,172.6362],[-43.7350,170.0987],[-44.6714,167.9271]],
  [[-45.0312,168.6626],[-45.8788,170.5028]],
]

export default function MapTab({ currentUser, users, isDemo }) {
  const mapRef        = useRef(null)
  const leafletMap    = useRef(null)
  const routeLayer    = useRef(null)
  const drawLayer     = useRef(null)
  const memoriesLayer = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isDrawing, setIsDrawing]     = useState(false)
  const [drawPoints, setDrawPoints]   = useState([])
  const [isSaving, setIsSaving]       = useState(false)
  const [memoryMode, setMemoryMode]   = useState(false)
  const [memoryForm, setMemoryForm]   = useState(null)
  const [memoryText, setMemoryText]   = useState('')
  const [memoryImage, setMemoryImage] = useState(null)

  const { isTracking, points: gpsPoints, error: gpsError, startTracking, stopTracking } = useGPS()
  const { snapToRoads } = useRoute()

  useEffect(() => {
    if (leafletMap.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView(NZ_CENTER, 5)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19,
    }).addTo(map)
    routeLayer.current    = L.layerGroup().addTo(map)
    drawLayer.current     = L.layerGroup().addTo(map)
    memoriesLayer.current = L.layerGroup().addTo(map)
    leafletMap.current    = map

    if (isDemo) {
      DEMO_ROUTES.forEach((route, i) => {
        L.polyline(route, { color: i % 2 === 0 ? '#3b82f6' : '#ef4444', weight: 4, opacity: 0.7 }).addTo(routeLayer.current)
      })
      DEMO_MEMORIES.forEach(m => addMemoryMarker(m, users))
    } else {
      loadMemories(map)
    }
  }, [])

  useEffect(() => {
    if (!routeLayer.current || isDemo) return
    routeLayer.current.clearLayers()
    if (gpsPoints.length < 2) return
    const color = userColor(currentUser.id, users)
    L.polyline(gpsPoints.map(p => [p.lat, p.lng]), { color, weight: 4, opacity: 0.8 }).addTo(routeLayer.current)
  }, [gpsPoints, currentUser, users, isDemo])

  const handleStopGPS = useCallback(async () => {
    stopTracking()
    if (gpsPoints.length < 2 || isDemo) return
    const { db } = await import('../lib/firebase')
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
    const { totalDistance } = await import('../lib/haversine')
    await addDoc(collection(db, 'routes'), {
      userId: currentUser.id, userName: currentUser.name,
      points: gpsPoints, distance: totalDistance(gpsPoints),
      createdAt: serverTimestamp(),
    })
  }, [stopTracking, gpsPoints, currentUser, isDemo])

  useEffect(() => {
    const map = leafletMap.current
    if (!map || !drawLayer.current || isDemo) return
    if (isDrawing) map.on('click', handleDrawClick)
    else map.off('click', handleDrawClick)
    return () => { map.off('click', handleDrawClick) }
  }, [isDrawing, isDemo])

  const handleDrawClick = useCallback((e) => {
    const p = { lat: e.latlng.lat, lng: e.latlng.lng }
    setDrawPoints(prev => {
      const next = [...prev, p]
      drawLayer.current.clearLayers()
      if (next.length > 1) {
        const color = userColor(currentUser.id, users)
        L.polyline(next.map(pt => [pt.lat, pt.lng]), { color, weight: 4, opacity: 0.7, dashArray: '6,4' }).addTo(drawLayer.current)
      }
      return next
    })
  }, [currentUser, users])

  const saveDrawnRoute = useCallback(async () => {
    if (drawPoints.length < 2 || isDemo) return
    setIsSaving(true)
    try {
      const snapped = await snapToRoads(drawPoints)
      const { db } = await import('../lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const { totalDistance } = await import('../lib/haversine')
      await addDoc(collection(db, 'routes'), {
        userId: currentUser.id, userName: currentUser.name,
        points: snapped, distance: totalDistance(snapped),
        createdAt: serverTimestamp(),
      })
      drawLayer.current.clearLayers()
      setDrawPoints([])
      setIsDrawing(false)
    } finally {
      setIsSaving(false)
    }
  }, [drawPoints, currentUser, snapToRoads, isDemo])

  useEffect(() => {
    const map = leafletMap.current
    if (!map || isDemo) return
    if (memoryMode) {
      map.on('click', handleMemoryMapClick)
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.off('click', handleMemoryMapClick)
      map.getContainer().style.cursor = ''
    }
    return () => {
      map.off('click', handleMemoryMapClick)
      if (map.getContainer()) map.getContainer().style.cursor = ''
    }
  }, [memoryMode, isDemo])

  const handleMemoryMapClick = useCallback((e) => {
    setMemoryForm({ lat: e.latlng.lat, lng: e.latlng.lng })
    setMemoryMode(false)
  }, [])

  async function resizeImage(file, maxPx = 800) {
    return new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = img.width  * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', 0.85)
      }
      img.src = url
    })
  }

  const saveMemory = useCallback(async () => {
    if (!memoryForm || isDemo) return
    setIsSaving(true)
    try {
      let imageUrl = null
      if (memoryImage) {
        const blob = await resizeImage(memoryImage)
        const { storage } = await import('../lib/firebase')
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
        const sRef = ref(storage, `memories/${currentUser.id}/${Date.now()}.jpg`)
        await uploadBytes(sRef, blob)
        imageUrl = await getDownloadURL(sRef)
      }
      const { db } = await import('../lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const docRef = await addDoc(collection(db, 'memories'), {
        userId: currentUser.id, userName: currentUser.name,
        lat: memoryForm.lat, lng: memoryForm.lng,
        text: sanitizeText(memoryText).slice(0, 1000),
        imageUrl, createdAt: serverTimestamp(),
      })
      addMemoryMarker({ id: docRef.id, userId: currentUser.id, lat: memoryForm.lat, lng: memoryForm.lng, text: sanitizeText(memoryText), imageUrl, userName: currentUser.name }, users)
      setMemoryForm(null)
      setMemoryText('')
      setMemoryImage(null)
    } finally {
      setIsSaving(false)
    }
  }, [memoryForm, memoryText, memoryImage, currentUser, isDemo])

  async function loadMemories(map) {
    const { db } = await import('../lib/firebase')
    const { collection, query, orderBy, getDocs } = await import('firebase/firestore')
    const q    = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    snap.forEach(doc => addMemoryMarker({ id: doc.id, ...doc.data() }, users))
  }

  function addMemoryMarker(memory, usersArr) {
    const color  = userColor(memory.userId, usersArr)
    const icon   = createMemoryIcon(color)
    const marker = L.marker([memory.lat, memory.lng], { icon })
    const imgHtml = memory.imageUrl
      ? `<img src="${memory.imageUrl}" alt="Memory photo" style="width:100%;border-radius:8px;margin-bottom:8px;max-height:160px;object-fit:cover">`
      : ''
    marker.bindPopup(`
      <div style="min-width:180px;font-family:sans-serif">
        <p style="font-size:11px;color:${color};font-weight:700;margin:0 0 4px">${memory.userName}</p>
        ${imgHtml}
        <p style="font-size:13px;margin:0;white-space:pre-wrap">${memory.text}</p>
      </div>
    `, { maxWidth: 220 })
    marker.addTo(memoriesLayer.current)
  }

  const handleSearch = useCallback(async () => {
    const q = sanitizeText(searchQuery).slice(0, 200)
    if (!q) return
    const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=nz`
    try {
      const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data = await res.json()
      if (data.length) leafletMap.current.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 14)
    } catch {}
  }, [searchQuery])

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-2 right-2 top-2 z-[1000] flex gap-2">
        <label htmlFor="map-search" className="sr-only">Search location</label>
        <input
          id="map-search"
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search location..."
          className="flex-1 rounded-xl bg-white px-4 py-2 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button onClick={handleSearch} className="rounded-xl bg-white p-2 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label="Search">
          <Search size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-2">
        {isDemo ? (
          <>
            <button className="flex items-center gap-1 rounded-xl bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-400 shadow-lg cursor-not-allowed" aria-label="GPS disabled in demo">
              <Play size={16} aria-hidden="true" />GPS (Demo)
            </button>
            <button className="flex items-center gap-1 rounded-xl bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-400 shadow-lg cursor-not-allowed" aria-label="Draw disabled in demo">
              <PenLine size={16} aria-hidden="true" />Draw (Demo)
            </button>
            <button className="flex items-center gap-1 rounded-xl bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-400 shadow-lg cursor-not-allowed" aria-label="Add memory disabled in demo">
              <ImagePlus size={16} aria-hidden="true" />Memory (Demo)
            </button>
          </>
        ) : (
          <>
            {!isTracking ? (
              <button onClick={startTracking} className="flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label="Start GPS tracking">
                <Play size={16} aria-hidden="true" />Start GPS
              </button>
            ) : (
              <button onClick={handleStopGPS} className="flex items-center gap-1 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" aria-label="Stop GPS tracking">
                <Square size={16} aria-hidden="true" />Stop GPS
              </button>
            )}
            {!isDrawing ? (
              <button onClick={() => { setIsDrawing(true); setDrawPoints([]) }} className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label="Draw route manually">
                <PenLine size={16} aria-hidden="true" />Draw
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <button onClick={saveDrawnRoute} disabled={isSaving || drawPoints.length < 2} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg disabled:opacity-50 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Save drawn route">
                  <Save size={16} aria-hidden="true" />{isSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setIsDrawing(false); setDrawPoints([]); drawLayer.current.clearLayers() }} className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Cancel drawing">
                  <X size={16} aria-hidden="true" />Cancel
                </button>
              </div>
            )}
            <button
              onClick={() => setMemoryMode(v => !v)}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${memoryMode ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-white hover:bg-gray-50'}`}
              aria-label={memoryMode ? 'Cancel memory mode' : 'Add a memory'}
              aria-pressed={memoryMode}
            >
              <ImagePlus size={16} aria-hidden="true" />Memory
            </button>
          </>
        )}
      </div>

      {gpsError && (
        <div role="alert" className="absolute left-2 right-2 top-14 z-[1000] rounded-xl bg-red-100 p-3 text-xs text-red-700 shadow">
          {gpsError}
        </div>
      )}

      {memoryForm && !isDemo && (
        <div role="dialog" aria-modal="true" aria-label="Add a memory" className="absolute bottom-20 left-2 right-2 z-[1000] rounded-2xl bg-white p-4 shadow-xl">
          <h2 className="mb-3 font-bold text-gray-700">📍 Add a Memory</h2>
          <label htmlFor="memory-text" className="mb-1 block text-xs text-gray-500">Text (max 1000 chars)</label>
          <textarea
            id="memory-text"
            value={memoryText}
            onChange={e => setMemoryText(e.target.value)}
            maxLength={1000}
            rows={3}
            className="mb-2 w-full rounded-xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="What happened here?"
          />
          <label htmlFor="memory-image" className="mb-3 block text-xs text-gray-500">
            Photo (optional)
            <input id="memory-image" type="file" accept="image/*" className="mt-1 block" onChange={e => setMemoryImage(e.target.files?.[0] ?? null)} />
          </label>
          <div className="flex gap-2">
            <button onClick={saveMemory} disabled={isSaving} className="flex-1 rounded-xl bg-pink-500 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setMemoryForm(null); setMemoryText(''); setMemoryImage(null) }} className="rounded-xl bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div ref={mapRef} className="h-full w-full" aria-label="Map of New Zealand" role="application" />
    </div>
  )
}