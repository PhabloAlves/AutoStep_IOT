const ACCENTS = {
  blue:    'border-l-4 border-l-blue-500',
  amber:   'border-l-4 border-l-amber-500',
  emerald: 'border-l-4 border-l-emerald-500',
  orange:  'border-l-4 border-l-orange-500',
  violet:  'border-l-4 border-l-violet-500',
  gray:    'border-l-4 border-l-gray-300',
}

const VALUE_COLORS = {
  blue:    'text-blue-600',
  amber:   'text-amber-600',
  emerald: 'text-emerald-600',
  orange:  'text-orange-600',
  violet:  'text-violet-600',
  gray:    'text-gray-900',
}

export default function StatCard({ title, value, unit, note, accent = 'gray' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${ACCENTS[accent]}`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className={`text-3xl font-bold ${VALUE_COLORS[accent]}`}>
          {value}
        </span>
        {unit && <span className="mb-1 text-sm text-gray-400">{unit}</span>}
      </div>
      {note && <p className="mt-1 text-xs text-gray-400">{note}</p>}
    </div>
  )
}
