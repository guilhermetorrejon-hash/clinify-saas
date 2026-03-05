'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Copy, Download, RefreshCw, AlertCircle, Pencil, X, Sparkles, Type } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

type PostStatus = 'DRAFT' | 'TEXTS_READY' | 'GENERATING' | 'COMPLETED' | 'FAILED'
type PostFormat = 'FEED' | 'PORTRAIT' | 'STORIES' | 'CARROSSEL'

interface PostVariation {
  id: string
  imageUrl?: string
  designStyle?: string
  isSelected: boolean
}

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
  variations: PostVariation[]
}

const POLLING_INTERVAL = 5000
const MAX_POLLS = 300 // 300 × 5s = 25 min

const styleLabels: Record<string, string> = {
  fotografico: 'Fotográfico',
  tipografico: 'Tipográfico',
  grafico: 'Gráfico',
  // legado
  moderno: 'Moderno',
  minimalista: 'Minimalista',
  elegante: 'Elegante',
}

const slideLabels: Record<number, string> = {
  1: 'Capa',
  2: 'Conteúdo 1',
  3: 'Conteúdo 2',
  4: 'Conteúdo 3',
  5: 'CTA',
}

function getCarrosselSlideNum(designStyle: string): number | null {
  const n = designStyle.match(/^carrossel_(?:foto|tipo|graf)_(\d+)$/)?.[1]
  return n ? parseInt(n) : null
}

const formatAspect: Record<PostFormat, string> = {
  FEED: 'aspect-square',
  PORTRAIT: 'aspect-[4/5]',
  CARROSSEL: 'aspect-square',
  STORIES: 'aspect-[9/16]',
}

export default function PostResultPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null)
  const [captionCopied, setCaptionCopied] = useState(false)
  const [selectingVariation, setSelectingVariation] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // Edição de textos
  const [editingField, setEditingField] = useState<'headline' | 'subtitle' | 'caption' | null>(null)
  const [headlineDraft, setHeadlineDraft] = useState('')
  const [subtitleDraft, setSubtitleDraft] = useState('')
  const [captionDraft, setCaptionDraft] = useState('')
  const [savingTexts, setSavingTexts] = useState(false)

  const fetchPost = useCallback(async (): Promise<PostStatus | null> => {
    try {
      const { data } = await api.get<Post>(`/posts/${id}`, {
        params: { _t: Date.now() }, // cache busting
      })
      setPost(data)
      const selected = data.variations.find((v) => v.isSelected)
      if (selected) setSelectedVariation(selected.id)
      return data.status
    } catch {
      return null // null = erro de rede, continuar polling
    }
  }, [id])

  // Fetch inicial + detectar se já está gerando (ex: reload da página)
  useEffect(() => {
    if (!id) return
    fetchPost().then((status) => {
      if (status === 'DRAFT' || status === 'GENERATING') {
        setGeneratingImages(true)
      }
    })
  }, [id, fetchPost])

  // Polling ativo apenas durante geração (DRAFT→TEXTS_READY ou GENERATING→COMPLETED)
  useEffect(() => {
    if (!generatingImages) return
    let polls = 0
    const interval = setInterval(async () => {
      polls++
      if (polls >= MAX_POLLS) { clearInterval(interval); return }
      const status = await fetchPost()
      // Parar polling apenas em status definitivos
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'TEXTS_READY') {
        clearInterval(interval)
        setGeneratingImages(false)
      }
      // null = erro de rede → continuar polling (não parar!)
    }, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [generatingImages, fetchPost])

  async function handleSelectVariation(variationId: string) {
    if (!post || selectingVariation) return
    setSelectingVariation(true)
    try {
      await api.patch(`/posts/${post.id}/variations/${variationId}/select`)
      setSelectedVariation(variationId)
      setPost((prev) =>
        prev ? { ...prev, variations: prev.variations.map((v) => ({ ...v, isSelected: v.id === variationId })) } : null
      )
    } finally {
      setSelectingVariation(false)
    }
  }

  function handleCopyCaption() {
    const text = editingField === 'caption' ? captionDraft : post?.caption
    if (!text) return
    navigator.clipboard.writeText(text)
    setCaptionCopied(true)
    setTimeout(() => setCaptionCopied(false), 2000)
  }

  function startEdit(field: 'headline' | 'subtitle' | 'caption') {
    if (field === 'headline') setHeadlineDraft(post?.headline || '')
    if (field === 'subtitle') setSubtitleDraft(post?.subtitle || '')
    if (field === 'caption') setCaptionDraft(post?.caption || '')
    setEditingField(field)
  }

  function cancelEdit() {
    setEditingField(null)
  }

  async function saveEdit(field: 'headline' | 'subtitle' | 'caption') {
    if (!post) return
    setSavingTexts(true)
    const value = field === 'headline' ? headlineDraft : field === 'subtitle' ? subtitleDraft : captionDraft
    try {
      await api.patch(`/posts/${post.id}`, { [field]: value })
      setPost((prev) => prev ? { ...prev, [field]: value } : null)
      setEditingField(null)
    } catch {
      setPost((prev) => prev ? { ...prev, [field]: value } : null)
      setEditingField(null)
    } finally {
      setSavingTexts(false)
    }
  }

  async function handleGenerateImages() {
    if (!post || generatingImages) return
    setGeneratingImages(true)

    // Salvar qualquer edição pendente antes de gerar
    if (editingField) {
      await saveEdit(editingField)
    }

    try {
      await api.post(`/posts/${post.id}/generate-images`)
      setPost((prev) => prev ? { ...prev, status: 'GENERATING' } : null)
      // generatingImages já é true → useEffect de polling já está rodando
    } catch {
      setGeneratingImages(false)
    }
  }

  async function downloadImage(url: string, filename: string) {
    try {
      const response = await api.get('/posts/download-proxy', {
        params: { url, filename },
        responseType: 'blob',
      })
      const blobUrl = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Erro ao baixar imagem:', err)
    }
  }

  async function handleRegenerateTexts() {
    if (!post || regenerating) return
    setRegenerating(true)
    setEditingField(null)
    try {
      const { data } = await api.post<Post>(`/posts/${post.id}/regenerate-texts`)
      setPost(data)
    } catch {
      // silently fail
    } finally {
      setRegenerating(false)
    }
  }

  const isLoading = !post || post.status === 'DRAFT'
  const isTextsReady = post?.status === 'TEXTS_READY'
  const isGenerating = post?.status === 'GENERATING'
  const isFailed = post?.status === 'FAILED'
  const isCompleted = post?.status === 'COMPLETED'
  const aspectClass = post ? (formatAspect[post.format] || 'aspect-square') : 'aspect-square'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Seu post</h1>
          {post && <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{post.theme}</p>}
        </div>
        {post && (
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {{ FEED: 'Feed 1:1', PORTRAIT: 'Retrato 4:5', STORIES: 'Stories 9:16', CARROSSEL: 'Carrossel' }[post.format] ?? post.format}
          </span>
        )}
        {isCompleted && <Badge variant="success">Gerado com sucesso</Badge>}
        {isFailed && <Badge variant="destructive">Falha na geração</Badge>}
        {isTextsReady && <Badge variant="secondary">Textos prontos</Badge>}
        {(isLoading || isGenerating) && <Badge variant="secondary">Gerando...</Badge>}
      </div>

      {/* Loading inicial */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center gap-6">
            <div className="h-20 w-20 rounded-full border-4 border-blue-100 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Gerando textos do post...</p>
              <p className="text-gray-500 text-sm mt-1">A IA está criando o headline, subtítulo e legenda.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gerando imagens */}
      {isGenerating && (() => {
        const isCarrossel = post?.format === 'CARROSSEL'
        const totalImages = isCarrossel ? 5 : 3
        const timeLabel = isCarrossel ? '3-5 minutos' : '2-3 minutos'
        const completedImages = post?.variations.filter((v) => v.imageUrl).length || 0
        const progressPct = Math.min(Math.round((completedImages / totalImages) * 95), 95) || 5
        return (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center gap-6">
              <div className="h-20 w-20 rounded-full border-4 border-blue-100 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">Gerando as artes</p>
                <p className="text-gray-500 text-sm mt-1">
                  {isCarrossel
                    ? `Criando 5 slides do carrossel com IA. Isso leva cerca de ${timeLabel}.`
                    : `Criando 3 variações de imagem com os textos aprovados. Isso leva cerca de ${timeLabel}.`}
                </p>
                <p className="text-blue-600 text-xs mt-2 font-medium">
                  {completedImages > 0
                    ? `${completedImages} de ${totalImages} imagens prontas · não feche esta página`
                    : `Preparando imagem 1 de ${totalImages} · não feche esta página`}
                </p>
              </div>
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Progresso</span>
                  <span>{completedImages}/{totalImages}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Failed state */}
      {isFailed && (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Falha na geração</p>
              <p className="text-gray-500 text-sm mt-1">Não foi possível gerar o post. Tente criar um novo.</p>
            </div>
            <Button onClick={() => router.push('/posts/novo')}>Criar novo post</Button>
          </CardContent>
        </Card>
      )}

      {/* Estado TEXTS_READY — revisar e editar textos antes de gerar artes */}
      {isTextsReady && post && (() => {
        const hasTexts = !!(post.headline || post.subtitle || post.caption)
        return (
        <div className="space-y-6">
          {hasTexts ? (
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Type className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Textos gerados — revise antes de gerar as artes</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  A IA criou o headline, subtítulo e legenda com base no seu perfil. Edite o que quiser e depois clique em "Gerar artes".
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Não foi possível gerar os textos</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Clique em "Outra abordagem" para tentar novamente, ou preencha os campos manualmente abaixo.
                </p>
              </div>
            </div>
          )}

          {/* Headline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Headline da arte</h2>
              {editingField !== 'headline' && (
                <Button variant="ghost" size="sm" onClick={() => startEdit('headline')}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
            </div>
            <Card>
              <CardContent className="p-4">
                {editingField === 'headline' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={headlineDraft}
                      onChange={(e) => setHeadlineDraft(e.target.value)}
                      maxLength={200}
                      className="w-full text-gray-900 text-xl font-bold focus:outline-none bg-transparent border-b border-blue-300 pb-1"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="h-3.5 w-3.5" />Cancelar</Button>
                      <Button size="sm" loading={savingTexts} onClick={() => saveEdit('headline')}><Check className="h-3.5 w-3.5" />Salvar</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-gray-900">{post.headline || '—'}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subtítulo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Subtítulo</h2>
              {editingField !== 'subtitle' && (
                <Button variant="ghost" size="sm" onClick={() => startEdit('subtitle')}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
            </div>
            <Card>
              <CardContent className="p-4">
                {editingField === 'subtitle' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={subtitleDraft}
                      onChange={(e) => setSubtitleDraft(e.target.value)}
                      maxLength={300}
                      className="w-full text-gray-700 text-base focus:outline-none bg-transparent border-b border-blue-300 pb-1"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="h-3.5 w-3.5" />Cancelar</Button>
                      <Button size="sm" loading={savingTexts} onClick={() => saveEdit('subtitle')}><Check className="h-3.5 w-3.5" />Salvar</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base text-gray-700">{post.subtitle || <span className="text-gray-400 italic">Nenhum subtítulo</span>}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Legenda */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Legenda do Instagram</h2>
              <div className="flex gap-1">
                {editingField !== 'caption' && (
                  <Button variant="ghost" size="sm" onClick={() => startEdit('caption')}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleCopyCaption}>
                  {captionCopied ? <><Check className="h-3.5 w-3.5" />Copiado!</> : <><Copy className="h-3.5 w-3.5" />Copiar</>}
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-4">
                {editingField === 'caption' ? (
                  <div className="space-y-3">
                    <textarea
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      rows={10}
                      className="w-full resize-none text-gray-700 text-sm leading-relaxed focus:outline-none bg-transparent border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">{captionDraft.length} caracteres</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="h-3.5 w-3.5" />Cancelar</Button>
                        <Button size="sm" loading={savingTexts} onClick={() => saveEdit('caption')}><Check className="h-3.5 w-3.5" />Salvar</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              loading={regenerating}
              onClick={handleRegenerateTexts}
            >
              <RefreshCw className="h-4 w-4" />
              {regenerating ? 'Gerando...' : 'Outra abordagem'}
            </Button>
            <Button
              className="flex-1"
              size="lg"
              loading={generatingImages}
              disabled={!hasTexts}
              onClick={handleGenerateImages}
            >
              <Sparkles className="h-4 w-4" />
              {generatingImages ? 'Iniciando...' : 'Gerar artes com IA'}
            </Button>
          </div>
        </div>
        )
      })()}

      {/* Completed state */}
      {isCompleted && post && (
        <div className="space-y-8">
          {/* Variações / Slides */}
          {post.format === 'CARROSSEL' ? (() => {
            const slides = [...post.variations].sort((a, b) =>
              (getCarrosselSlideNum(a.designStyle ?? '') ?? 0) - (getCarrosselSlideNum(b.designStyle ?? '') ?? 0)
            )

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Slides do carrossel</h2>
                  <span className="text-xs text-gray-400">{slides.length} slides</span>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {slides.map((slide) => {
                    const slideNum = getCarrosselSlideNum(slide.designStyle ?? '') ?? 0
                    const label = slideLabels[slideNum] || `Slide ${slideNum}`
                    return (
                      <div key={slide.id} className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden border border-gray-200">
                          {slide.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={slide.imageUrl}
                              alt={label}
                              className={`w-full ${aspectClass} object-cover`}
                            />
                          ) : (
                            <div className={`w-full ${aspectClass} bg-gray-100 flex items-center justify-center`}>
                              <p className="text-gray-400 text-xs">...</p>
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">{slideNum}</span>
                          </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 font-medium">{label}</p>
                        {slide.imageUrl && (
                          <button
                            className="flex items-center justify-center gap-0.5 text-[10px] text-blue-500 hover:underline w-full"
                            onClick={() => downloadImage(slide.imageUrl!, `carrossel-slide-${slideNum}.jpg`)}
                          >
                            <Download className="h-2.5 w-2.5" />
                            Baixar
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })() : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Escolha sua variação favorita</h2>
                {post.format === 'STORIES' && (
                  <span className="text-xs text-gray-400">Proporção 9:16 (Stories)</span>
                )}
                {post.format === 'PORTRAIT' && (
                  <span className="text-xs text-gray-400">Proporção 4:5 (1080×1350)</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {post.variations.map((variation) => {
                  const isSelected = variation.id === selectedVariation
                  return (
                    <button
                      key={variation.id}
                      onClick={() => handleSelectVariation(variation.id)}
                      disabled={selectingVariation}
                      className={`relative rounded-2xl overflow-hidden border-4 transition-all duration-150 ${
                        isSelected ? 'border-blue-600 shadow-lg shadow-blue-100' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      {variation.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={variation.imageUrl}
                          alt={`Variação ${variation.designStyle}`}
                          className={`w-full ${aspectClass} object-cover`}
                        />
                      ) : (
                        <div className={`w-full ${aspectClass} bg-gray-100 flex items-center justify-center`}>
                          <p className="text-gray-400 text-sm">Sem imagem</p>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-white text-sm font-medium">
                          {styleLabels[variation.designStyle || ''] || variation.designStyle}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Textos do post */}
          {(post.headline || post.subtitle) && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Textos da arte</h2>
              <Card>
                <CardContent className="p-5 space-y-2">
                  {post.headline && <p className="text-xl font-bold text-gray-900">{post.headline}</p>}
                  {post.subtitle && <p className="text-sm text-gray-600">{post.subtitle}</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Legenda */}
          {post.caption && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Legenda</h2>
                <div className="flex gap-2">
                  {editingField === 'caption' ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button size="sm" loading={savingTexts} onClick={() => saveEdit('caption')}>
                        <Check className="h-4 w-4" />
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => startEdit('caption')}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopyCaption}>
                        {captionCopied ? (
                          <><Check className="h-4 w-4" />Copiado!</>
                        ) : (
                          <><Copy className="h-4 w-4" />Copiar</>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Card>
                <CardContent className="p-6">
                  {editingField === 'caption' ? (
                    <div className="space-y-3">
                      <textarea
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        rows={10}
                        className="w-full resize-none text-gray-700 text-sm leading-relaxed focus:outline-none bg-transparent border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400">{captionDraft.length} caracteres</p>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/posts/novo')}>
              Criar outro post
            </Button>
            {post.format === 'CARROSSEL' ? (
              <Button
                className="flex-1"
                onClick={async () => {
                  const slides = [...post.variations]
                    .filter((v) => v.imageUrl)
                    .sort((a, b) => (getCarrosselSlideNum(a.designStyle ?? '') ?? 0) - (getCarrosselSlideNum(b.designStyle ?? '') ?? 0))
                  for (let i = 0; i < slides.length; i++) {
                    const num = getCarrosselSlideNum(slides[i].designStyle ?? '') ?? (i + 1)
                    await downloadImage(slides[i].imageUrl!, `carrossel-slide-${num}.jpg`)
                    await new Promise((r) => setTimeout(r, 400))
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Baixar {post.variations.filter((v) => v.imageUrl).length} slides
              </Button>
            ) : selectedVariation ? (
              <Button
                className="flex-1"
                onClick={() => {
                  const variation = post.variations.find((v) => v.id === selectedVariation)
                  if (!variation?.imageUrl) return
                  downloadImage(variation.imageUrl, `clinify-post-${post.format.toLowerCase()}.jpg`)
                }}
              >
                <Download className="h-4 w-4" />
                Baixar imagem
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
