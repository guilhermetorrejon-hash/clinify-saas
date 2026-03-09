'use client'

import { useEffect, useState } from 'react'
import { Users, CreditCard, FileText, Camera, DollarSign, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

interface Overview {
  totalUsers: number
  activeSubscriptions: number
  totalPosts: number
  totalPhotos: number
  estimatedMonthlyRevenue: number
  planDistribution: { planName: string; subscribers: number; monthlyRevenue: number }[]
  recentUsers: { id: string; name: string; email: string; createdAt: string }[]
}

interface UsageStats {
  thisMonth: {
    breakdown: { type: string; count: number; estimatedCost: number }[]
    totalCost: number
    period: string
  }
  allTime: {
    breakdown: { type: string; count: number; estimatedCost: number }[]
    totalCost: number
  }
}

const USAGE_LABELS: Record<string, string> = {
  POST: 'Posts',
  CAROUSEL: 'Carrosséis',
  PHOTO: 'Fotos Pro',
  THEME_SUGGESTION: 'Sugestões de tema',
  CAPTION_REWRITE: 'Reescritas de copy',
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/usage'),
    ]).then(([ovRes, usRes]) => {
      setOverview(ovRes.data)
      setUsage(usRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Carregando dados...</div>
      </div>
    )
  }

  if (!overview || !usage) return null

  const cards = [
    { label: 'Usuários', value: overview.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Assinaturas ativas', value: overview.activeSubscriptions, icon: CreditCard, color: 'bg-green-50 text-green-600' },
    { label: 'Posts criados', value: overview.totalPosts, icon: FileText, color: 'bg-purple-50 text-purple-600' },
    { label: 'Sessões de foto', value: overview.totalPhotos, icon: Camera, color: 'bg-amber-50 text-amber-600' },
    { label: 'Receita/mês (est.)', value: formatBRL(overview.estimatedMonthlyRevenue), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Custo IA/mês (est.)', value: formatBRL(usage.thisMonth.totalCost), icon: TrendingUp, color: 'bg-red-50 text-red-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Painel Administrativo</h1>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <span className="text-sm text-gray-500">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Distribuição por plano */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por plano</h2>
          {overview.planDistribution.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma assinatura ativa ainda.</p>
          ) : (
            <div className="space-y-3">
              {overview.planDistribution.map((plan) => (
                <div key={plan.planName} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{plan.planName}</p>
                    <p className="text-sm text-gray-500">{plan.subscribers} assinante{plan.subscribers !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatBRL(plan.monthlyRevenue)}/mês</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uso do mês (custo IA) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Custo IA estimado do mês</h2>
          <p className="text-xs text-gray-400 mb-4">{usage.thisMonth.period}</p>
          {usage.thisMonth.breakdown.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum uso registrado neste mês.</p>
          ) : (
            <div className="space-y-3">
              {usage.thisMonth.breakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{USAGE_LABELS[item.type] || item.type}</p>
                    <p className="text-sm text-gray-500">{item.count} operações</p>
                  </div>
                  <p className="font-semibold text-red-500">{formatBRL(item.estimatedCost)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <p className="font-semibold text-gray-900">Total do mês</p>
                <p className="font-bold text-red-600 text-lg">{formatBRL(usage.thisMonth.totalCost)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Últimos cadastros */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cadastros recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Nome</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="py-3 text-gray-500">{user.email}</td>
                    <td className="py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
