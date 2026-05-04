import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import {
  mockVolumeByDay,
  mockServiceTypeStats,
  mockPeakHours,
  mockPunctualityStats,
  mockOutflowWait,
} from '../mock/data'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f97316', '#3b82f6']
const TABS = ['Visão Geral', 'Por Tipo de Serviço', 'Operações']

function formatTime(sec) {
  if (sec >= 3600) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}min`
  return `${Math.floor(sec / 60)}min`
}

function speedBadge(avgSec, overallAvg) {
  const r = avgSec / overallAvg
  if (r < 0.8) return { label: 'Rápido', cls: 'bg-emerald-100 text-emerald-700' }
  if (r > 1.2) return { label: 'Lento',  cls: 'bg-red-100 text-red-700' }
  return { label: 'Normal', cls: 'bg-gray-100 text-gray-600' }
}

function VisaoGeralTab() {
  const rankingData = [...mockServiceTypeStats]
    .sort((a, b) => b.avg_total_sec - a.avg_total_sec)
    .map(s => ({ name: s.service_type, minutos: Math.round(s.avg_total_sec / 60) }))

  const pieData = mockServiceTypeStats.map(s => ({ name: s.service_type, value: s.count }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Veículos Atendidos por Dia</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={mockVolumeByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip formatter={v => [v, 'Veículos']} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, fill: '#6366f1' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Ranking por Tempo Médio Total (min)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rankingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v} min`, 'Tempo médio']} />
              <Bar dataKey="minutos" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Distribuição por Tipo de Serviço
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [`${v} OS`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
            {pieData.map((entry, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {entry.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PorServicoTab({ overallAvg }) {
  return (
    <div className="space-y-3">
      {[...mockServiceTypeStats]
        .sort((a, b) => b.avg_total_sec - a.avg_total_sec)
        .map(s => {
          const badge = speedBadge(s.avg_total_sec, overallAvg)
          return (
            <div
              key={s.service_type}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">{s.service_type}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{s.count} ordens realizadas</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">Tempo total médio</p>
                <p className="text-lg font-bold text-gray-900">{formatTime(s.avg_total_sec)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">Só serviço</p>
                <p className="text-base font-semibold text-indigo-600">{formatTime(s.avg_service_sec)}</p>
              </div>
            </div>
          )
        })}
    </div>
  )
}

function OperacoesTab() {
  const peakHour = mockPeakHours.reduce((max, h) => h.count > max.count ? h : max, mockPeakHours[0])
  const avgOutflow = Math.round(
    mockOutflowWait.reduce((s, d) => s + d.avg_min, 0) / mockOutflowWait.length
  )
  const overallPct = Math.round(
    mockPunctualityStats.reduce((s, p) => s + p.on_time, 0) /
    mockPunctualityStats.reduce((s, p) => s + p.total, 0) * 100
  )

  return (
    <div className="space-y-6">
      {/* Stat summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Horário de pico</p>
          <p className="text-2xl font-bold text-gray-900">{peakHour.hour}</p>
          <p className="text-xs text-gray-500 mt-1">{peakHour.count} entradas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Pontualidade geral</p>
          <p className="text-2xl font-bold text-gray-900">{overallPct}%</p>
          <p className="text-xs text-gray-500 mt-1">concluídos no prazo</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Espera pós-pronto</p>
          <p className="text-2xl font-bold text-gray-900">{avgOutflow} min</p>
          <p className="text-xs text-gray-500 mt-1">média dos últimos 7 dias</p>
        </div>
      </div>

      {/* Horário de pico */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Entradas por Hora do Dia</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mockPeakHours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip formatter={v => [v, 'Entradas']} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
              {mockPeakHours.map((h, i) => (
                <Cell
                  key={i}
                  fill={h.count === peakHour.count ? '#4f46e5' : '#a5b4fc'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxa de pontualidade */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Taxa de Pontualidade por Serviço</h2>
          <div className="space-y-4">
            {[...mockPunctualityStats]
              .sort((a, b) => b.on_time / b.total - a.on_time / a.total)
              .map(p => {
                const pct = Math.round((p.on_time / p.total) * 100)
                const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'
                return (
                  <div key={p.service_type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium truncate pr-2">{p.service_type}</span>
                      <span className="text-gray-500 shrink-0">{p.on_time}/{p.total} — {pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Espera pós-pronto */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Espera Pós-Pronto por Dia (min)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockOutflowWait}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit=" min" />
              <Tooltip formatter={v => [`${v} min`, 'Espera média']} />
              <ReferenceLine
                y={avgOutflow}
                stroke="#6366f1"
                strokeDasharray="4 4"
                label={{ value: 'Média', fill: '#6366f1', fontSize: 11 }}
              />
              <Bar dataKey="avg_min" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function Analise() {
  const [activeTab, setActiveTab] = useState('Visão Geral')
  const overallAvg =
    mockServiceTypeStats.reduce((s, x) => s + x.avg_total_sec, 0) / mockServiceTypeStats.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análise de Dados</h1>
        <p className="text-sm text-gray-500 mt-1">Tendências e métricas agregadas</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Visão Geral' && <VisaoGeralTab />}
      {activeTab === 'Por Tipo de Serviço' && <PorServicoTab overallAvg={overallAvg} />}
      {activeTab === 'Operações' && <OperacoesTab />}
    </div>
  )
}
