import { Map, BookOpen, BarChart2, Settings } from 'lucide-react'

const TABS = [
  { id: 'map',      label: 'Map',      Icon: Map       },
  { id: 'diary',    label: 'Memories', Icon: BookOpen  },
  { id: 'stats',    label: 'Stats',    Icon: BarChart2 },
  { id: 'settings', label: 'Settings', Icon: Settings  },
]

export default function BottomNav({ activeTab, onTabChange, themeStyle }) {
  return (
    <nav
      aria-label="Main navigation"
      className={`fixed bottom-0 left-0 right-0 z-50 flex border-t
                 ${themeStyle?.nav ?? 'bg-white border-gray-200'}`}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs
                        transition-colors focus:outline-none focus-visible:ring-2
                        focus-visible:ring-green-500 focus-visible:ring-inset
                        ${active
                          ? themeStyle?.activeNav ?? 'text-green-600'
                          : themeStyle?.inactiveNav ?? 'text-gray-400 hover:text-gray-600'
                        }`}
          >
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}