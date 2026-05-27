import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { api } from '../api'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f97316', '#3b82f6']
const TABS = ['Visão Geral', 'Por Tipo de Serviço', 'Operações']

function formatTime(sec) {
  if (!sec) return '0 min'
  if (sec >= 3600) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}min`
  return `${Math.floor(sec / 60)}min`
}

function speedBadge(avgSec, overallAvg) {
  if (!overallAvg) return { label: 'Normal', cls: 'bg-gray-100 text-gray-600' }
  const r = avgSec / overallAvg
  if (r < 0.8) return { label: 'Rápido', cls: 'bg-emerald-100 text-emerald-700' }
  if (r > 1.2) return { label: 'Lento',  cls: 'bg-red-100 text-red-700' }
  return { label: 'Normal', cls: 'bg-gray-100 text-gray-600' }
}

function EmptyState({ text = 'Sem dados suficientes' }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">{text}</div>
  )
}

function VisaoGeralTab({ volumeByDay, serviceTypeStats }) {
  const rankingData = [...serviceTypeStats]
    .sort((a, b) => b.avg_total_sec - a.avg_total_sec)
    .map(s => ({ name: s.service_type, minutos: Math.round(s.avg_total_sec / 60) }))

  const pieData = serviceTypeStats.map(s => ({ name: s.service_type, value: s.count }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Veículos Atendidos por Dia</h2>
        {volumeByDay.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={volumeByDay}>
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
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Ranking por Tempo Médio Total (min)
          </h2>
          {rankingData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rankingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v} min`, 'Tempo médio']} />
                <Bar dataKey="minutos" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Distribuição por Tipo de Serviço
          </h2>
          {pieData.length === 0 ? <EmptyState /> : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PorServicoTab({ serviceTypeStats }) {
  const overallAvg = serviceTypeStats.length
    ? serviceTypeStats.reduce((s, x) => s + x.avg_total_sec, 0) / serviceTypeStats.length
    : 0

  if (serviceTypeStats.length === 0) {
    return <EmptyState text="Nenhuma OS com tipo de serviço registrada" />
  }

  return (
    <div className="space-y-3">
      {[...serviceTypeStats]
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

function OperacoesTab({ peakHours, punctualityStats, outflowWait }) {
  const peakHour  = peakHours.length
    ? peakHours.reduce((max, h) => h.count > max.count ? h : max, peakHours[0])
    : null

  const avgOutflow = outflowWait.length
    ? Math.round(outflowWait.reduce((s, d) => s + d.avg_min, 0) / outflowWait.length)
    : 0

  const totalOnTime = punctualityStats.reduce((s, p) => s + p.on_time, 0)
  const totalAll    = punctualityStats.reduce((s, p) => s + p.total, 0)
  const overallPct  = totalAll > 0 ? Math.round(totalOnTime / totalAll * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stat summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Horário de pico</p>
          <p className="text-2xl font-bold text-gray-900">{peakHour?.hour ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{peakHour?.count ?? 0} entradas</p>
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
        {peakHours.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={v => [v, 'Entradas']} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                {peakHours.map((h, i) => (
                  <Cell
                    key={i}
                    fill={peakHour && h.count === peakHour.count && h.count > 0 ? '#4f46e5' : '#a5b4fc'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxa de pontualidade */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Taxa de Pontualidade por Serviço</h2>
          {punctualityStats.length === 0 ? <EmptyState text="Dados insuficientes" /> : (
            <div className="space-y-4">
              {[...punctualityStats]
                .sort((a, b) => b.on_time / b.total - a.on_time / a.total)
                .map(p => {
                  const pct   = p.total > 0 ? Math.round((p.on_time / p.total) * 100) : 0
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
          )}
        </div>

        {/* Espera pós-pronto */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Espera Pós-Pronto por Dia (min)
          </h2>
          {outflowWait.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={outflowWait}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" min" />
                <Tooltip formatter={v => [`${v} min`, 'Espera média']} />
                {avgOutflow > 0 && (
                  <ReferenceLine
                    y={avgOutflow}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    label={{ value: 'Média', fill: '#6366f1', fontSize: 11 }}
                  />
                )}
                <Bar dataKey="avg_min" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Analise() {
  const [activeTab, setActiveTab] = useState('Visão Geral')
  const [loading, setLoading]     = useState(true)
  const [data, setData]           = useState({
    volumeByDay:      [],
    serviceTypeStats: [],
    peakHours:        [],
    outflowWait:      [],
    punctuality:      [],
  })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.volumeByDay(7),
      api.serviceTypeStats(),
      api.peakHours(),
      api.outflowWait(7),
      api.punctuality(),
    ]).then(([vol, svc, peak, outflow, punct]) => {
      setData({
        volumeByDay:      vol      || [],
        serviceTypeStats: svc      || [],
        peakHours:        peak     || [],
        outflowWait:      outflow  || [],
        punctuality:      punct    || [],
      })
    }).finally(() => setLoading(false))
  }, [])

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

      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Carregando análises…</div>
      ) : (
        <>
          {activeTab === 'Visão Geral' && (
            <VisaoGeralTab
              volumeByDay={data.volumeByDay}
              serviceTypeStats={data.serviceTypeStats}
            />
          )}
          {activeTab === 'Por Tipo de Serviço' && (
            <PorServicoTab serviceTypeStats={data.serviceTypeStats} />
          )}
          {activeTab === 'Operações' && (
            <OperacoesTab
              peakHours={data.peakHours}
              punctualityStats={data.punctuality}
              outflowWait={data.outflowWait}
            />
          )}
        </>
      )}
    </div>
  )
}
