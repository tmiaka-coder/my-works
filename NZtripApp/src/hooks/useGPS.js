import { useState, useRef, useCallback } from 'react'

export function useGPS() {
  const [isTracking, setIsTracking]   = useState(false)
  const [points, setPoints]           = useState([])
  const [error, setError]             = useState(null)
  const watchId = useRef(null)

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('お使いの端末はGeolocationに対応していません')
      return
    }
    setError(null)
    setPoints([])
    setIsTracking(true)

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setPoints((prev) => [...prev, { lat, lng, ts: Date.now() }])
      },
      (err) => {
        setError(`位置情報エラー: ${err.message}`)
        setIsTracking(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
  }, [])

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setIsTracking(false)
  }, [])

  return { isTracking, points, error, startTracking, stopTracking }
}