'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Loader2, AlertCircle, Eye, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

type PostStatus = 'DRAFT' | 'TEXTS_READY' | 'GENERATING' | 'COMPLETED' | 'FAILED'
type PostFormat = 'FEED' | 'PORTRAIT' | 'STORIES' | 'CARROSSEL'

interface Post {
  id: string
  theme: string
  category: string
  format: PostFormat
  headline?: string
  subtitle?: string
  caption?: string
  status: PostStatus
  createdAt: string
}

const statusConfig: Record<PostStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', bgColor: 'bg-gray-50' },
  TEXTS_READY: { label: 'Textos prontos', color: 'bg-blue-100 text-blue-700', bgColor: 'bg-blue-50' },
  GENERATING: { label: 'Gerando...', color: 'bg-amber-100 text-amber-700', bgColor: 'bg-amber-50' },
  COMPLETED: { label: 'Completo', color: 'bg-green-100 text-green-700', bgColor: 'bg-green-50' },
  FAILED: { label: 'Erro', color: 'bg-red-100 text-red-700', bgColor: 'bg-red-50' },
}

const categoryLabels: Record<string, string> = {
  EDUCATIVO: '📚 Educativo',
  INSTITUCIONAL: '🏥 Institucional',
  MOTIVACIONAL: '⭐ Motivacional',
  CRIATIVO_ANUNCIO: '📣 Anúncio',
}

const formatLabels: Record<PostFormat, string> = {
  FEED: 'Feed',
  PORTRAIT: 'Retrato',
  STORIES: 'Stories',
  CARROSSEL: 'Carrossel',
}

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        const { data } = await api.get<Post[]>('/posts')
        setPosts(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar posts')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus posts</h1>
          <p className="text-gray-500 mt-2">
            {posts.length === 0
              ? 'Nenhum post criado ainda'
              : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'} criado${posts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/posts/recriar">
            <Button size="lg" variant="outline">
              <RefreshCw className="h-5 w-5" />
              Recriar post
            </Button>
          </Link>
          <Link href="/posts/novo">
            <Button size="lg">
              <Plus className="h-5 w-5" />
              Novo post
            </Button>
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erro ao carregar posts</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && !error && (
        <Card>
          <CardContent className="p-16 flex flex-col items-center text-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Nenhum post criado ainda
              </h2>
              <p className="text-gray-500 text-sm max-w-sm">
                Comece criando seu primeiro post. A IA vai gerar textos e artes personalizadas para sua marca.
              </p>
            </div>
            <Link href="/posts/novo">
              <Button size="lg">
                <Sparkles className="h-4 w-4" />
                Criar primeiro post
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Posts grid */}
      {posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => {
            const statusInfo = statusConfig[post.status]
            return (
              <Card
                key={post.id}
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                <CardContent className="p-0">
                  {/* Preview area */}
                  <div className={`h-32 flex items-center justify-center text-center px-6 ${statusInfo.bgColor}`}>
                    <div className="space-y-2">
                      {post.status === 'GENERATING' && (
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                        </div>
                      )}
                      {post.status === 'COMPLETED' && (
                        <div className="flex justify-center">
                          <Eye className="h-6 w-6 text-green-500" />
                        </div>
                      )}
                      {post.status === 'FAILED' && (
                        <div className="flex justify-center">
                          <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                      )}
                      {['DRAFT', 'TEXTS_READY'].includes(post.status) && (
                        <div className="flex justify-center">
                          <Sparkles className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-700 line-clamp-2">{post.theme}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Headlines (truncated) */}
                    {post.headline && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Título</p>
                        <p className="text-sm text-gray-700 line-clamp-1">{post.headline}</p>
                      </div>
                    )}

                    {/* Category and Format */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {formatLabels[post.format]}
                      </Badge>
                    </div>

                    {/* Status and date */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <Badge className={`text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                      <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                    </div>

                    {/* View button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/posts/${post.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
