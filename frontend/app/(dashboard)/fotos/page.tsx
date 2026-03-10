'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, Sparkles, Upload, ImagePlus, X, Download, Loader2, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type PhotoStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
type UploadMode = 'GENERATE' | 'UPLOAD'

interface PhotoSession {
  id: string
  mode: string
  generatedPhotoUrls: string[]
  favoritePhotoUrls: string[]
  regenerationsUsed: number
  status: PhotoStatus
  createdAt: string
}

const MAX_REGENERATIONS = 3

const MAX_FILE_SIZE_MB = 5
const MAX_PHOTOS = 10
const MIN_PHOTOS_GENERATE = 3
const POLL_INTERVAL = 8000

function resizeImageToBase64(file: File, maxSide = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function FotosPage() {
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [view, setView] = useState<'gallery' | 'upload'>('gallery')
  const [mode, setMode] = useState<UploadMode>('GENERATE')
  const [previews, setPreviews] = useState<{ file: File; dataUrl: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/photos')
      setSessions(data)
      setFetchError('')
    } catch {
      setFetchError('Não foi possível carregar suas fotos. Tente atualizar a página.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Polling enquanto houver sessões em processamento
  useEffect(() => {
    const hasProcessing = sessions.some(s => s.status === 'PENDING' || s.status === 'PROCESSING')
    if (!hasProcessing) return
    const interval = setInterval(fetchSessions, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [sessions, fetchSessions])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const valid = files.filter(f => {
      if (!f.type.startsWith('image/')) return false
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false
      return true
    })

    const remaining = MAX_PHOTOS - previews.length
    const toProcess = valid.slice(0, remaining)

    const processed = await Promise.all(
      toProcess.map(async (file) => ({
        file,
        dataUrl: await resizeImageToBase64(file),
      }))
    )
    setPreviews(prev => [...prev, ...processed])
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (mode === 'GENERATE' && previews.length < MIN_PHOTOS_GENERATE) return
    if (mode === 'UPLOAD' && previews.length === 0) return

    setSubmitting(true)
    setError('')
    try {
      await api.post('/photos/start', {
        mode,
        photos: previews.map(p => p.dataUrl),
      })
      setPreviews([])
      setView('gallery')
      await fetchSessions()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao iniciar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleFavorite(sessionId: string, photoUrl: string) {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const current = session.favoritePhotoUrls || []
    const isFav = current.includes(photoUrl)
    const updated = isFav ? current.filter(u => u !== photoUrl) : [...current, photoUrl]

    // Atualizar estado local imediatamente (otimista)
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, favoritePhotoUrls: updated } : s
    ))

    try {
      await api.patch(`/photos/${sessionId}/favorites`, { favoriteUrls: updated })
    } catch {
      // Reverter em caso de erro
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, favoritePhotoUrls: current } : s
      ))
    }
  }

  async function handleDeletePhoto(sessionId: string, photoUrl: string) {
    // Atualizar estado local imediatamente (otimista)
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? {
        ...s,
        generatedPhotoUrls: s.generatedPhotoUrls.filter(u => u !== photoUrl),
        favoritePhotoUrls: (s.favoritePhotoUrls || []).filter(u => u !== photoUrl),
      } : s
    ))

    try {
      await api.delete(`/photos/${sessionId}/photo`, { data: { photoUrl } })
    } catch {
      // Reverter em caso de erro
      await fetchSessions()
    }
  }

  async function handleRegenerate(sessionId: string, count: number) {
    try {
      await api.post(`/photos/${sessionId}/regenerate`, { count })
      await fetchSessions()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao regenerar. Tente novamente.')
    }
  }

  async function handleDelete(sessionId: string) {
    try {
      await api.delete(`/photos/${sessionId}`)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch {
      // silencioso
    }
  }

  // ─────────────────────────────────────────
  // Loading
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const activeSession = sessions.find(s => s.status === 'PENDING' || s.status === 'PROCESSING')
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED')
  const allPhotos = completedSessions.flatMap(s =>
    s.generatedPhotoUrls.map(url => ({ url, sessionId: s.id, isFavorite: (s.favoritePhotoUrls || []).includes(url) }))
  )
  const favoriteCount = allPhotos.filter(p => p.isFavorite).length

  // ─────────────────────────────────────────
  // Tela de upload
  if (view === 'upload') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView('gallery'); setPreviews([]); setError('') }}
            className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Criar enxoval de fotos</h1>
            <p className="text-gray-500 text-sm mt-0.5">10 fotos profissionais geradas por IA</p>
          </div>
        </div>

        {/* Seleção de modo */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('GENERATE')}
            className={cn(
              'p-5 rounded-2xl border-2 text-left transition-all',
              mode === 'GENERATE' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
            )}
          >
            <Sparkles className={cn('h-6 w-6 mb-3', mode === 'GENERATE' ? 'text-blue-600' : 'text-gray-400')} />
            <p className="font-semibold text-gray-900 text-sm">Gerar com IA</p>
            <p className="text-xs text-gray-500 mt-1">Sobe fotos casuais e a IA gera fotos profissionais</p>
          </button>
          <button
            onClick={() => setMode('UPLOAD')}
            className={cn(
              'p-5 rounded-2xl border-2 text-left transition-all',
              mode === 'UPLOAD' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
            )}
          >
            <Upload className={cn('h-6 w-6 mb-3', mode === 'UPLOAD' ? 'text-blue-600' : 'text-gray-400')} />
            <p className="font-semibold text-gray-900 text-sm">Já tenho fotos</p>
            <p className="text-xs text-gray-500 mt-1">Sobe fotos profissionais que você já tem</p>
          </button>
        </div>

        {/* Instrução */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            {mode === 'GENERATE' ? (
              <>
                <strong>Dicas para melhores resultados:</strong> use fotos bem iluminadas, com seu rosto visível, de ângulos variados. Selfies, fotos em casa ou no trabalho funcionam bem. Mínimo de <strong>3 fotos</strong>, ideal entre 5 e 10.
              </>
            ) : (
              <>
                Suba até <strong>10 fotos profissionais</strong> que você já tem (JPG ou PNG, até 5MB cada). Elas ficarão salvas no seu perfil para usar nos posts.
              </>
            )}
          </div>

          {mode === 'GENERATE' && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800 flex gap-3">
              <span className="text-lg shrink-0">💡</span>
              <div>
                <strong>Dica sobre expressão:</strong> A IA vai copiar sua expressão natural das fotos de referência.
                Se você <strong>não sorri com os dentes</strong>, suba fotos com sorriso fechado ou expressão neutra — a IA não vai inventar um sorriso que não é seu.
              </div>
            </div>
          )}
        </div>

        {/* Área de upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {previews.length === 0 ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="h-14 w-14 rounded-2xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <ImagePlus className="h-7 w-7 text-gray-400 group-hover:text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 group-hover:text-blue-700">Selecionar fotos</p>
              <p className="text-sm text-gray-400 mt-1">PNG ou JPG, até 5MB cada</p>
            </div>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.dataUrl}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {previews.length < MAX_PHOTOS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 flex items-center justify-center transition-colors"
                >
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 text-center">{previews.length} foto{previews.length !== 1 ? 's' : ''} selecionada{previews.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={
            submitting ||
            (mode === 'GENERATE' && previews.length < MIN_PHOTOS_GENERATE) ||
            (mode === 'UPLOAD' && previews.length === 0)
          }
          onClick={handleSubmit}
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando fotos...</>
          ) : mode === 'GENERATE' ? (
            <><Sparkles className="h-4 w-4" /> Gerar {previews.length >= MIN_PHOTOS_GENERATE ? 'enxoval com IA' : `(mínimo ${MIN_PHOTOS_GENERATE} fotos)`}</>
          ) : (
            <><Upload className="h-4 w-4" /> Salvar fotos no perfil</>
          )}
        </Button>
      </div>
    )
  }

  // ─────────────────────────────────────────
  // Tela de galeria (view = 'gallery')
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fotos Pro</h1>
          <p className="text-gray-500 text-sm mt-0.5">Seu enxoval de fotos profissionais</p>
        </div>
        {allPhotos.length > 0 && (
          <Button onClick={() => setView('upload')}>
            <Sparkles className="h-4 w-4" />
            Novo enxoval
          </Button>
        )}
      </div>

      {/* Sessão em processamento */}
      {activeSession && (
        <Card>
          <CardContent className="p-6 flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Gerando seu enxoval de fotos...</p>
              <p className="text-sm text-gray-500 mt-0.5">
                A IA está treinando um modelo com o seu rosto e criando as 10 fotos. Isso leva cerca de 10-15 minutos.
              </p>
            </div>
            <button
              onClick={fetchSessions}
              className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
              title="Atualizar status"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Erro ao carregar */}
      {fetchError && (
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">Erro ao carregar fotos</p>
              <p className="text-xs text-gray-500 mt-0.5">{fetchError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchSessions}>
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sessões com falha */}
      {sessions.filter(s => s.status === 'FAILED').map(s => (
        <Card key={s.id}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">Geração falhou</p>
              <p className="text-xs text-gray-500 mt-0.5">Ocorreu um erro ao processar suas fotos.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setView('upload')}>Tentar novamente</Button>
              <button
                onClick={() => handleDelete(s.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remover
              </button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Galeria de fotos */}
      {allPhotos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              {allPhotos.length} fotos disponíveis{favoriteCount > 0 && ` · ${favoriteCount} favorita${favoriteCount !== 1 ? 's' : ''}`}
            </p>
            {favoriteCount > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Favoritas são priorizadas nos posts
              </p>
            )}
          </div>

          {/* Barra de regeneração */}
          {completedSessions.filter(s => s.mode === 'GENERATE').map(session => {
            const remaining = MAX_REGENERATIONS - (session.regenerationsUsed || 0)
            if (remaining <= 0) return null
            return (
              <Card key={`regen-${session.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <RefreshCw className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Não gostou de alguma foto?</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Delete as que não curtiu e regenere novas. Você tem <strong>{remaining} regenera{remaining === 1 ? 'ção' : 'ções'}</strong> de cortesia.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {[1, 2, 3].filter(n => n <= remaining).map(n => (
                      <Button
                        key={n}
                        size="sm"
                        variant={n === remaining ? 'default' : 'outline'}
                        onClick={() => handleRegenerate(session.id, n)}
                        disabled={!!activeSession}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {n} foto{n !== 1 ? 's' : ''}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allPhotos.map((photo, i) => (
              <div key={i} className={cn(
                'group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100',
                photo.isFavorite && 'ring-2 ring-amber-400 ring-offset-2'
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Foto profissional ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Botão de favorito — sempre visível */}
                <button
                  onClick={() => handleToggleFavorite(photo.sessionId, photo.url)}
                  className={cn(
                    'absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-all',
                    photo.isFavorite
                      ? 'bg-amber-400 text-white shadow-md'
                      : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                  )}
                >
                  <Star className={cn('h-4 w-4', photo.isFavorite && 'fill-white')} />
                </button>
                {/* Botão de deletar — canto superior esquerdo, visível no hover */}
                <button
                  onClick={() => handleDeletePhoto(photo.sessionId, photo.url)}
                  className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/40 text-white/70 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 pointer-events-none">
                  <a
                    href={photo.url}
                    download={`foto-pro-${i + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-gray-900 text-xs font-medium hover:bg-gray-100 transition-colors pointer-events-auto"
                    onClick={e => e.stopPropagation()}
                  >
                    <Download className="h-3 w-3" />
                    Baixar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !activeSession ? (
        // Estado vazio
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Camera className="h-10 w-10 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Crie seu enxoval de fotos</h2>
              <p className="text-gray-500 text-sm max-w-sm">
                Suba algumas fotos suas e a IA gera 10 fotos profissionais para usar nos seus posts do Instagram.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs text-left">
              {[
                'Headshots com fundo neutro',
                'Fotos em ambiente de trabalho',
                'Poses profissionais variadas',
                'Prontas para usar nos posts',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Button size="lg" onClick={() => setView('upload')}>
              <Sparkles className="h-4 w-4" />
              Criar meu enxoval
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
