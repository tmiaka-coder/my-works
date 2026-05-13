import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { totalDistance } from '../lib/haversine'
import { BarChart2 } from 'lucide-react'

const GOAL_KM         = 11000
const SOUTH_ISLAND_LAT = -40.5

export default function StatsTab({ users }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const snap   = await getDocs(collection(db, 'routes'))
      const routes = snap.docs.map((d) => d.data())

      let totalKm    = 0
      let northKm    = 0
      let southKm    = 0
      const byUser   = {}

      users.forEach((u) => { byUser[u.id] = 0 })

      routes.forEach((r) => {
        const km = r.distance ?? totalDistance(r.points ?? [])
        totalKm += km
        byUser[r.userId] = (byUser[r.userId] ?? 0) + km

        const pts = r.points ?? []
        if (pts.length) {
          const avgLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length
          if (avgLat > SOUTH_ISLAND_LAT) northKm += km
          else southKm += km
        }
      })

      setStats({ totalKm, northKm, southKm, byUser })
    }
    load()
  }, [users])

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400" role="status" aria-live="polite">
        集計中…
      </div>
    )
  }

  const pct        = Math.min(100, (stats.totalKm / GOAL_KM) * 100)
  const northPct   = stats.totalKm ? (stats.northKm / stats.totalKm) * 100 : 0
  const southPct   = stats.totalKm ? (stats.southKm / stats.totalKm) * 100 : 0

  return (
    <section aria-label="走行距離の統計" className="h-full overflow-y-auto p-4 pb-20">
      <h1 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-700">
        <BarChart2 size={18} aria-hidden="true" />走行距離統計
      </h1>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-gray-600">NZ総走行距離</p>
        <p className="mb-2 text-3xl font-bold text-green-600">
          {stats.totalKm.toFixed(1)} <span className="text-base font-normal text-gray-400">km</span>
        </p>
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`目標${GOAL_KM}kmに対して${pct.toFixed(1)}%達成`}
          className="relative h-4 w-full overflow-hidden rounded-full bg-gray-100"
        >
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">
          目標 {GOAL_KM.toLocaleString()} km の {pct.toFixed(1)}% 達成
        </p>
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">島別走行距離</p>
        <IslandBar label="北島" km={stats.northKm} pct={northPct} color="bg-blue-400" />
        <IslandBar label="南島" km={stats.southKm} pct={southPct} color="bg-amber-400" />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">ユーザー別走行距離</p>
        {users.map((u, i) => {
          const km  = stats.byUser[u.id] ?? 0
          const uPct = stats.totalKm ? (km / stats.totalKm) * 100 : 0
          const color = i === 1 ? 'bg-red-400' : 'bg-blue-500'
          return <IslandBar key={u.id} label={u.name} km={km} pct={uPct} color={color} />
        })}
      </div>
    </section>
  )
}

function IslandBar({ label, km, pct, color }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>{km.toFixed(1)} km ({pct.toFixed(0)}%)</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${km.toFixed(1)}km（${pct.toFixed(0)}%）`}
        className="h-3 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}