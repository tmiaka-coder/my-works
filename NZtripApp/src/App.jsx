import { useState } from 'react'
import SafetyModal  from './components/SafetyModal'
import BottomNav    from './components/BottomNav'
import MapTab       from './components/MapTab'
import DiaryTab     from './components/DiaryTab'
import StatsTab     from './components/StatsTab'
import SettingsTab  from './components/SettingsTab'

const SAFETY_KEY = 'nz_safety_agreed'

const DEMO_USERS = [
  { id: 'user1', name: 'user1',   pinColor: '#3b82f6', theme: 'nature', photoURL: null },
  { id: 'user2', name: 'user2',    pinColor: '#ef4444', theme: 'nature', photoURL: null },
]

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
  const [users, setUsers]             = useState(DEMO_USERS)
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0])

  const themeId    = currentUser?.theme ?? 'nature'
  const themeStyle = THEME_STYLES[themeId] ?? THEME_STYLES.nature

  function handleAgree() {
    localStorage.setItem(SAFETY_KEY, '1')
    setAgreed(true)
  }

  return (
    <div className={`flex h-dvh flex-col overflow-hidden ${themeStyle.bg}`}>
      {!agreed && <SafetyModal onAgree={handleAgree} />}

      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800 text-center z-50 flex-shrink-0">
        🗺️ Demo Mode — No login required. GPS and save features are disabled in this demo.
      </div>

      <main className="flex-1 overflow-hidden pb-16">
        {tab === 'map' && (
          <div className="h-full">
            <MapTab currentUser={currentUser} users={users} isDemo={true} />
          </div>
        )}
        {tab === 'diary' && (
          <DiaryTab users={users} isDemo={true} themeStyle={themeStyle} />
        )}
        {tab === 'stats' && (
          <StatsTab users={users} isDemo={true} themeStyle={themeStyle} />
        )}
        {tab === 'settings' && (
          <SettingsTab
            users={users}
            setUsers={setUsers}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onLogout={null}
            isDemo={true}
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