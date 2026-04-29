import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import StatCard from '../components/StatCard'
import DateFilter from '../components/DateFilter'
import { mockDailyMetrics, STAGE_LABELS } from '../mock/data'

function fmtMin(sec) {
  return `${Math.round(sec / 60)} min`
}

const STAGE_COLORS = {
  'Espera':       '#F59E0B',
  'Deslocamento': '#3B82F6',
  'Inspeção':     '#8B5CF6',
  'Serviço':      '#10B981',
  'Descida':      '#F97316',
  'Entrega':      '#6B7280',
}

const chartData = mockDailyMetrics.map(m => ({
  name: STAGE_LABELS[m.stage],
  minutos: Math.round(m.avg_duration_sec / 60),
}))

export default function Overview() {
  const [period, setPeriod] = useState('today')

  const totalVehicles = 8
  const avgWait = mockDailyMetrics.find(m => m.stage === 'waiting')?.avg_duration_sec ?? 0
  const avgService = mockDailyMetrics.find(m => m.stage === 'service')?.avg_duration_sec ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-sm text-gray-500">Desempenho da oficina por período</p>
        </div>
        <DateFilter value={period} onChange={setPeriod} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Veículos atendidos"    value={totalVehicles}   unit="hoje"    accent="blue"    />
        <StatCard title="Tempo médio de espera" value={fmtMin(avgWait)}                note="Lado de fora" accent="amber"   />
        <StatCard title="Tempo médio de serviço" value={fmtMin(avgService)}            note="No elevador"  accent="emerald" />
        <StatCard title="Gargalos detectados"   value={2}              unit="etapas"  accent="orange"  />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Tempo médio por etapa (minutos)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} unit=" min" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip formatter={(v) => [`${v} min`, 'Média']} />
            <ReferenceLine x={40} stroke="#6366F1" strokeDasharray="4 4" label={{ value: 'Meta', fill: '#6366F1', fontSize: 11 }} />
            <Bar dataKey="minutos" radius={[0, 4, 4, 0]}>
              {chartData.map(entry => (
                <Cell key={entry.name} fill={STAGE_COLORS[entry.name] ?? '#6B7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
