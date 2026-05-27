import { useState, useEffect } from 'react'
import { api } from '../api'

const STAGES = [
  { key: 'waiting',   label: 'Espera',        emoji: '🅿️',  elevador: false },
  { key: 'transit',   label: 'Deslocamento',  emoji: '🚗',  elevador: true  },
  { key: 'lift_up',   label: 'Subida + Inspeção', emoji: '⬆️', elevador: true },
  { key: 'service',   label: 'Serviço',       emoji: '🔧',  elevador: true  },
  { key: 'lift_down', label: 'Descida',       emoji: '⬇️',  elevador: true  },
  { key: 'outflow',   label: 'Entrega',       emoji: '✅',  elevador: false },
]

const PRISMS   = Array.from({ length: 10 }, (_, i) => `PRISMA_${String(i + 1).padStart(2, '0')}`)
const ELEVATORS = [1, 2]

function StatusBadge({ text, color }) {
  const colors = {
    green:  'bg-green-100 text-green-800 border-green-300',
    amber:  'bg-amber-100 text-amber-800 border-amber-300',
    red:    'bg-red-100   text-red-800   border-red-300',
    gray:   'bg-gray-100  text-gray-600  border-gray-300',
  }
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${colors[color] ?? colors.gray}`}>
      {text}
    </span>
  )
}

export default function Simular() {
  const [prism,         setPrism]         = useState('PRISMA_01')
  const [elevator,      setElevator]      = useState(1)
  const [stageIdx,      setStageIdx]      = useState(0)
  const [inside,        setInside]        = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [log,           setLog]           = useState([])
  const [done,          setDone]          = useState(false)
  const [reloadKey,     setReloadKey]     = useState(0)

  // Ao trocar o prisma (ou forçar reload), buscar em qual etapa ele está
  useEffect(() => {
    setStatusLoading(true)
    api.prismStatus(prism).then(status => {
      const idx = STAGES.findIndex(s => s.key === status.current_stage)
      const resolvedIdx = idx >= 0 ? idx : 0
      setStageIdx(resolvedIdx)
      setInside(status.inside ?? false)
      setDone(false)
    }).catch(() => {
      setStageIdx(0)
      setInside(false)
    }).finally(() => setStatusLoading(false))
  }, [prism, reloadKey])

  const stage = STAGES[stageIdx]

  function addLog(msg, ok = true) {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLog(prev => [{ time, msg, ok }, ...prev].slice(0, 20))
  }

  async function sendEvent(eventType) {
    setLoading(true)
    try {
      const payload = {
        prism_code:  prism,
        stage:       stage.key,
        event_type:  eventType,
        timestamp:   new Date().toISOString(),
        elevator_id: stage.elevador ? elevator : null,
      }
      await api.registerEvent(payload)

      const label = eventType === 'enter' ? `▶ ENTROU em ${stage.label}` : `■ SAIU de ${stage.label}`
      addLog(label, true)

      if (eventType === 'enter') {
        setInside(true)
      } else {
        // Saiu — avançar para próxima etapa ou encerrar
        if (stageIdx < STAGES.length - 1) {
          setStageIdx(idx => idx + 1)
          setInside(false)
        } else {
          setDone(true)
        }
      }
    } catch (err) {
      addLog(`Erro: ${err.message}`, false)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setLog([])
    setReloadKey(k => k + 1)  // força re-fetch do status do prisma
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div>
          <h1 className="text-lg font-bold">AutoStep</h1>
          <p className="text-xs text-white/50">Simulador de Veículo</p>
        </div>
        {done && (
          <button onClick={reset} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold">
            Novo ciclo
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-sm mx-auto w-full">

        {/* Seleção de prisma e elevador */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/50">
              Prisma (carro)
            </label>
            <select
              value={prism}
              onChange={e => { setLog([]); setPrism(e.target.value) }}
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRISMS.map(p => <option key={p} value={p} className="text-black">{p}</option>)}
            </select>
            {statusLoading && (
              <p className="text-xs text-white/40">Verificando etapa atual…</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/50">
              Elevador destino
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ELEVATORS.map(e => (
                <button
                  key={e}
                  onClick={() => setElevator(e)}
                  className={`rounded-xl py-3 text-base font-bold border transition-colors ${
                    elevator === e
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/10 border-white/20 text-white/70'
                  }`}
                >
                  Elevador {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress das etapas */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Progresso</p>
          <div className="flex gap-1">
            {STAGES.map((s, i) => (
              <div
                key={s.key}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i < stageIdx            ? 'bg-green-500'
                  : i === stageIdx        ? (inside ? 'bg-indigo-500' : 'bg-indigo-400')
                  : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-white/30">
            {STAGES.map(s => <span key={s.key}>{s.emoji}</span>)}
          </div>
        </div>

        {done ? (
          /* Ciclo completo */
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="text-6xl">🏁</span>
            <p className="text-xl font-bold text-green-400">Ciclo completo!</p>
            <p className="text-sm text-white/50">{prism} finalizou todas as etapas</p>
            <button
              onClick={reset}
              className="mt-4 w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Iniciar novo ciclo
            </button>
          </div>
        ) : (
          /* Controle da etapa atual */
          <div className="space-y-5">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Etapa {stageIdx + 1} de {STAGES.length}
                </p>
                <StatusBadge
                  text={inside ? 'Em andamento' : 'Aguardando entrada'}
                  color={inside ? 'amber' : 'gray'}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-4xl">{stage.emoji}</span>
                <div>
                  <p className="text-xl font-bold">{stage.label}</p>
                  <p className="text-sm text-white/40">{prism}</p>
                  {stage.elevador && (
                    <p className="text-xs text-indigo-300">Elevador {elevator}</p>
                  )}
                </div>
              </div>
            </div>

            {!inside ? (
              <button
                onClick={() => sendEvent('enter')}
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 py-5 text-xl font-bold disabled:opacity-50 active:scale-95 transition-all hover:bg-indigo-700"
              >
                {loading ? '…' : `▶  ENTRAR`}
              </button>
            ) : (
              <button
                onClick={() => sendEvent('exit')}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 py-5 text-xl font-bold disabled:opacity-50 active:scale-95 transition-all hover:bg-emerald-700"
              >
                {loading ? '…' : `■  SAIR`}
              </button>
            )}
          </div>
        )}

        {/* Log de eventos */}
        {log.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Eventos enviados</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={`flex gap-2 text-xs rounded-lg px-3 py-2 ${entry.ok ? 'bg-white/5' : 'bg-red-900/40'}`}>
                  <span className="text-white/30 shrink-0">{entry.time}</span>
                  <span className={entry.ok ? 'text-white/80' : 'text-red-300'}>{entry.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
