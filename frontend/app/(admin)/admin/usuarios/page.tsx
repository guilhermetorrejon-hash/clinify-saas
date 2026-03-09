'use client'

import { useEffect, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  subscription: {
    status: string
    currentPeriodEnd: string | null
    plan: { name: string; slug: string }
  } | null
  _count: { posts: number; photos: number; usageRecords: number }
}

interface PlanOption {
  id: string
  name: string
  slug: string
  priceInCents: number
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PAST_DUE: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativa',
  CANCELLED: 'Cancelada',
  PAST_DUE: 'Inadimplente',
  INACTIVE: 'Inativa',
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [changingPlan, setChangingPlan] = useState<string | null>(null)

  function loadUsers() {
    setLoading(true)
    api.get('/admin/users', { params: { page, limit: 30 } })
      .then(({ data }) => {
        setUsers(data.users)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [page])

  useEffect(() => {
    api.get('/admin/plans').then(({ data }) => setPlans(data))
  }, [])

  async function handleChangePlan(userId: string, planId: string) {
    setChangingPlan(userId)
    try {
      await api.patch(`/admin/users/${userId}/plan`, { planId })
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao trocar plano')
    } finally {
      setChangingPlan(null)
    }
  }

  const filtered = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">{total} usuários cadastrados</p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-300 w-72"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Nome</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Plano</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-center px-5 py-3 text-gray-500 font-medium">Posts</th>
                <th className="text-center px-5 py-3 text-gray-500 font-medium">Fotos</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{user.name}</span>
                        {user.role === 'ADMIN' && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {changingPlan === user.id ? (
                          <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                        ) : (
                          <select
                            value={plans.find(p => p.name === user.subscription?.plan.name)?.id || ''}
                            onChange={(e) => {
                              if (e.target.value) handleChangePlan(user.id, e.target.value)
                            }}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-300 cursor-pointer"
                          >
                            {!user.subscription && <option value="">Sem plano</option>}
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} {plan.priceInCents > 0 ? `(R$${plan.priceInCents / 100})` : '(grátis)'}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.subscription ? (
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGE[user.subscription.status] || STATUS_BADGE.INACTIVE
                          }`}
                        >
                          {STATUS_LABEL[user.subscription.status] || user.subscription.status}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-700">{user._count.posts}</td>
                    <td className="px-5 py-3.5 text-center text-gray-700">{user._count.photos}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))
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
