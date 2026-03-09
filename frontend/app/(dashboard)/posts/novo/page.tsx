'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, ChevronRight, Camera, User, Star, ImagePlus, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const categories = [
  { value: 'EDUCATIVO', label: 'Educativo', description: 'Dicas e informações de saúde', icon: '📚' },
  { value: 'INSTITUCIONAL', label: 'Institucional', description: 'Apresentação de serviços', icon: '🏥' },
  { value: 'MOTIVACIONAL', label: 'Motivacional', description: 'Conteúdo inspirador', icon: '⭐' },
  { value: 'CRIATIVO_ANUNCIO', label: 'Anúncio', description: 'Anúncio persuasivo', icon: '📣' },
]

const formats = [
  { value: 'FEED', label: 'Feed', description: 'Quadrado 1:1' },
  { value: 'PORTRAIT', label: 'Retrato', description: 'Vertical 4:5' },
  { value: 'STORIES', label: 'Stories', description: 'Vertical 9:16' },
  { value: 'CARROSSEL', label: 'Carrossel', description: '5 slides' },
]

const carouselStyles = [
  {
    value: 'fotografico',
    label: 'Fotográfico',
    description: 'Fotos de fundo com overlay escuro, texto branco, estilo editorial',
    preview: '🖼️',
    colors: 'bg-gray-900 text-white',
  },
  {
    value: 'tipografico',
    label: 'Tipográfico',
    description: 'Fundo claro, tipografia como protagonista, estilo clean',
    preview: '✍️',
    colors: 'bg-stone-100 text-gray-900',
  },
  {
    value: 'grafico',
    label: 'Gráfico',
    description: 'Fundo na cor da marca, elementos geométricos, texto branco',
    preview: '🎨',
    colors: 'bg-blue-600 text-white',
  },
]

type Step = 'category' | 'format' | 'carouselStyle' | 'photo' | 'contextPhoto' | 'theme'

interface AvailablePhoto {
  url: string
  isFavorite: boolean
}

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

export default function NovoPostPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [theme, setTheme] = useState('')
  const [category, setCategory] = useState('')
  const [format, setFormat] = useState('')
  const [carouselStyle, setCarouselStyle] = useState('')
  const [usePhoto, setUsePhoto] = useState(true)
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null)
  const [contextPhotoDataUrl, setContextPhotoDataUrl] = useState<string | null>(null)
  const [availablePhotos, setAvailablePhotos] = useState<AvailablePhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestingThemes, setSuggestingThemes] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const contextFileRef = useRef<HTMLInputElement>(null)

  // Buscar fotos disponíveis quando entrar no step de foto
  useEffect(() => {
    if (step === 'photo' && availablePhotos.length === 0 && !loadingPhotos) {
      setLoadingPhotos(true)
      api.get('/photos').then(({ data }) => {
        const completed = (data as any[]).filter((s: any) => s.status === 'COMPLETED')
        const photos: AvailablePhoto[] = []
        for (const session of completed) {
          const favs: string[] = session.favoritePhotoUrls || []
          for (const url of session.generatedPhotoUrls) {
            photos.push({ url, isFavorite: favs.includes(url) })
          }
        }
        // Favoritas primeiro
        photos.sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1))
        setAvailablePhotos(photos)
      }).catch(() => {}).finally(() => setLoadingPhotos(false))
    }
  }, [step, availablePhotos.length, loadingPhotos])

  const selectedCategory = categories.find((c) => c.value === category)
  const selectedFormat = formats.find((f) => f.value === format)
  const selectedCarouselStyle = carouselStyles.find((s) => s.value === carouselStyle)
  const isCarousel = format === 'CARROSSEL'

  function handleSelectCategory(value: string) {
    setCategory(value)
    setSuggestions([])
    setTheme('')
    setStep('format')
  }

  function handleSelectFormat(value: string) {
    setFormat(value)
    setSuggestions([])
    if (value === 'CARROSSEL') {
      setStep('carouselStyle')
    } else {
      setStep('photo')
    }
  }

  function handleSelectCarouselStyle(value: string) {
    setCarouselStyle(value)
    setStep('photo')
  }

  function handlePhotoChoice(use: boolean, photoUrl?: string) {
    setUsePhoto(use)
    setSelectedPhotoUrl(photoUrl || null)
    setStep('contextPhoto')
  }

  async function handleContextPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Foto muito grande (máx 5MB)')
      return
    }
    const dataUrl = await resizeImageToBase64(file)
    setContextPhotoDataUrl(dataUrl)
    e.target.value = ''
  }

  async function handleSuggestThemes() {
    if (suggestingThemes) return
    setSuggestingThemes(true)
    try {
      const { data } = await api.post('/posts/suggest-themes', { category, format })
      setSuggestions(Array.isArray(data) ? data : data.suggestions || data.themes || [])
    } catch {
      // silently fail
    } finally {
      setSuggestingThemes(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!theme || !category || !format) {
      setError('Preencha todos os campos')
      return
    }
    setError('')
    setLoading(true)

    try {
      const payload: Record<string, string> = { theme, category, format }
      if (!usePhoto) payload.userPhotoUrl = 'none'
      else if (selectedPhotoUrl) payload.userPhotoUrl = selectedPhotoUrl
      if (isCarousel && carouselStyle) payload.carouselStyle = carouselStyle
      if (contextPhotoDataUrl) payload.contextPhotoUrl = contextPhotoDataUrl
      const { data } = await api.post('/posts', payload)
      router.push(`/posts/${data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar post. Tente novamente.')
      setLoading(false)
    }
  }

  // Step labels dinâmicos
  const steps = isCarousel
    ? ['Categoria', 'Formato', 'Estilo', 'Foto', 'Contexto', 'Tema']
    : ['Categoria', 'Formato', 'Foto', 'Contexto', 'Tema']

  function getStepNum(): number {
    const order = isCarousel
      ? ['category', 'format', 'carouselStyle', 'photo', 'contextPhoto', 'theme']
      : ['category', 'format', 'photo', 'contextPhoto', 'theme']
    return order.indexOf(step) + 1
  }

  function resetFrom(target: Step) {
    setTheme('')
    setSuggestions([])
    if (['category', 'format', 'carouselStyle', 'photo'].includes(target)) {
      setUsePhoto(true)
      setSelectedPhotoUrl(null)
      setContextPhotoDataUrl(null)
    }
    if (target === 'contextPhoto') {
      setContextPhotoDataUrl(null)
    }
    if (['category', 'format'].includes(target)) {
      setCarouselStyle('')
    }
    if (target === 'category') {
      setFormat('')
    }
    setStep(target)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar novo post</h1>
          <p className="text-gray-500 text-sm mt-0.5">A IA vai gerar textos e artes personalizadas</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-1.5 text-sm flex-wrap">
        {steps.map((label, i) => {
          const num = i + 1
          const currentNum = getStepNum()
          const isActive = num === currentNum
          const isDone = num < currentNum
          return (
            <span key={label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
              <span className={isActive ? 'text-blue-600 font-semibold' : isDone ? 'text-green-600' : 'text-gray-400'}>
                {num}. {label}
              </span>
            </span>
          )
        })}
      </div>

      {/* Chips de seleções feitas */}
      {step !== 'category' && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <button type="button" onClick={() => resetFrom('category')}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              {selectedCategory.icon} {selectedCategory.label} ✕
            </button>
          )}
          {selectedFormat && step !== 'format' && (
            <button type="button" onClick={() => resetFrom('format')}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              {selectedFormat.label} ✕
            </button>
          )}
          {isCarousel && selectedCarouselStyle && step !== 'carouselStyle' && step !== 'format' && (
            <button type="button" onClick={() => resetFrom('carouselStyle')}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              {selectedCarouselStyle.preview} {selectedCarouselStyle.label} ✕
            </button>
          )}
          {(step === 'contextPhoto' || step === 'theme') && (
            <button type="button" onClick={() => resetFrom('photo')}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              <Camera className="h-3 w-3" />
              {usePhoto ? (selectedPhotoUrl ? 'Foto escolhida' : 'Com foto') : 'Sem foto'} ✕
            </button>
          )}
          {step === 'theme' && contextPhotoDataUrl && (
            <button type="button" onClick={() => resetFrom('contextPhoto')}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              <ImagePlus className="h-3 w-3" />
              Foto de contexto ✕
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {/* Step: Categoria */}
      {step === 'category' && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Qual o tipo de conteudo?</label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button key={cat.value} type="button" onClick={() => handleSelectCategory(cat.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${category === cat.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <span className="text-2xl">{cat.icon}</span>
                <p className="font-semibold text-gray-900 mt-2">{cat.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Formato */}
      {step === 'format' && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Escolha o formato</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {formats.map((fmt) => (
              <button key={fmt.value} type="button" onClick={() => handleSelectFormat(fmt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${format === fmt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <p className="font-semibold text-gray-900">{fmt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmt.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Estilo do carrossel */}
      {step === 'carouselStyle' && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Estilo do carrossel</label>
          <p className="text-xs text-gray-500">A IA vai gerar 5 slides (1 capa + 3 conteudo + 1 CTA) neste estilo</p>
          <div className="grid grid-cols-1 gap-3">
            {carouselStyles.map((style) => (
              <button key={style.value} type="button" onClick={() => handleSelectCarouselStyle(style.value)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${carouselStyle === style.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <div className={`h-16 w-16 rounded-xl ${style.colors} flex items-center justify-center text-2xl shrink-0`}>
                  {style.preview}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{style.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{style.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Foto */}
      {step === 'photo' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Usar sua foto na arte?</label>
            <p className="text-xs text-gray-500 mt-0.5">Escolha uma foto ou deixe a IA selecionar automaticamente</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handlePhotoChoice(true)}
              className="p-5 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Sim, automatico</p>
              <p className="text-xs text-gray-500">IA escolhe a melhor foto</p>
            </button>
            <button type="button" onClick={() => handlePhotoChoice(false)}
              className="p-5 rounded-xl border-2 border-gray-100 hover:border-gray-400 hover:bg-gray-50 transition-all text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <Camera className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Sem foto</p>
              <p className="text-xs text-gray-500">Arte somente com design e textos</p>
            </button>
          </div>

          {/* Mini-galeria para escolher foto específica */}
          {availablePhotos.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ou escolha uma foto específica</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                {availablePhotos.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePhotoChoice(true, photo.url)}
                    className={cn(
                      'relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all hover:opacity-90',
                      selectedPhotoUrl === photo.url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    {photo.isFavorite && (
                      <div className="absolute top-1 right-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingPhotos && (
            <p className="text-xs text-gray-400 text-center">Carregando fotos...</p>
          )}
        </div>
      )}

      {/* Step: Foto contextual */}
      {step === 'contextPhoto' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Foto de contexto (opcional)</label>
            <p className="text-xs text-gray-500 mt-0.5">
              Foto do seu consultório, procedimento ou equipamento para inspirar o fundo da arte
            </p>
          </div>

          <input
            ref={contextFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleContextPhotoUpload}
          />

          {contextPhotoDataUrl ? (
            <div className="relative w-48 mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contextPhotoDataUrl}
                alt="Foto contextual"
                className="w-full aspect-square object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setContextPhotoDataUrl(null)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => contextFileRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <ImagePlus className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-600 group-hover:text-blue-700 text-sm">Adicionar foto de contexto</p>
                <p className="text-xs text-gray-400 mt-0.5">Consultório, procedimento, equipamento...</p>
              </div>
            </button>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setContextPhotoDataUrl(null); setStep('theme') }}
            >
              Pular
            </Button>
            {contextPhotoDataUrl && (
              <Button
                type="button"
                className="flex-1"
                onClick={() => setStep('theme')}
              >
                Continuar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step: Tema */}
      {step === 'theme' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Tema do post</label>
              <Button type="button" variant="ghost" size="sm" onClick={handleSuggestThemes} loading={suggestingThemes}>
                <Sparkles className="h-3.5 w-3.5" />
                {suggestingThemes ? 'Sugerindo...' : 'Sugerir temas'}
              </Button>
            </div>
            <Input
              placeholder="Ex: 5 sinais de que voce precisa cuidar da saude mental"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              autoFocus
              required
            />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => setTheme(s)}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors text-left">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!theme}>
            <Sparkles className="h-4 w-4" />
            {loading ? 'Criando post...' : 'Criar post com IA'}
          </Button>
        </form>
      )}
    </div>
  )
}
