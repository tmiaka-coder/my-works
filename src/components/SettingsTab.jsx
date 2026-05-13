import { useState, useRef } from 'react'
import { db, storage } from '../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { sanitizeText } from '../lib/sanitize'
import { UserCircle2, Save, LogOut } from 'lucide-react'

// 選択可能なピンカラー
const PIN_COLORS = [
  { label: '青',     value: '#3b82f6' },
  { label: '赤',     value: '#ef4444' },
  { label: '黄',     value: '#eab308' },
  { label: '緑',     value: '#22c55e' },
  { label: '紫',     value: '#a855f7' },
  { label: 'ピンク', value: '#ec4899' },
  { label: 'オレンジ', value: '#f97316' },
  { label: '黒',     value: '#1f2937' },
  { label: '白',     value: '#f9fafb' },
]

// テーマ一覧
const THEMES = [
  {
    id: 'nature',
    label: '🌿 NZの自然',
    bg: 'bg-green-50',
    nav: 'bg-white',
    accent: 'text-green-600',
    ring: 'focus:ring-green-500',
    activeNav: 'text-green-600',
    btnBg: 'bg-green-600 hover:bg-green-700',
  },
  {
    id: 'ocean',
    label: '🌊 オーシャン',
    bg: 'bg-blue-50',
    nav: 'bg-blue-900',
    accent: 'text-blue-600',
    ring: 'focus:ring-blue-500',
    activeNav: 'text-blue-300',
    btnBg: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    id: 'allblacks',
    label: '🏉 ALL Blacks',
    bg: 'bg-gray-900',
    nav: 'bg-black',
    accent: 'text-white',
    ring: 'focus:ring-gray-400',
    activeNav: 'text-white',
    btnBg: 'bg-gray-700 hover:bg-gray-600',
  },
]

// デフォルトアイコン5種
const DEFAULT_ICONS = [
  '🧭', '🏔️', '🌏', '🚐', '⛺',
]

export default function SettingsTab({ users, setUsers, currentUser, setCurrentUser, onLogout }) {
  const [names, setNames]         = useState(users.map((u) => u.name))
  const [saved, setSaved]         = useState(false)
  const [pinColor, setPinColor]   = useState(currentUser?.pinColor ?? '#3b82f6')
  const [theme, setTheme]         = useState(currentUser?.theme ?? 'nature')
  const [icon, setIcon]           = useState(currentUser?.photoURL ?? null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function saveSettings() {
    const sanitized = names.map((n) => sanitizeText(n).slice(0, 30) || 'ユーザー')
    const updated = users.map((u, i) => ({
      ...u,
      name: sanitized[i],
      pinColor: u.id === currentUser.id ? pinColor : u.pinColor,
      theme:    u.id === currentUser.id ? theme    : u.theme,
      photoURL: u.id === currentUser.id ? icon     : u.photoURL,
    }))
    setUsers(updated)
    const cur = updated.find((u) => u.id === currentUser.id)
    if (cur) setCurrentUser(cur)

    await setDoc(doc(db, 'userSettings', currentUser.id), {
      displayName: sanitized[users.findIndex(u => u.id === currentUser.id)],
      pinColor,
      theme,
      photoURL: icon,
    }, { merge: true })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // リサイズ
      const blob = await resizeImage(file, 200)
      const sRef = ref(storage, `avatars/${currentUser.id}/avatar.jpg`)
      await uploadBytes(sRef, blob)
      const url = await getDownloadURL(sRef)
      setIcon(url)
    } finally {
      setUploading(false)
    }
  }

  async function resizeImage(file, maxPx = 200) {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = img.width  * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', 0.85)
      }
      img.src = url
    })
  }

  return (
    <section aria-label="設定" className="h-full overflow-y-auto p-4 pb-20">
      <h1 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-700">
        <UserCircle2 size={18} aria-hidden="true" />設定
      </h1>

      {/* アイコン設定 */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">アイコン設定</p>
        <div className="flex items-center gap-4 mb-3">
          {/* 現在のアイコン */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-3xl border-2 border-gray-200">
            {icon ? (
              <img src={icon} alt="アイコン" className="w-full h-full object-cover" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600
                         hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="画像をアップロード"
            >
              {uploading ? 'アップロード中…' : '📷 写真をアップロード'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* デフォルトアイコン5種 */}
        <p className="mb-2 text-xs text-gray-500">またはアイコンを選ぶ</p>
        <div className="flex gap-2">
          {DEFAULT_ICONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setIcon(emoji)}
              className={`w-10 h-10 rounded-full text-xl flex items-center justify-center
                          border-2 transition
                          ${icon === emoji ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
              aria-label={`アイコン${emoji}を選択`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ユーザー名編集 */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">ユーザー名を変更</p>
        {users.map((u, i) => {
          const isMe = u.id === currentUser.id
          const badge = i === 1 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          return (
            <div key={u.id} className="mb-3">
              <label htmlFor={`user-name-${i}`} className="mb-1 block text-xs text-gray-500">
                <span className={`mr-1 rounded-full px-2 py-0.5 text-xs font-bold ${badge}`}>
                  {isMe ? 'あなた' : 'パートナー'}
                </span>
                名前（最大30文字）{!isMe && <span className="text-gray-400">※自分のみ編集可</span>}
              </label>
              <input
                id={`user-name-${i}`}
                type="text"
                value={names[i]}
                maxLength={30}
                disabled={!isMe}
                onChange={(e) => {
                  if (!isMe) return
                  const next = [...names]
                  next[i] = e.target.value
                  setNames(next)
                }}
                className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                            focus:outline-none focus:ring-2 focus:ring-green-400
                            ${!isMe ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                aria-label={`${isMe ? 'あなた' : 'パートナー'}の名前`}
              />
            </div>
          )
        })}
      </div>

      {/* ピンカラー */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">ピンの色</p>
        <div className="flex flex-wrap gap-2">
          {PIN_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setPinColor(c.value)}
              className={`w-8 h-8 rounded-full border-4 transition
                          ${pinColor === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ background: c.value }}
              aria-label={`ピンの色を${c.label}に設定`}
              aria-pressed={pinColor === c.value}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          選択中: <span style={{ color: pinColor }}>●</span> {PIN_COLORS.find(c => c.value === pinColor)?.label}
        </p>
      </div>

      {/* テーマ */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">テーマカラー</p>
        <div className="flex flex-col gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={`rounded-xl px-4 py-3 text-sm font-semibold text-left transition
                          border-2 focus:outline-none focus:ring-2 focus:ring-green-400
                          ${theme === t.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
            >
              {t.label}
              {theme === t.id && <span className="ml-2 text-green-500">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <button
          onClick={saveSettings}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3
                     text-sm font-semibold text-white hover:bg-green-700
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="設定を保存"
        >
          <Save size={16} aria-hidden="true" />
          {saved ? '保存しました ✓' : '設定を保存'}
        </button>
      </div>

      {/* 操作者切り替え */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-600">現在の操作者</p>
        <div className="flex gap-2" role="group" aria-label="操作者を選択">
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
                {u.photoURL && !u.photoURL.startsWith('http') ? (
                  <span className="mr-1">{u.photoURL}</span>
                ) : null}
                {u.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ログアウト */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl
                     bg-gray-100 py-3 text-sm font-semibold text-gray-600
                     hover:bg-red-50 hover:text-red-600
                     focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="ログアウト"
        >
          <LogOut size={16} aria-hidden="true" />
          ログアウト
        </button>
      </div>
    </section>
  )
}