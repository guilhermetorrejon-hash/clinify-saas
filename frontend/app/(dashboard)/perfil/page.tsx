'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Palette, Type, Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const professions = [
  { value: 'MEDICO', label: 'Médico(a)', council: 'CRM' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista', council: 'CRN' },
  { value: 'PSICOLOGO', label: 'Psicólogo(a)', council: 'CRP' },
  { value: 'ENFERMEIRO', label: 'Enfermeiro(a)', council: 'COREN' },
  { value: 'DENTISTA', label: 'Dentista', council: 'CRO' },
  { value: 'FARMACEUTICO', label: 'Farmacêutico(a)', council: 'CRF' },
  { value: 'OUTRO', label: 'Outro', council: '' },
]

const fontOptions = [
  {
    value: 'Poppins',
    label: 'Poppins',
    description: 'Moderno e geométrico',
    sample: 'Saúde com qualidade',
    style: { fontFamily: 'Poppins, sans-serif', fontWeight: '600' },
  },
  {
    value: 'Playfair Display',
    label: 'Playfair Display',
    description: 'Clássico e editorial',
    sample: 'Saúde com qualidade',
    style: { fontFamily: '"Playfair Display", serif', fontWeight: '700' },
  },
  {
    value: 'Montserrat',
    label: 'Montserrat',
    description: 'Forte e profissional',
    sample: 'Saúde com qualidade',
    style: { fontFamily: 'Montserrat, sans-serif', fontWeight: '700' },
  },
  {
    value: 'Cormorant Garamond',
    label: 'Cormorant',
    description: 'Elegante e refinado',
    sample: 'Saúde com qualidade',
    style: { fontFamily: '"Cormorant Garamond", serif', fontWeight: '600' },
  },
  {
    value: 'Raleway',
    label: 'Raleway',
    description: 'Contemporâneo e suave',
    sample: 'Saúde com qualidade',
    style: { fontFamily: 'Raleway, sans-serif', fontWeight: '600' },
  },
  {
    value: 'Inter',
    label: 'Inter',
    description: 'Clean e tecnológico',
    sample: 'Saúde com qualidade',
    style: { fontFamily: 'Inter, sans-serif', fontWeight: '600' },
  },
  {
    value: '',
    label: 'Sem preferência',
    description: 'A IA escolhe a melhor fonte',
    sample: 'A IA decide',
    style: { fontFamily: 'system-ui, sans-serif', fontWeight: '400' },
  },
]

export default function PerfilPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoWhitePreview, setLogoWhitePreview] = useState<string | null>(null)
  const [uploadingLogoWhite, setUploadingLogoWhite] = useState(false)
  const logoWhiteInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    professionalName: '',
    profession: '',
    specialty: '',
    registrationNumber: '',
    bio: '',
    areasOfExpertise: [] as string[],
    brandPrimaryColor: '#0e82eb',
    brandSecondaryColor: '#fbbf24',
    instagramHandle: '',
    preferredFont: '',
  })
  const [newArea, setNewArea] = useState('')

  const selectedProfession = professions.find((p) => p.value === form.profession)

  useEffect(() => {
    async function loadBrandKit() {
      try {
        const { data } = await api.get('/brand-kit')
        if (data) {
          setForm({
            professionalName: data.professionalName || '',
            profession: data.profession || '',
            specialty: data.specialty || '',
            registrationNumber: data.registrationNumber || '',
            bio: data.bio || '',
            areasOfExpertise: data.areasOfExpertise || [],
            brandPrimaryColor: data.brandPrimaryColor || '#0e82eb',
            brandSecondaryColor: data.brandSecondaryColor || '#fbbf24',
            instagramHandle: data.instagramHandle || '',
            preferredFont: data.preferredFont || '',
          })
        }
        if (data.logoUrl) setLogoPreview(data.logoUrl)
        if (data.logoWhiteUrl) setLogoWhitePreview(data.logoWhiteUrl)
      } catch {
        // Brand kit ainda não criado, usa defaults
      } finally {
        setLoading(false)
      }
    }
    loadBrandKit()
  }, [])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo muito grande. Use uma imagem até 2MB.')
      return
    }
    setUploadingLogo(true)
    setError('')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setLogoPreview(dataUrl)
      try {
        await api.post('/brand-kit/logo', { logoUrl: dataUrl })
      } catch {
        setError('Erro ao salvar logo. Tente novamente.')
        setLogoPreview(null)
      } finally {
        setUploadingLogo(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleLogoWhiteUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo muito grande. Use uma imagem até 2MB.')
      return
    }
    setUploadingLogoWhite(true)
    setError('')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setLogoWhitePreview(dataUrl)
      try {
        await api.post('/brand-kit/logo-white', { logoUrl: dataUrl })
      } catch {
        setError('Erro ao salvar logo clara. Tente novamente.')
        setLogoWhitePreview(null)
      } finally {
        setUploadingLogoWhite(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.patch('/brand-kit', {
        professionalName: form.professionalName,
        profession: form.profession || undefined,
        specialty: form.specialty,
        registrationCouncil: selectedProfession?.council || undefined,
        registrationNumber: form.registrationNumber,
        bio: form.bio,
        areasOfExpertise: form.areasOfExpertise,
        brandPrimaryColor: form.brandPrimaryColor,
        brandSecondaryColor: form.brandSecondaryColor,
        instagramHandle: form.instagramHandle,
        preferredFont: form.preferredFont || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-100 rounded-lg animate-pulse" />
        <div className="mt-8 space-y-4">
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500 mt-1">
          Essas informações personalizam todas as suas artes e legendas automaticamente
        </p>
      </div>

      {/* Dados profissionais */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Dados Profissionais</CardTitle>
              <CardDescription>
                Obrigatório para geração de posts — seu nome e registro aparecem nas artes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Input
            label="Nome profissional *"
            placeholder="Dr. João Silva"
            value={form.professionalName}
            onChange={(e) => setForm({ ...form, professionalName: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Profissão *</label>
            <select
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione sua profissão</option>
              {professions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Especialidade"
              placeholder="Ex: Cardiologia"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            />
            <Input
              label={selectedProfession?.council ? `Número do ${selectedProfession.council} *` : 'Número de registro *'}
              placeholder="Ex: 12345/SP"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            />
          </div>

          {selectedProfession?.council && (
            <div className="p-3 rounded-xl bg-blue-50 text-sm text-blue-700">
              O <strong>{selectedProfession.council} {form.registrationNumber || 'XXXXX/UF'}</strong> aparecerá automaticamente na legenda e nas artes, conforme exigido pelo conselho da sua categoria.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Breve descrição sobre você e sua atuação..."
              rows={3}
              maxLength={500}
              className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Áreas de Atuação</label>
            <p className="text-xs text-gray-500">Adicione suas áreas adicionais de especialização (ex: Gerontologia, Idosos, Oncologia)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Gerontologia, Idosos, Oncologia"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (newArea.trim()) {
                      setForm({
                        ...form,
                        areasOfExpertise: [...form.areasOfExpertise, newArea.trim()],
                      })
                      setNewArea('')
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (newArea.trim()) {
                    setForm({
                      ...form,
                      areasOfExpertise: [...form.areasOfExpertise, newArea.trim()],
                    })
                    setNewArea('')
                  }
                }}
              >
                Adicionar
              </Button>
            </div>
            {form.areasOfExpertise.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {form.areasOfExpertise.map((area, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200"
                  >
                    <span className="text-sm text-blue-700">{area}</span>
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          areasOfExpertise: form.areasOfExpertise.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Instagram"
            placeholder="@seuperfil"
            value={form.instagramHandle}
            onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle>Logo da Marca</CardTitle>
              <CardDescription>
                Sua logo aparece nas artes. Sem logo, a IA gera sem ela.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <div className="h-20 w-40 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  loading={uploadingLogo}
                >
                  <Upload className="h-4 w-4" />
                  Trocar logo
                </Button>
                <button
                  onClick={async () => {
                    setLogoPreview(null)
                    await api.post('/brand-kit/logo', { logoUrl: '' })
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Remover logo
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Upload className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {uploadingLogo ? 'Enviando...' : 'Clique para enviar sua logo'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG ou WebP — até 2MB</p>
              </div>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Logo versão clara (opcional) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Logo versão clara <span className="text-sm font-normal text-gray-400">(opcional)</span></CardTitle>
              <CardDescription>Usada automaticamente em artes com fundo escuro. Se não tiver, a IA adapta a logo colorida.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={logoWhiteInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoWhiteUpload}
          />
          {logoWhitePreview ? (
            <div className="flex items-center gap-4">
              <div className="h-20 w-40 rounded-xl border border-gray-200 bg-gray-900 flex items-center justify-center overflow-hidden p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoWhitePreview} alt="Logo clara" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoWhiteInputRef.current?.click()}
                  loading={uploadingLogoWhite}
                >
                  <Upload className="h-4 w-4" />
                  Trocar
                </Button>
                <button
                  onClick={async () => {
                    setLogoWhitePreview(null)
                    await api.post('/brand-kit/logo-white', { logoUrl: '' })
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Remover
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => logoWhiteInputRef.current?.click()}
              disabled={uploadingLogoWhite}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-gray-900 group-hover:bg-gray-800 flex items-center justify-center transition-colors">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {uploadingLogoWhite ? 'Enviando...' : 'Logo branca / clara (fundo transparente)'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PNG com transparência recomendado — até 2MB</p>
              </div>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Identidade visual */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Palette className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Cores que aparecem nas suas artes automaticamente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Cor primária</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandPrimaryColor}
                  onChange={(e) => setForm({ ...form, brandPrimaryColor: e.target.value })}
                  className="h-11 w-16 rounded-xl border border-gray-200 cursor-pointer p-1"
                />
                <span className="text-sm text-gray-500 font-mono">{form.brandPrimaryColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Cor secundária</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandSecondaryColor}
                  onChange={(e) => setForm({ ...form, brandSecondaryColor: e.target.value })}
                  className="h-11 w-16 rounded-xl border border-gray-200 cursor-pointer p-1"
                />
                <span className="text-sm text-gray-500 font-mono">{form.brandSecondaryColor}</span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2 font-medium">Preview das suas cores</p>
            <div
              className="h-16 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${form.brandPrimaryColor}, ${form.brandSecondaryColor})`,
              }}
            >
              <span className="text-white font-semibold text-sm">
                {form.professionalName || 'Seu Nome'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonte preferida */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Type className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Tipografia</CardTitle>
              <CardDescription>
                Qual estilo de fonte combina com sua identidade profissional?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {fontOptions.map((font) => {
              const isSelected = form.preferredFont === font.value
              return (
                <button
                  key={font.value || 'none'}
                  onClick={() => setForm({ ...form, preferredFont: font.value })}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-150',
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{font.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{font.description}</p>
                  </div>
                  <span
                    className="text-lg text-gray-700 ml-4 shrink-0"
                    style={font.style}
                  >
                    {font.sample}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
          ✓ Perfil salvo com sucesso!
        </div>
      )}

      <Button className="w-full" size="lg" loading={saving} onClick={handleSave}>
        Salvar perfil
      </Button>
    </div>
  )
}
