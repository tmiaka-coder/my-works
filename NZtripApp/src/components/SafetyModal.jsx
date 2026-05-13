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
          <AlertTriangle className="shrink-0 text-amber-500" size={28} aria-hidden="true" />
          <h1 id="safety-title" className="text-lg font-bold text-gray-800">
            Important Safety Notice
          </h1>
        </div>
        <p id="safety-desc" className="mb-5 text-sm leading-relaxed text-gray-600">
          <strong>Do not operate this app while driving.</strong> All map operations, recording, and controls must be performed while the vehicle is stationary or by a passenger.
          <br /><br />
          The developers accept no responsibility for any accidents or damages arising from use of this app. Use at your own risk.
        </p>
        <button
          ref={btnRef}
          onClick={onAgree}
          className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white
                     transition hover:bg-green-700 focus:outline-none focus:ring-2
                     focus:ring-green-500 focus:ring-offset-2"
          aria-label="Agree to terms and start the app"
        >
          Agree & Get Started
        </button>
      </div>
    </div>
  )
}