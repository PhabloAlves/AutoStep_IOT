const options = [
  { key: 'today', label: 'Hoje'   },
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mês'   },
]

export default function DateFilter({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            value === key
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
