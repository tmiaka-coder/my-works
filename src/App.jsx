import { useState, useEffect } from 'react'
import SafetyModal  from './components/SafetyModal'
import BottomNav    from './components/BottomNav'
import MapTab       from './components/MapTab'
import DiaryTab     from './components/DiaryTab'
import StatsTab     from './components/StatsTab'
import SettingsTab  from './components/SettingsTab'
import { db, signInWithGoogle, logout, isAllowedUser, onAuth } from './lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const SAFETY_KEY = 'nz_safety_agreed'

// テーマ定義
const THEME_STYLES = {
  nature: {
    bg: 'bg-green-50',
    nav: 'bg-white border-gray-200',
    activeNav: 'text-green-600',
    inactiveNav: 'text-gray-400',
  },
  ocean: {
    bg: 'bg-blue-50',
    nav: 'bg-blue-900 border-blue-800',
    activeNav: 'text-blue-300',
    inactiveNav: 'text-blue-400',
  },
  allblacks: {
    bg: 'bg-gray-900',
    nav: 'bg-black border-gray-800',
    activeNav: 'text-white',
    inactiveNav: 'text-gray-500',
  },
}

export default function App() {
  const [agreed, setAgreed]           = useState(() => !!localStorage.getItem(SAFETY_KEY))
  const [tab, setTab]                 = useState('map')
  const [user, setUser]               = useState(null)
  const [allowed, setAllowed]         = useState(false)
  const [authReady, setAuthReady]     = useState(false)
  const [authError, setAuthError]     = useState(null)
  const [users, setUsers]             = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  // 現在のテーマ
  const themeId     = currentUser?.theme ?? 'nature'
  const themeStyle  = THEME_STYLES[themeId] ?? THEME_STYLES.nature

  useEffect(() => {
    const unsub = onAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const ok = await isAllowedUser(firebaseUser.uid)
        if (ok) {
          setUser(firebaseUser)
          setAllowed(true)
          setAuthError(null)
          await loadUsers(firebaseUser)
        } else {
          await logout()
          setUser(null)
          setAllowed(false)
          setAuthError('このアカウントはアクセス権限がありません。')
        }
      } else {
        setUser(null)
        setAllowed(false)
      }
      setAuthReady(true)
    })
    return unsub
  }, [])

  async function loadUsers(firebaseUser) {
    const snap = await getDoc(doc(db, 'userSettings', firebaseUser.uid))
    const data = snap.data()
    const displayName = data?.displayName ?? firebaseUser.displayName ?? 'User'
    const photoURL    = data?.photoURL    ?? firebaseUser.photoURL    ?? null
    const pinColor    = data?.pinColor    ?? '#3b82f6'
    const theme       = data?.theme       ?? 'nature'

    const allUsersSnap = await getDoc(doc(db, 'allowedUsers', firebaseUser.uid))
    const partnerUid   = allUsersSnap.data()?.partnerUid

    const me = { id: firebaseUser.uid, name: displayName, photoURL, pinColor, theme }
    let partner = null

    if (partnerUid) {
      const partnerSnap = await getDoc(doc(db, 'userSettings', partnerUid))
      const pd = partnerSnap.data()
      partner = {
        id:       partnerUid,
        name:     pd?.displayName ?? 'パートナー',
        photoURL: pd?.photoURL    ?? null,
        pinColor: pd?.pinColor    ?? '#ef4444',
        theme:    pd?.theme       ?? 'nature',
      }
    }

    const userList = partner ? [me, partner] : [me]
    setUsers(userList)
    setCurrentUser(me)
  }

  async function handleLogin() {
    setAuthError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setAuthError('ログインに失敗しました。')
    }
  }

  function handleAgree() {
    localStorage.setItem(SAFETY_KEY, '1')
    setAgreed(true)
  }

  // ロード中
  if (!authReady) {
    return (
      <div className="flex h-dvh items-center justify-center text-gray-400">
        接続中…
      </div>
    )
  }

  // 未ログイン
  if (!user || !allowed) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <h1 className="text-xl font-bold text-gray-800">NZ Trace & Memory</h1>
          <p className="text-sm text-gray-500 mt-1">ニュージーランドの旅の記録</p>
        </div>

        {authError && (
          <p className="rounded-xl bg-red-100 px-4 py-2 text-sm text-red-600">
            {authError}
          </p>
        )}

        <button
          onClick={handleLogin}
          className="flex items-center gap-3 rounded-2xl bg-white px-6 py-3 shadow-lg
                     text-sm font-semibold text-gray-700 hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Googleアカウントでログイン"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
          Googleでログイン
        </button>
      </div>
    )
  }

  return (
    <div className={`flex h-dvh flex-col overflow-hidden ${themeStyle.bg}`}>
      {!agreed && <SafetyModal onAgree={handleAgree} />}

      <main className="flex-1 overflow-hidden pb-16">
        {tab === 'map' && (
          <div className="h-full">
            <MapTab currentUser={currentUser} users={users} />
          </div>
        )}
        {tab === 'diary' && (
          <DiaryTab users={users} themeStyle={themeStyle} />
        )}
        {tab === 'stats' && (
          <StatsTab users={users} themeStyle={themeStyle} />
        )}
        {tab === 'settings' && (
          <SettingsTab
            users={users}
            setUsers={setUsers}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onLogout={logout}
          />
        )}
      </main>

      <BottomNav
        activeTab={tab}
        onTabChange={setTab}
        themeStyle={themeStyle}
      />
    </div>
  )
}