import L from 'leaflet'

/** ユーザーのピンカラーを返す（設定値優先） */
export function userColor(userId, users) {
  const user = users.find((u) => u.id === userId)
  if (user?.pinColor) return user.pinColor
  const idx = users.findIndex((u) => u.id === userId)
  return idx === 1 ? '#ef4444' : '#3b82f6'
}

/** カスタムDivIconを生成 */
export function createMemoryIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div aria-hidden="true" style="
        width:28px; height:28px; border-radius:50% 50% 50% 0;
        background:${color}; border:2px solid white;
        transform:rotate(-45deg); box-shadow:0 2px 6px rgba(0,0,0,.35);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}