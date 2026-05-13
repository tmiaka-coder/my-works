import { useCallback } from 'react'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

async function snapToRoads(rawPoints) {
  if (rawPoints.length < 2) return rawPoints

  const lats = rawPoints.map((p) => p.lat)
  const lngs = rawPoints.map((p) => p.lng)
  const bbox = [
    Math.min(...lats) - 0.01,
    Math.min(...lngs) - 0.01,
    Math.max(...lats) + 0.01,
    Math.max(...lngs) + 0.01,
  ].join(',')

  const query = `
    [out:json][timeout:10];
    way["highway"](${bbox});
    (._;>;);
    out body;
  `

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!res.ok) {
    console.warn('Overpass APIエラー。元のポイントを使用します。')
    return rawPoints
  }

  const data = await res.json()

  const nodeMap = {}
  data.elements
    .filter((e) => e.type === 'node')
    .forEach((n) => { nodeMap[n.id] = { lat: n.lat, lng: n.lon } })

  return rawPoints.map((p) => {
    let nearest = p
    let minDist = Infinity
    Object.values(nodeMap).forEach((n) => {
      const d = Math.hypot(n.lat - p.lat, n.lng - p.lng)
      if (d < minDist) { minDist = d; nearest = n }
    })
    return nearest
  })
}

export function useRoute() {
  const snap = useCallback(
    (points) => snapToRoads(points),
    [],
  )
  return { snapToRoads: snap }
}