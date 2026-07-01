import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import StatCard from '../components/StatCard'
import DateFilter from '../components/DateFilter'
import { api } from '../api'

const STAGE_LABELS = {
  waiting:   'Espera',
  transit:   'Deslocamento',
  lift_up:   'Inspeção',
  service:   'Serviço',
  lift_down: 'Descida',
  outflow:   'Entrega',
}

const STAGE_COLORS = {
  'Espera':       '#F59E0B',
  'Deslocamento': '#3B82F6',
  'Inspeção':     '#8B5CF6',
  'Serviço':      '#10B981',
  'Descida':      '#F97316',
  'Entrega':      '#6B7280',
}

function fmtDuration(sec) {
  sec = Math.round(sec || 0)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}min ${s}s` : `${s}s`
}

function today() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Overview() {
  const [period, setPeriod]         = useState({ start: today(), end: today() })
  const [metrics, setMetrics]       = useState([])
  const [bottlenecks, setBottlenecks] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.dailyMetrics(period.start),
      api.bottlenecks(),
    ]).then(([m, b]) => {
      setMetrics(m || [])
      setBottlenecks(b || [])
    }).finally(() => setLoading(false))
  }, [period.start])

  const chartData = metrics.map(m => ({
    name:        STAGE_LABELS[m.stage] ?? m.stage,
    minutos:     Math.round((m.avg_duration_sec || 0) / 60),
    duration_sec: m.avg_duration_sec || 0,
  }))

  const totalVehicles = metrics.find(m => m.stage === 'waiting')?.count ?? 0
  const avgWait    = metrics.find(m => m.stage === 'waiting')?.avg_duration_sec ?? 0
  const avgService = metrics.find(m => m.stage === 'service')?.avg_duration_sec ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-sm text-gray-500">Desempenho da oficina por período</p>
        </div>
        <DateFilter value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Veículos atendidos"     value={totalVehicles}              unit="hoje"    accent="blue"    />
        <StatCard title="Tempo médio de espera"  value={fmtDuration(avgWait)}                      note="Lado de fora" accent="amber"   />
        <StatCard title="Tempo médio de serviço" value={fmtDuration(avgService)}                   note="No elevador"  accent="emerald" />
        <StatCard title="Gargalos detectados"    value={bottlenecks.length}         unit="etapas"  accent="orange"  />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Tempo médio por etapa (minutos)</h2>
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Carregando…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Nenhum dado para o período selecionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} unit=" min" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(_, __, props) => [fmtDuration(props.payload.duration_sec), 'Média']} />
              <ReferenceLine x={40} stroke="#6366F1" strokeDasharray="4 4" label={{ value: 'Meta', fill: '#6366F1', fontSize: 11 }} />
              <Bar dataKey="minutos" radius={[0, 4, 4, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={STAGE_COLORS[entry.name] ?? '#6B7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
