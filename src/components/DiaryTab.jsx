import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { userColor } from './MemoryPin'
import { BookOpen } from 'lucide-react'

export default function DiaryTab({ users }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const q    = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setMemories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400" role="status" aria-live="polite">
        読み込み中…
      </div>
    )
  }

  if (!memories.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
        <BookOpen size={40} aria-hidden="true" />
        <p>まだ思い出がありません</p>
        <p className="text-xs">マップで📍ボタンから追加できます</p>
      </div>
    )
  }

  return (
    <section aria-label="思い出一覧" className="h-full overflow-y-auto p-3 pb-20">
      <h1 className="mb-4 text-base font-bold text-gray-700">思い出の記録</h1>
      <ul className="flex flex-col gap-3">
        {memories.map((m) => {
          const color = userColor(m.userId, users)
          const date  = m.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') ?? ''
          return (
            <li
              key={m.id}
              className="rounded-2xl bg-white p-4 shadow-sm"
              aria-label={`${m.userName}の思い出、${date}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold" style={{ color }}>
                  {m.userName}
                </span>
                <span className="ml-auto text-xs text-gray-400">{date}</span>
              </div>
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt={`${m.userName}が記録した思い出の写真`}
                  className="mb-2 w-full rounded-xl object-cover"
                  style={{ maxHeight: '200px' }}
                  loading="lazy"
                />
              )}
              {m.text && (
                <p className="whitespace-pre-wrap text-sm text-gray-700">{m.text}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                📍 {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}