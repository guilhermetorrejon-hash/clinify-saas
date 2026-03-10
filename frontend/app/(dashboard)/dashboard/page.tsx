'use client'

import { useState, useEffect } from 'react'
import { Sparkles, PlusCircle, Camera, TrendingUp, Clock, ChevronRight, Zap, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import api from '@/lib/api'

const categories = [
  {
    id: 'EDUCATIVO',
    label: 'Educativo',
    emoji: '📚',
    description: 'Dicas, explicações e conteúdo informativo de saúde',
    color: 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300',
  },
  {
    id: 'INSTITUCIONAL',
    label: 'Institucional',
    emoji: '🏥',
    description: 'Apresente sua clínica, serviços e procedimentos',
    color: 'bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-300',
  },
  {
    id: 'MOTIVACIONAL',
    label: 'Motivacional',
    emoji: '⭐',
    description: 'Inspire e engaje seus seguidores com mensagens positivas',
    color: 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300',
  },
  {
    id: 'CRIATIVO_ANUNCIO',
    label: 'Anúncio',
    emoji: '📣',
    description: 'Criativos com CTA para impulsionar e vender serviços',
    color: 'bg-red-50 text-red-700 border-red-100 hover:border-red-300',
  },
]

const categoryLabels: Record<string, string> = {
  EDUCATIVO: 'Educativo',
  INSTITUCIONAL: 'Institucional',
  MOTIVACIONAL: 'Motivacional',
  CRIATIVO_ANUNCIO: 'Anúncio',
}

const formatLabels: Record<string, string> = {
  FEED: 'Feed 1:1',
  PORTRAIT: 'Retrato 4:5',
  STORIES: 'Stories',
  CARROSSEL: 'Carrossel',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
  GENERATING: { label: 'Gerando...', color: 'bg-blue-100 text-blue-700' },
  TEXTS_READY: { label: 'Revisar textos', color: 'bg-amber-100 text-amber-700' },
  FAILED: { label: 'Falhou', color: 'bg-red-100 text-red-700' },
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-500' },
}

interface PostVariation {
  imageUrl?: string
  isSelected: boolean
}

interface Post {
  id: string
  theme: string
  category: string
  format: string
  status: string
  createdAt: string
  variations: PostVariation[]
}

interface PhotoSession {
  generatedPhotoUrls: string[]
  status: string
}

interface UsageItem {
  used: number
  limit: number
}

interface UsageData {
  hasSubscription: boolean
  plan?: { name: string; slug: string }
  periodEnd?: string
  usage?: Record<string, UsageItem>
}

const usageLabels: Record<string, string> = {
  POST: 'Posts',
  CAROUSEL: 'Carrosseis',
  PHOTO: 'Fotos Pro',
  THEME_SUGGESTION: 'Sugestoes de tema',
  CAPTION_REWRITE: 'Reescritas de copy',
}

const usageIcons: Record<string, string> = {
  POST: '📝',
  CAROUSEL: '🎠',
  PHOTO: '📸',
  THEME_SUGGESTION: '💡',
  CAPTION_REWRITE: '✍️',
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [photoCount, setPhotoCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [usageData, setUsageData] = useState<UsageData | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [postsRes, photosRes, usageRes] = await Promise.all([
          api.get<Post[]>('/posts'),
          api.get<PhotoSession[]>('/photos'),
          api.get<UsageData>('/usage').catch(() => ({ data: null })),
        ])
        setPosts(postsRes.data)
        const total = photosRes.data
          .filter((s) => s.status === 'COMPLETED')
          .reduce((acc, s) => acc + s.generatedPhotoUrls.length, 0)
        setPhotoCount(total)
        if (usageRes.data) setUsageData(usageRes.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const completedPosts = posts.filter((p) => p.status === 'COMPLETED').length
  const recentPosts = posts.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá! O que vamos criar hoje?</h1>
          <p className="text-gray-500 mt-1">Seu conteúdo profissional está a 3 minutos de distância.</p>
        </div>
        <Link href="/posts/novo">
          <Button size="lg">
            <PlusCircle className="h-5 w-5" />
            Criar post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Posts criados</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? <span className="text-gray-200">—</span> : completedPosts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Fotos profissionais</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? <span className="text-gray-200">—</span> : photoCount}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Camera className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de posts</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? <span className="text-gray-200">—</span> : posts.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uso do plano */}
      {usageData?.hasSubscription && usageData.usage && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Plano {usageData.plan?.name || 'Ativo'}
                  </h2>
                  {usageData.periodEnd && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <CalendarDays className="h-3 w-3" />
                      Renova em {new Date(usageData.periodEnd).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <Link href="/" target="_blank">
                <Button variant="outline" size="sm">
                  <Zap className="h-3.5 w-3.5" />
                  Upgrade
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(usageData.usage)
                .filter(([, v]) => v.limit > 0)
                .map(([key, { used, limit }]) => {
                  const pct = Math.min(100, Math.round((used / limit) * 100))
                  const isNearLimit = pct >= 80
                  const isAtLimit = used >= limit
                  return (
                    <div key={key} className="p-3 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 flex items-center gap-1.5">
                          <span>{usageIcons[key] || '📊'}</span>
                          {usageLabels[key] || key}
                        </span>
                        <span className={`text-sm font-semibold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
                          {used}/{limit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-violet-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick create */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Criar por categoria</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/posts/novo?category=${cat.id}`}>
              <div className={`${cat.color} rounded-2xl p-5 border hover:scale-[1.02] transition-all duration-150 cursor-pointer h-full`}>
                <span className="text-3xl">{cat.emoji}</span>
                <p className="font-semibold mt-2 text-sm">{cat.label}</p>
                <p className="text-xs mt-1 opacity-70 leading-snug">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Posts recentes</h2>
          {posts.length > 5 && (
            <Link href="/posts" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentPosts.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-6">Você ainda não criou nenhum post.</p>
              <Link href="/posts/novo">
                <Button>
                  <PlusCircle className="h-4 w-4" />
                  Criar primeiro post
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => {
              const selected = post.variations.find((v) => v.isSelected) ?? post.variations[0]
              const thumbnail = selected?.imageUrl
              const status = statusConfig[post.status] ?? { label: post.status, color: 'bg-gray-100 text-gray-500' }
              return (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{post.theme}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{categoryLabels[post.category] ?? post.category}</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">{formatLabels[post.format] ?? post.format}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
