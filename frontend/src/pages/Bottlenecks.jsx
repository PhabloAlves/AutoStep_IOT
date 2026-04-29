import { AlertTriangle, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { mockBottlenecks, mockDailyMetrics, STAGE_LABELS } from '../mock/data'

const chartData = mockDailyMetrics.map(m => {
  const bottleneck = mockBottlenecks.find(b => b.stage === m.stage)
  return {
    name: STAGE_LABELS[m.stage],
    'Hoje (min)':      Math.round(m.avg_duration_sec / 60),
    'Histórico (min)': bottleneck
      ? Math.round(bottleneck.historical_avg_sec / 60)
      : Math.round(m.avg_duration_sec / 60),
  }
})

export default function Bottlenecks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gargalos</h1>
        <p className="text-sm text-gray-500">Etapas com tempo acima da média histórica</p>
      </div>

      {/* Alert cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {mockBottlenecks.map(b => (
          <div
            key={b.stage}
            className="flex items-start gap-4 rounded-xl border border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 p-5"
          >
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{STAGE_LABELS[b.stage]}</p>
              <p className="mt-1 text-sm text-gray-600">
                Média hoje:{' '}
                <span className="font-bold text-amber-600">
                  {Math.round(b.today_avg_sec / 60)} min
                </span>{' '}
                — histórico: {Math.round(b.historical_avg_sec / 60)} min
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
              <TrendingUp size={12} />
              +{b.excess_pct}%
            </div>
          </div>
        ))}
      </div>

      {/* Comparison chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Hoje vs. média histórica (minutos)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} unit=" min" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip formatter={(v) => [`${v} min`]} />
            <Legend />
            <Bar dataKey="Histórico (min)" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
            <Bar dataKey="Hoje (min)"      fill="#F59E0B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
