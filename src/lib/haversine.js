const R = 6371

export function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const x =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function totalDistance(points) {
  let sum = 0
  for (let i = 1; i < points.length; i++) {
    sum += haversine(points[i - 1], points[i])
  }
  return sum
}