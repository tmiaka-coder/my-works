import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function SafetyModal({ onAgree }) {
  const btnRef = useRef(null)

  useEffect(() => {
    btnRef.current?.focus()
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-title"
      aria-describedby="safety-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle
            className="shrink-0 text-amber-500"
            size={28}
            aria-hidden="true"
          />
          <h1 id="safety-title" className="text-lg font-bold text-gray-800">
            安全に関する重要な注意事項
          </h1>
        </div>

        <p id="safety-desc" className="mb-5 text-sm leading-relaxed text-gray-600">
          このアプリは<strong>運転中の操作を禁止</strong>しています。
          地図の操作・記録の開始・停止などは、必ず<strong>車両停車中または同乗者</strong>が行ってください。
          <br /><br />
          本アプリの使用によって生じたいかなる損害・事故に対しても、
          開発者は一切の責任を負いません。
          利用者自身の責任においてご使用ください。
        </p>

        <button
          ref={btnRef}
          onClick={onAgree}
          className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white
                     transition hover:bg-green-700 focus:outline-none focus:ring-2
                     focus:ring-green-500 focus:ring-offset-2"
          aria-label="注意事項に同意してアプリを開始する"
        >
          同意してはじめる
        </button>
      </div>
    </div>
  )
}