'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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

export default function NovoPostPage() {
  const router = useRouter()
  const [theme, setTheme] = useState('')
  const [category, setCategory] = useState('')
  const [format, setFormat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestingThemes, setSuggestingThemes] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  async function handleSuggestThemes() {
    if (suggestingThemes) return
    setSuggestingThemes(true)
    try {
      const { data } = await api.post('/posts/suggest-themes')
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
      const { data } = await api.post('/posts', { theme, category, format })
      router.push(`/posts/${data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar post. Tente novamente.')
      setLoading(false)
    }
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

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tema */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Tema do post</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSuggestThemes}
              loading={suggestingThemes}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {suggestingThemes ? 'Sugerindo...' : 'Sugerir temas'}
            </Button>
          </div>
          <Input
            placeholder="Ex: 5 sinais de que você precisa cuidar da saúde mental"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            required
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTheme(s)}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categoria */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Categoria</label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  category === cat.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="font-semibold text-gray-900 mt-2">{cat.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Formato */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Formato</label>
          <div className="grid grid-cols-4 gap-3">
            {formats.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                onClick={() => setFormat(fmt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  format === fmt.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{fmt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={!theme || !category || !format}
        >
          <Sparkles className="h-4 w-4" />
          {loading ? 'Criando post...' : 'Criar post com IA'}
        </Button>
      </form>
    </div>
  )
}
