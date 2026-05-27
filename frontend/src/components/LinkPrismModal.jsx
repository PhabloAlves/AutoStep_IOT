import { useState, useEffect } from 'react'
import { X, Link2, Clock, CheckCircle2 } from 'lucide-react'
import { api } from '../api'

export default function LinkPrismModal({ os, onClose, onConfirm }) {
  const [prisms, setPrisms]   = useState([])
  const [selected, setSelected] = useState(null)
  const [done, setDone]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.availablePrisms().then(data => setPrisms(data || []))
  }, [])

  async function handleConfirm() {
    if (!selected) return
    setError('')
    setLoading(true)
    try {
      await api.linkPrism(os.id, selected)
      setDone(true)
      onConfirm?.(os.id, selected)
    } catch (err) {
      setError(err.message || 'Erro ao vincular prisma')
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
            <Link2 size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Vincular Prisma</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {done ? (
          /* Success state */
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="font-semibold text-gray-900">
              {selected} vinculado à {os.os_number}
            </p>
            <p className="text-sm text-gray-500">{os.plate} · {os.service_type}</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* OS summary */}
            <div className="mx-6 mt-5 rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-indigo-600">{os.os_number}</span>
                <span className="font-mono text-sm text-gray-700">{os.plate}</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{os.service_type} · {os.mechanic}</p>
            </div>

            {/* Prism list */}
            <div className="px-6 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Prismas disponíveis
              </p>

              {prisms.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  Nenhum prisma disponível no momento
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {prisms.map(p => (
                    <button
                      key={p.prism_code}
                      onClick={() => setSelected(p.prism_code)}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                        selected === p.prism_code
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${selected === p.prism_code ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {p.prism_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        disponível
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selected || loading}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Link2 size={14} />
                {loading ? 'Vinculando…' : 'Confirmar Vínculo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
