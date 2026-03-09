'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'

interface WebhookEvent {
  id: string
  eventType: string
  payload: any
  processedAt: string | null
  createdAt: string
}

const EVENT_BADGE: Record<string, string> = {
  'order.approved': 'bg-green-100 text-green-700',
  'subscription.active': 'bg-green-100 text-green-700',
  'subscription.renewed': 'bg-blue-100 text-blue-700',
  'subscription.cancelled': 'bg-red-100 text-red-700',
  'subscription.overdue': 'bg-amber-100 text-amber-700',
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date))
}

export default function AdminWebhooksPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/webhooks', { params: { page, limit: 30 } })
      .then(({ data }) => {
        setEvents(data.events)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webhooks Kiwify</h1>
        <p className="text-sm text-gray-500">{total} eventos recebidos</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-gray-500 font-medium w-8"></th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Evento</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Produto</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    Nenhum webhook recebido ainda.
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const isExpanded = expandedId === event.id
                  const email = event.payload?.Customer?.email || '—'
                  const product = event.payload?.Product?.name || event.payload?.Product?.slug || '—'

                  return (
                    <tr key={event.id} className="border-b border-gray-50">
                      <td className="px-5 py-3.5" colSpan={5}>
                        <div
                          className="flex items-center cursor-pointer hover:bg-gray-50/50 -mx-5 -my-3.5 px-5 py-3.5"
                          onClick={() => setExpandedId(isExpanded ? null : event.id)}
                        >
                          <div className="w-8 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-4 gap-4">
                            <span
                              className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-medium ${
                                EVENT_BADGE[event.eventType] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {event.eventType}
                            </span>
                            <span className="text-gray-600">{email}</span>
                            <span className="text-gray-600">{product}</span>
                            <span className="text-gray-500">{formatDateTime(event.createdAt)}</span>
                          </div>
                        </div>

                        {/* Payload expandido */}
                        {isExpanded && (
                          <div className="mt-3 ml-8">
                            <pre className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 overflow-x-auto max-h-64">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
