import { useState } from 'react'
import DateFilter from '../components/DateFilter'
import { mockHistory, STAGE_LABELS } from '../mock/data'

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

function fmtDuration(sec) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const STAGE_COLORS = {
  waiting:   'bg-yellow-100 text-yellow-800',
  transit:   'bg-blue-100 text-blue-800',
  lift_up:   'bg-purple-100 text-purple-800',
  service:   'bg-green-100 text-green-800',
  lift_down: 'bg-orange-100 text-orange-800',
  outflow:   'bg-gray-100 text-gray-700',
}

export default function History() {
  const today = new Date().toISOString().slice(0, 10)
  const [period, setPeriod] = useState({ start: today, end: today })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Histórico</h1>
          <p className="text-sm text-gray-500">Registro de todas as etapas por veículo</p>
        </div>
        <DateFilter value={period} onChange={setPeriod} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {['Prisma', 'Etapa', 'Elevador', 'Entrada', 'Saída', 'Duração'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockHistory.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-gray-900">{e.prism_code}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[e.stage]}`}>
                    {STAGE_LABELS[e.stage]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {e.elevator_id ? `Elevador ${e.elevator_id}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">{fmtTime(e.entered_at)}</td>
                <td className="px-4 py-3 text-gray-700">{fmtTime(e.exited_at)}</td>
                <td className={`px-4 py-3 font-medium ${e.duration_sec === null ? 'text-gray-400' : 'text-gray-900'}`}>
                  {fmtDuration(e.duration_sec)}
                  {e.duration_sec === null && (
                    <span className="ml-2 text-xs text-[#CC0000]">em andamento</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
