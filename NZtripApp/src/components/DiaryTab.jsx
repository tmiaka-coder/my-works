import { useState, useEffect } from 'react'
import { userColor } from './MemoryPin'
import { BookOpen } from 'lucide-react'

const DEMO_MEMORIES = [
  {
    id: '1',
    userId: 'user1',
    userName: 'user1',
    lat: -44.6714,
    lng: 167.9271,
    text: 'Milford Sound took our breath away. The mist rolling through the mountains looked like something out of a movie. A place we will never forget.',
    imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80',
    date: '2025/10/03',
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'user2',
    lat: -45.0312,
    lng: 168.6626,
    text: 'Bungee jumping in Queenstown! My legs were shaking before the jump, but the moment I leaped it was pure exhilaration. Definitely coming back.',
    imageUrl: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=600&q=80',
    date: '2025/10/05',
  },
  {
    id: '3',
    userId: 'user1',
    userName: 'user1',
    lat: -38.1368,
    lng: 176.2497,
    text: 'The geothermal fields in Rotorua were unlike anything we had seen — bubbling mud pools and steaming vents everywhere. The Māori culture experience was incredible too.',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
    date: '2025/09/28',
  },
  {
    id: '4',
    userId: 'user2',
    userName: 'user2',
    lat: -43.7350,
    lng: 170.0987,
    text: 'Mount Cook standing tall in the snow — absolutely majestic. The view from the lookout was worth every minute of the drive. Want to attempt the hike next time!',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    date: '2025/09/25',
  },
]

export default function DiaryTab({ users, isDemo }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (isDemo) {
      setMemories(DEMO_MEMORIES)
      setLoading(false)
      return
    }
    import('../lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ collection, query, orderBy, getDocs }) => {
        const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
        getDocs(q).then(snap => {
          setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
          setLoading(false)
        })
      })
    })
  }, [isDemo])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400" role="status">
        Loading...
      </div>
    )
  }

  if (!memories.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
        <BookOpen size={40} aria-hidden="true" />
        <p>No memories yet</p>
        <p className="text-xs">Tap the 📍 button on the map to add one</p>
      </div>
    )
  }

  return (
    <section aria-label="Memory list" className="h-full overflow-y-auto p-3 pb-20">
      <h1 className="mb-4 text-base font-bold text-gray-700">Travel Memories</h1>
      <ul className="flex flex-col gap-3">
        {memories.map((m) => {
          const color = userColor(m.userId, users)
          const date  = m.date ?? m.createdAt?.toDate?.()?.toLocaleDateString('en-NZ') ?? ''
          return (
            <li key={m.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} aria-hidden="true" />
                <span className="text-xs font-semibold" style={{ color }}>{m.userName}</span>
                <span className="ml-auto text-xs text-gray-400">{date}</span>
              </div>
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt={`Memory photo by ${m.userName}`}
                  className="mb-2 w-full rounded-xl object-cover"
                  style={{ maxHeight: '200px' }}
                  loading="lazy"
                />
              )}
              {m.text && <p className="whitespace-pre-wrap text-sm text-gray-700">{m.text}</p>}
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