'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Sparkles, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const formats = [
  { value: 'FEED', label: 'Feed', description: 'Quadrado 1:1' },
  { value: 'PORTRAIT', label: 'Retrato', description: 'Vertical 4:5' },
  { value: 'STORIES', label: 'Stories', description: 'Vertical 9:16' },
]

type Step = 'upload' | 'format' | 'confirm'

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

export default function RecriarPostPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [format, setFormat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande (max 10MB)')
      return
    }
    setError('')
    const dataUrl = await resizeImageToBase64(file)
    setImageDataUrl(dataUrl)
    setStep('format')
    e.target.value = ''
  }

  function handleSelectFormat(value: string) {
    setFormat(value)
    setStep('confirm')
  }

  async function handleSubmit() {
    if (!imageDataUrl || !format) return
    setError('')
    setLoading(true)

    try {
      const payload: Record<string, string> = {
        originalImageDataUrl: imageDataUrl,
        format,
      }
      const { data } = await api.post('/posts/recreate', payload)
      router.push(`/posts/${data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao recriar post. Tente novamente.')
      setLoading(false)
    }
  }

  const selectedFormat = formats.find((f) => f.value === format)

  const steps = ['Upload', 'Formato', 'Confirmar']
  function getStepNum(): number {
    const order: Step[] = ['upload', 'format', 'confirm']
    return order.indexOf(step) + 1
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
          <h1 className="text-2xl font-bold text-gray-900">Recriar post</h1>
          <p className="text-gray-500 text-sm mt-0.5">Envie um post existente e a IA vai recriar em 3 versoes profissionais</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-1.5 text-sm">
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

      {/* Chips */}
      {step !== 'upload' && (
        <div className="flex flex-wrap gap-2">
          {imageDataUrl && (
            <button type="button" onClick={() => { setImageDataUrl(null); setFormat(''); setStep('upload') }}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              <Upload className="h-3 w-3" /> Imagem enviada ✕
            </button>
          )}
          {selectedFormat && step === 'confirm' && (
            <button type="button" onClick={() => { setFormat(''); setStep('format') }}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              {selectedFormat.label} ✕
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <label className="text-sm font-semibold text-gray-700">Envie a imagem do post que quer recriar</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="h-16 w-16 rounded-2xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 group-hover:text-blue-700">Clique para enviar a imagem</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG ou WebP (max 10MB)</p>
            </div>
          </button>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-sm text-amber-800 font-medium">Como funciona?</p>
            <ul className="text-xs text-amber-700 mt-2 space-y-1">
              <li>1. Envie a imagem do seu post atual (feito no Canva, por exemplo)</li>
              <li>2. A IA vai extrair o texto da imagem automaticamente</li>
              <li>3. Receba 3 versoes profissionais: similar, diferente e ousada</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step: Format */}
      {step === 'format' && (
        <div className="space-y-4">
          {/* Preview da imagem */}
          {imageDataUrl && (
            <div className="relative w-48 mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="Post original"
                className="w-full aspect-square object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={() => { setImageDataUrl(null); setStep('upload') }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          )}

          <label className="text-sm font-semibold text-gray-700">Escolha o formato das novas versoes</label>
          <div className="grid grid-cols-3 gap-3">
            {formats.map((fmt) => (
              <button key={fmt.value} type="button" onClick={() => handleSelectFormat(fmt.value)}
                className={cn(
                  'p-4 rounded-xl border-2 text-center transition-all',
                  format === fmt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-300',
                )}>
                <p className="font-semibold text-gray-900">{fmt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmt.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-6">
          {/* Preview */}
          {imageDataUrl && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="Post original"
                className="h-24 w-24 object-cover rounded-lg border border-gray-200 shrink-0"
              />
              <div>
                <p className="font-semibold text-gray-900">Post original enviado</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Formato: {selectedFormat?.label} ({selectedFormat?.description})
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  A IA vai extrair o texto e gerar 3 versoes profissionais
                </p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium">O que sera gerado:</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1.5">
              <li><span className="font-semibold">Versao 1 — Similar:</span> mesmo conceito, mas com qualidade profissional</li>
              <li><span className="font-semibold">Versao 2 — Diferente:</span> mesmo texto, layout completamente novo</li>
              <li><span className="font-semibold">Versao 3 — Ousada:</span> redesign criativo mantendo o texto original</li>
            </ul>
          </div>

          <Button
            className="w-full"
            size="lg"
            loading={loading}
            onClick={handleSubmit}
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Recriando post...' : 'Recriar com IA'}
          </Button>
        </div>
      )}
    </div>
  )
}
