import { useState } from 'react'
import { X, FilePlus, CheckCircle2 } from 'lucide-react'
import { api } from '../api'

const SERVICE_TYPES = [
  'Revisão Completa',
  'Troca de Freios',
  'Suspensão',
  'Alinhamento/Balanceamento',
  'Troca de Pneus',
  'Troca de Óleo',
  'Sistema Elétrico',
  'Outro',
]

export default function CreateOSModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    os_number:    '',
    plate:        '',
    service_type: '',
    mechanic:     '',
    opened_at:    new Date().toISOString().slice(0, 16), // datetime-local format
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.createOrder({
        ...form,
        opened_at: form.opened_at ? new Date(form.opened_at).toISOString() : null,
      })
      setDone(true)
      onCreated?.()
    } catch (err) {
      setError(err.message || 'Erro ao criar OS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <FilePlus size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Nova Ordem de Serviço</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="font-semibold text-gray-900">OS {form.os_number} criada com sucesso!</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Nº OS *
                </label>
                <input
                  name="os_number"
                  required
                  value={form.os_number}
                  onChange={handleChange}
                  placeholder="OS-001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Placa *
                </label>
                <input
                  name="plate"
                  required
                  value={form.plate}
                  onChange={handleChange}
                  placeholder="ABC-1234"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Tipo de Serviço
              </label>
              <select
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione…</option>
                {SERVICE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Mecânico
              </label>
              <input
                name="mechanic"
                value={form.mechanic}
                onChange={handleChange}
                placeholder="Nome do mecânico"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Data/Hora de Abertura
              </label>
              <input
                name="opened_at"
                type="datetime-local"
                value={form.opened_at}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <FilePlus size={14} />
                {loading ? 'Criando…' : 'Criar OS'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
