'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, ChevronRight, Camera, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type Step = 'category' | 'format' | 'carouselStyle' | 'photo' | 'theme'

export default function NovoPostPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [theme, setTheme] = useState('')
  const [category, setCategory] = useState('')
  const [format, setFormat] = useState('')
  const [carouselStyle, setCarouselStyle] = useState('')
  const [usePhoto, setUsePhoto] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestingThemes, setSuggestingThemes] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])


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

  function handlePhotoChoice(use: boolean) {
    setUsePhoto(use)
    setStep('theme')
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
      if (isCarousel && carouselStyle) payload.carouselStyle = carouselStyle
      const { data } = await api.post('/posts', payload)
      router.push(`/posts/${data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar post. Tente novamente.')
      setLoading(false)
    }
  }

  // Step labels dinâmicos
  const steps = isCarousel
    ? ['Categoria', 'Formato', 'Estilo', 'Foto', 'Tema']
    : ['Categoria', 'Formato', 'Foto', 'Tema']

  function getStepNum(): number {
    const order = isCarousel
      ? ['category', 'format', 'carouselStyle', 'photo', 'theme']
      : ['category', 'format', 'photo', 'theme']
    return order.indexOf(step) + 1
  }

  function resetFrom(target: Step) {
    setTheme('')
    setSuggestions([])
    if (['category', 'format', 'carouselStyle'].includes(target)) {
      setUsePhoto(true)
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
          {step === 'theme' && (
            <button type="button" onClick={() => resetFrom('photo')}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              <Camera className="h-3 w-3" />
              {usePhoto ? 'Com foto' : 'Sem foto'} ✕
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
            <p className="text-xs text-gray-500 mt-0.5">A foto sera puxada do seu perfil ou Foto Pro automaticamente</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handlePhotoChoice(true)}
              className="p-5 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Sim, usar minha foto</p>
              <p className="text-xs text-gray-500">Ideal para posts fotograficos</p>
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
