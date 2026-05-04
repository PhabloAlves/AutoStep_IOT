export default function DateFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">De</span>
      <input
        type="date"
        value={value.start}
        onChange={e => onChange({ ...value, start: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <span className="text-xs text-gray-500">até</span>
      <input
        type="date"
        value={value.end}
        onChange={e => onChange({ ...value, end: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  )
}
