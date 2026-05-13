import { useState, useRef } from 'react'
import { UserCircle2, Save } from 'lucide-react'

const PIN_COLORS = [
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Red',    value: '#ef4444' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green',  value: '#22c55e' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink',   value: '#ec4899' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Black',  value: '#1f2937' },
  { label: 'White',  value: '#f9fafb' },
]

const THEMES = [
  { id: 'nature',    label: '🌿 NZ Nature'  },
  { id: 'ocean',     label: '🌊 Ocean'      },
  { id: 'allblacks', label: '🏉 ALL Blacks' },
]

const DEFAULT_ICONS = ['🧭', '🏔️', '🌏', '🚐', '⛺']

export default function SettingsTab({ users, setUsers, currentUser, setCurrentUser, onLogout, isDemo }) {
  const [names, setNames]         = useState(users.map(u => u.name))
  const [saved, setSaved]         = useState(false)
  const [pinColor, setPinColor]   = useState(currentUser?.pinColor ?? '#3b82f6')
  const [theme, setTheme]         = useState(currentUser?.theme ?? 'nature')
  const [icon, setIcon]           = useState(currentUser?.photoURL ?? null)

  async function saveSettings() {
    const updated = users.map((u, i) => ({
      ...u,
      name:     names[i] || u.name,
      pinColor: u.id === currentUser.id ? pinColor : u.pinColor,
      theme:    u.id === currentUser.id ? theme    : u.theme,
      photoURL: u.id === currentUser.id ? icon     : u.photoURL,
    }))
    setUsers(updated)
    const cur = updated.find(u => u.id === currentUser.id)
    if (cur) setCurrentUser(cur)

    if (!isDemo) {
      const { db } = await import('../lib/firebase')
      const { doc, setDoc } = await import('firebase/firestore')
      const idx = users.findIndex(u => u.id === currentUser.id)
      await setDoc(doc(db, 'userSettings', currentUser.id), {
        displayName: names[idx],
        pinColor, theme, photoURL: icon,
      }, { merge: true })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section aria-label="Settings" className="h-full overflow-y-auto p-4 pb-20">
      <h1 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-700">
        <UserCircle2 size={18} aria-hidden="true" />Settings
      </h1>

      {/* Avatar */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">Avatar</p>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-3xl border-2 border-gray-200">
            {icon ? (
              icon.startsWith('http') ? <img src={icon} alt="Avatar" className="w-full h-full object-cover" /> : <span>{icon}</span>
            ) : <span>👤</span>}
          </div>
        </div>
        <p className="mb-2 text-xs text-gray-500">Choose an icon</p>
        <div className="flex gap-2">
          {DEFAULT_ICONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => setIcon(emoji)}
              className={`w-10 h-10 rounded-full text-xl flex items-center justify-center border-2 transition
                          ${icon === emoji ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
              aria-label={`Select icon ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Username */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">Display Name</p>
        {users.map((u, i) => {
          const isMe = u.id === currentUser.id
          const badge = i === 1 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          return (
            <div key={u.id} className="mb-3">
              <label htmlFor={`user-name-${i}`} className="mb-1 block text-xs text-gray-500">
                <span className={`mr-1 rounded-full px-2 py-0.5 text-xs font-bold ${badge}`}>
                  {isMe ? 'You' : 'Partner'}
                </span>
                Name (max 30 chars){!isMe && <span className="text-gray-400"> · read-only</span>}
              </label>
              <input
                id={`user-name-${i}`}
                type="text"
                value={names[i]}
                maxLength={30}
                disabled={!isMe}
                onChange={e => {
                  if (!isMe) return
                  const next = [...names]
                  next[i] = e.target.value
                  setNames(next)
                }}
                className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                            focus:outline-none focus:ring-2 focus:ring-green-400
                            ${!isMe ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              />
            </div>
          )
        })}
      </div>

      {/* Pin color */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">Pin Color</p>
        <div className="flex flex-wrap gap-2">
          {PIN_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setPinColor(c.value)}
              className={`w-8 h-8 rounded-full border-4 transition
                          ${pinColor === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ background: c.value }}
              aria-label={`Set pin color to ${c.label}`}
              aria-pressed={pinColor === c.value}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Selected: <span style={{ color: pinColor }}>●</span> {PIN_COLORS.find(c => c.value === pinColor)?.label}
        </p>
      </div>

      {/* Theme */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">Theme</p>
        <div className="flex flex-col gap-2">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={`rounded-xl px-4 py-3 text-sm font-semibold text-left transition
                          border-2 focus:outline-none focus:ring-2 focus:ring-green-400
                          ${theme === t.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
            >
              {t.label}{theme === t.id && <span className="ml-2 text-green-500">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <button
          onClick={saveSettings}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3
                     text-sm font-semibold text-white hover:bg-green-700
                     focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <Save size={16} aria-hidden="true" />
          {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>

      {/* Current user */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">Active User</p>
        <div className="flex gap-2" role="group" aria-label="Select active user">
          {users.map((u, i) => {
            const active = currentUser?.id === u.id
            const activeClass = i === 1 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            return (
              <button
                key={u.id}
                onClick={() => setCurrentUser(u)}
                aria-pressed={active}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition
                            focus:outline-none focus:ring-2 focus:ring-offset-1
                            ${active ? activeClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {u.photoURL && !u.photoURL.startsWith('http') && <span className="mr-1">{u.photoURL}</span>}
                {u.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Logout (hidden in demo) */}
      {!isDemo && onLogout && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl
                       bg-gray-100 py-3 text-sm font-semibold text-gray-600
                       hover:bg-red-50 hover:text-red-600
                       focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Sign Out
          </button>
        </div>
      )}
    </section>
  )
}