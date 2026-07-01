import { useState, useEffect, useRef } from 'react'
import { X, Radio } from 'lucide-react'
import DateFilter from '../components/DateFilter'
import { api } from '../api'
import { playAdvanceSound } from '../sound'

const STAGE_ORDER = ['waiting', 'transit', 'lift_up', 'service', 'lift_down', 'outflow']

const STAGE_LABELS = {
  waiting:   'Espera',
  transit:   'Deslocamento',
  lift_up:   'Inspeção',
  service:   'Serviço',
  lift_down: 'Descida',
  outflow:   'Entrega',
}

const STAGE_COLORS = {
  waiting:   'bg-yellow-100 text-yellow-800',
  transit:   'bg-blue-100 text-blue-800',
  lift_up:   'bg-purple-100 text-purple-800',
  service:   'bg-green-100 text-green-800',
  lift_down: 'bg-orange-100 text-orange-800',
  outflow:   'bg-gray-100 text-gray-700',
}

const EVENTS_POLL_MS  = 5000
const SESSION_POLL_MS = 3000

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} ${timeStr}`
}

function fmtDuration(sec) {
  if (sec == null) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function fmtElapsed(fromIso) {
  if (!fromIso) return '—'
  const sec = Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 1000))
  return fmtDuration(sec)
}

function today() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function ActiveSessionCard({ session, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-56 text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-semibold text-gray-900 text-sm">{session.prism_code}</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>
      <p className="text-xs text-gray-500 truncate mb-2">
        {session.plate || 'Sem placa'} {session.service_type ? `· ${session.service_type}` : ''}
      </p>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[session.current_stage] ?? 'bg-gray-100 text-gray-700'}`}>
        {STAGE_LABELS[session.current_stage] ?? session.current_stage}
      </span>
      {session.inside && (
        <p className="text-[11px] text-gray-400 mt-2">
          nesta etapa há {fmtElapsed(session.stage_entered_at)}
        </p>
      )}
    </button>
  )
}

function SessionDetailModal({ prismCode, onClose }) {
  const [session, setSession] = useState(null)
  const [history, setHistory] = useState([])
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    function refresh() {
      Promise.all([api.activeSessions(), api.vehicleHistory(prismCode)]).then(([sessions, hist]) => {
        if (cancelled) return
        setSession((sessions || []).find(s => s.prism_code === prismCode) || null)
        setHistory(hist || [])
      })
    }

    refresh()
    const dataInterval = setInterval(refresh, SESSION_POLL_MS)
    const tickInterval  = setInterval(() => setTick(t => t + 1), 1000)

    return () => {
      cancelled = true
      clearInterval(dataInterval)
      clearInterval(tickInterval)
    }
  }, [prismCode])

  const stageMap = {}
  for (const e of history) {
    if (!stageMap[e.stage]) stageMap[e.stage] = e
  }

  const currentIdx = session ? STAGE_ORDER.indexOf(session.current_stage) : -1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900 font-mono">{prismCode}</h2>
            {session?.plate && <span className="text-sm text-gray-500">— {session.plate}</span>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {!session ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Esta sessão foi encerrada (prisma liberado).
            </p>
          ) : (
            <ol className="space-y-3">
              {STAGE_ORDER.map((stage, i) => {
                const ev = stageMap[stage]
                const isCurrent = i === currentIdx
                const isDone    = ev?.exited_at != null
                const isPending = !ev && !isCurrent

                return (
                  <li
                    key={stage}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                      isCurrent ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isDone ? '✓' : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                        {STAGE_LABELS[stage]}
                      </p>
                      {ev && (
                        <p className="text-xs text-gray-500">
                          entrou às {fmtTime(ev.entered_at).split(' ')[1]}
                          {ev.exited_at && ` · saiu às ${fmtTime(ev.exited_at).split(' ')[1]}`}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {isCurrent && session.inside ? (
                        <span className="text-xs font-semibold text-indigo-600">
                          {fmtElapsed(session.stage_entered_at)}
                        </span>
                      ) : ev ? (
                        <span className="text-xs font-medium text-gray-700">{fmtDuration(ev.duration_sec)}</span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

export default function History() {
  const [period, setPeriod]     = useState({ start: today(), end: today() })
  const [events, setEvents]     = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const prevStagesRef = useRef({})

  useEffect(() => {
    setLoading(true)
    function loadEvents() {
      return api.events(period.start, period.end).then(data => setEvents(data || []))
    }
    loadEvents().finally(() => setLoading(false))

    const interval = setInterval(loadEvents, EVENTS_POLL_MS)
    return () => clearInterval(interval)
  }, [period.start, period.end])

  useEffect(() => {
    function loadSessions() {
      api.activeSessions().then(data => {
        const list = data || []
        const prevStages = prevStagesRef.current
        const changed = list.some(s => {
          const prevStage = prevStages[s.prism_code]
          return prevStage && prevStage !== s.current_stage
        })
        if (changed) playAdvanceSound()
        prevStagesRef.current = Object.fromEntries(list.map(s => [s.prism_code, s.current_stage]))
        setSessions(list)
      })
    }
    loadSessions()
    const interval = setInterval(loadSessions, SESSION_POLL_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Histórico</h1>
          <p className="text-sm text-gray-500">Registro de todas as etapas por veículo</p>
        </div>
        <DateFilter value={period} onChange={setPeriod} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Sessões em Andamento</h2>
          {sessions.length > 0 && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
              {sessions.length} ao vivo
            </span>
          )}
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum veículo em andamento no momento.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sessions.map(s => (
              <ActiveSessionCard key={s.prism_code} session={s} onClick={() => setSelected(s.prism_code)} />
            ))}
          </div>
        )}
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
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  Nenhum evento registrado para o período selecionado
                </td>
              </tr>
            ) : (
              events.map((e, i) => {
                const isActive = sessions.some(s => s.prism_code === e.prism_code)
                return (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 ${isActive ? 'cursor-pointer' : ''}`}
                    onClick={() => isActive && setSelected(e.prism_code)}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{e.prism_code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[e.stage] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STAGE_LABELS[e.stage] ?? e.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {e.elevator_id ? `Elevador ${e.elevator_id}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmtTime(e.entered_at)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtTime(e.exited_at)}</td>
                    <td className={`px-4 py-3 font-medium ${e.duration_sec == null ? 'text-gray-400' : 'text-gray-900'}`}>
                      {fmtDuration(e.duration_sec)}
                      {e.duration_sec == null && (
                        <span className="ml-2 text-xs text-[#CC0000]">em andamento</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <SessionDetailModal prismCode={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
