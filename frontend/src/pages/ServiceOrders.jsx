import { useState, useEffect, useCallback } from 'react'
import { Upload, FileText, Link2 } from 'lucide-react'
import { api } from '../api'
import LinkPrismModal from '../components/LinkPrismModal'
import CreateOSModal from '../components/CreateOSModal'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ServiceOrders() {
  const [orders, setOrders]         = useState([])
  const [linking, setLinking]       = useState(null)
  const [creating, setCreating]     = useState(false)
  const [loading, setLoading]       = useState(true)

  const fetchOrders = useCallback(() => {
    setLoading(true)
    api.listOrders()
      .then(data => setOrders(data || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  function handleLinked() {
    fetchOrders()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-sm text-gray-500">OS cadastradas no sistema</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Upload size={16} />
          Nova OS
        </button>
      </div>

      <div
        onClick={() => setCreating(true)}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white py-10 text-center hover:border-indigo-400 transition-colors cursor-pointer"
      >
        <FileText size={36} className="text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-500">
          Clique em{' '}
          <span className="text-indigo-600 font-semibold">Nova OS</span>
          {' '}para cadastrar uma ordem de serviço
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Importação de PDF disponível em breve
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {['Nº OS', 'Placa', 'Veículo', 'Serviço', 'Mecânico', 'Abertura', 'Prisma', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  Nenhuma OS cadastrada. Clique em "Nova OS" para começar.
                </td>
              </tr>
            ) : (
              orders.map(os => (
                <tr key={os.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-indigo-600">{os.os_number}</td>
                  <td className="px-4 py-3 font-mono text-gray-900">{os.plate}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {(os.marca || os.modelo)
                      ? <span>{[os.marca, os.modelo].filter(Boolean).join(' ')}</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-700">{os.service_type ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{os.mechanic ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(os.opened_at)}</td>
                  <td className="px-4 py-3">
                    {os.prism_code ? (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-green-700">
                        {os.prism_code}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400">
                        Sem prisma
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!os.prism_code && (
                      <button
                        onClick={() => setLinking(os)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <Link2 size={12} />
                        Vincular
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <CreateOSModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            fetchOrders()
          }}
        />
      )}

      {linking && (
        <LinkPrismModal
          os={linking}
          onClose={() => setLinking(null)}
          onConfirm={() => {
            setLinking(null)
            handleLinked()
          }}
        />
      )}
    </div>
  )
}
