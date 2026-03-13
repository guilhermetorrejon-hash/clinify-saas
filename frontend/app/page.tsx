'use client'

import Link from 'next/link'
import {
  Check,
  ArrowRight,
  Sparkles,
  Camera,
  RefreshCw,
  Shield,
  Palette,
  X,
  FileText,
  Star,
} from 'lucide-react'

const plans = [
  {
    name: 'Essencial',
    slug: 'essencial',
    price: 49,
    description: 'Para quem está começando a criar presença digital.',
    features: [
      '4 posts por mês',
      '1 carrossel por mês',
      '4 sessões de Foto Pro',
      'Recriar posts existentes',
      'Suporte por email',
    ],
    cta: 'Começar agora',
    highlight: false,
  },
  {
    name: 'Profissional',
    slug: 'profissional',
    price: 99,
    description: 'O mais escolhido por profissionais que levam suas redes a sério.',
    features: [
      '8 posts por mês',
      '2 carrosséis por mês',
      '6 sessões de Foto Pro',
      'Recriar posts existentes',
      'Suporte prioritário',
    ],
    cta: 'Escolher Profissional',
    highlight: true,
  },
  {
    name: 'Referência',
    slug: 'referencia',
    price: 199,
    description: 'Para quem quer ser referência digital na sua especialidade.',
    features: [
      '12 posts por mês',
      '4 carrosséis por mês',
      '10 sessões de Foto Pro',
      'Recriar posts existentes',
      'Suporte VIP com onboarding',
    ],
    cta: 'Escolher Referência',
    highlight: false,
  },
]

const featureCards = [
  {
    icon: Sparkles,
    badge: 'Economia de 10x',
    title: 'Posts com IA',
    description: 'Gere posts completos com textos, legendas e artes profissionais em minutos. Escolha entre 3 estilos de design.',
  },
  {
    icon: RefreshCw,
    badge: 'Novo',
    title: 'Recriar Post',
    description: 'Envie um post existente e nossa IA recria em 3 variações profissionais, mantendo sua mensagem original.',
  },
  {
    icon: Camera,
    badge: 'IA Generativa',
    title: 'Foto Pro',
    description: 'Transforme suas fotos amadoras em retratos profissionais com inteligência artificial. Perfeito para perfis e posts.',
  },
  {
    icon: Shield,
    badge: 'Conformidade',
    title: 'Dentro das Normas',
    description: 'Conteúdos adequados às regulamentações do CFM, CRO, CREFITO e demais conselhos de classe.',
  },
  {
    icon: Palette,
    badge: '3 Variações',
    title: 'Design Automático',
    description: 'Cada post vem em 3 estilos visuais diferentes — fotográfico, tipográfico e gráfico — para você escolher.',
  },
  {
    icon: FileText,
    badge: 'Inteligente',
    title: 'Legendas Prontas',
    description: 'IA gera legendas otimizadas para engajamento com hashtags relevantes para sua especialidade na saúde.',
  },
]

const professionals = [
  { name: 'Médicos', image: '/landing/prof-medico.jpg' },
  { name: 'Dentistas', image: '/landing/prof-dentista.jpg' },
  { name: 'Nutricionistas', image: '/landing/prof-nutricionista.jpg' },
  { name: 'Fisioterapeutas', image: '/landing/prof-fisioterapeuta.jpg' },
  { name: 'Psicólogos', image: '/landing/prof-psicologo.jpg' },
  { name: 'Enfermeiros', image: '/landing/prof-enfermeiro.jpg' },
  { name: 'Farmacêuticos', image: '/landing/prof-farmaceutico.jpg' },
  { name: 'Veterinários', image: '/landing/prof-veterinario.jpg' },
]

const comparisonItems = [
  { item: 'Designer freelancer', traditional: 'R$800–2.000/mês', clinicfeed: false },
  { item: 'Social media manager', traditional: 'R$1.500–4.000/mês', clinicfeed: false },
  { item: 'Banco de imagens', traditional: 'R$50–200/mês', clinicfeed: false },
  { item: 'Ferramentas de design', traditional: 'R$50–100/mês', clinicfeed: false },
  { item: 'Fotos profissionais', traditional: 'R$300–800/sessão', clinicfeed: false },
  { item: 'Posts prontos com IA', traditional: '—', clinicfeed: true },
  { item: 'Foto Pro com IA', traditional: '—', clinicfeed: true },
  { item: 'Legendas otimizadas', traditional: '—', clinicfeed: true },
  { item: 'Dentro das normas do conselho', traditional: '—', clinicfeed: true },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ==================== NAVBAR ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="ClinicFeed" className="h-9 w-9 brightness-0 invert" />
            <span className="text-white font-semibold text-lg hidden sm:inline">ClinicFeed</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-gray-400 hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="text-sm text-gray-400 hover:text-white transition-colors">
              Como funciona
            </a>
            <a href="#precos" className="text-sm text-gray-400 hover:text-white transition-colors">
              Preços
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors px-5 py-2.5 rounded-full"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative bg-[#0a0a1a] pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-emerald-400 text-xs font-medium border border-white/10">
              <Sparkles className="h-3.5 w-3.5" />
              Inteligência Artificial
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-blue-400 text-xs font-medium border border-white/10">
              <Shield className="h-3.5 w-3.5" />
              Dentro das normas
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-purple-400 text-xs font-medium border border-white/10">
              <Camera className="h-3.5 w-3.5" />
              Foto Pro
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
            Marketing digital para{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              profissionais da saúde
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Crie posts, artes e fotos profissionais com IA em minutos.
            Pare de depender de designers e comece a postar conteúdo que atrai pacientes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/register"
              className="flex items-center gap-2 text-base font-semibold text-[#0a0a1a] bg-emerald-400 hover:bg-emerald-300 transition-all px-8 py-4 rounded-full shadow-lg shadow-emerald-400/25"
            >
              Começar agora — é grátis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#como-funciona"
              className="text-base font-medium text-gray-400 hover:text-white transition-colors px-8 py-4"
            >
              Ver como funciona
            </a>
          </div>

          <p className="text-sm text-gray-500">
            Usado por médicos, dentistas, nutricionistas, fisioterapeutas e mais de 15 especialidades
          </p>
        </div>
      </section>

      {/* ==================== FEATURES HERO (3 destaques + ilustração) ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-[#0f0f23]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Suas redes sociais no piloto automático
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Tudo que você precisa para criar conteúdo profissional, sem entender nada de design.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'Posts em segundos',
                description: 'Escolha o tema e a IA gera textos, legendas e artes prontas para postar. 3 variações para você escolher.',
                gradient: 'from-emerald-500/20 to-emerald-500/5',
                iconColor: 'text-emerald-400',
              },
              {
                icon: Camera,
                title: 'Fotos profissionais com IA',
                description: 'Envie uma selfie e receba retratos profissionais gerados por IA. Perfeito para perfil e posts.',
                gradient: 'from-blue-500/20 to-blue-500/5',
                iconColor: 'text-blue-400',
              },
              {
                icon: RefreshCw,
                title: 'Recrie posts existentes',
                description: 'Tem um post do Canva? Envie e nossa IA recria em 3 versões profissionais mantendo sua mensagem.',
                gradient: 'from-purple-500/20 to-purple-500/5',
                iconColor: 'text-purple-400',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`relative bg-gradient-to-b ${feature.gradient} rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group`}
              >
                <div className={`h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-5 ${feature.iconColor}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== O QUE O CLINICFEED FAZ (6 cards) ==================== */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
              Funcionalidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              O que o ClinicFeed faz por você
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Ferramentas poderosas para profissionais da saúde que querem se destacar nas redes sociais.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <feature.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ANTES E DEPOIS ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Veja a transformação
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              De fotos e posts amadores a conteúdo profissional com apenas alguns cliques.
            </p>
          </div>

          {/* Foto Pro - Before/After */}
          <div className="mb-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Camera className="h-5 w-5 text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-900">Foto Pro</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                  <img src="/landing/foto-antes.jpg" alt="Selfie amadora" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center h-full p-8 text-center"><span class="text-6xl mb-4">📱</span><p class="text-gray-500 font-medium">Foto do celular</p><p class="text-gray-400 text-sm mt-1">Selfie comum, iluminação ruim</p></div>'; }} />
                </div>
                <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  ANTES
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-emerald-200 bg-emerald-50">
                  <img src="/landing/foto-depois.jpg" alt="Foto profissional com IA" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center h-full p-8 text-center"><span class="text-6xl mb-4">✨</span><p class="text-gray-800 font-medium">Foto profissional com IA</p><p class="text-gray-500 text-sm mt-1">Retrato profissional, fundo clean</p></div>'; }} />
                </div>
                <div className="absolute -top-3 -left-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  DEPOIS
                </div>
              </div>
            </div>
          </div>

          {/* Recriar Post - Before/After */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-8">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Recriar Post</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                  <img src="/landing/post-antes.jpg" alt="Post amador" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center h-full p-8 text-center"><span class="text-6xl mb-4">📝</span><p class="text-gray-500 font-medium">Post amador</p><p class="text-gray-400 text-sm mt-1">Feito no Canva com template genérico</p></div>'; }} />
                </div>
                <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  ANTES
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-blue-200 bg-blue-50">
                  <img src="/landing/post-depois.jpg" alt="Post profissional recriado" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center h-full p-8 text-center"><span class="text-6xl mb-4">🎨</span><p class="text-gray-800 font-medium">Post recriado com IA</p><p class="text-gray-500 text-sm mt-1">3 variações profissionais da sua arte</p></div>'; }} />
                </div>
                <div className="absolute -top-3 -left-3 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  DEPOIS
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '3x', label: 'mais engajamento' },
              { value: '30%', label: 'mais seguidores' },
              { value: '5seg', label: 'para criar um post' },
              { value: '100%', label: 'dentro das normas' },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== GALERIA DE CONTEÚDO ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a0a1a] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Artes geradas pela nossa IA
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Veja exemplos de posts criados automaticamente para diferentes especialidades da saúde.
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
            {['Todos', 'Medicina', 'Odontologia', 'Nutrição', 'Fisioterapia', 'Psicologia'].map((tab, i) => (
              <span
                key={tab}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  i === 0
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/15'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* Example posts grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { title: 'Cuidados com a pele', color: 'from-rose-400 to-pink-600', emoji: '🧴' },
              { title: 'Alimentação saudável', color: 'from-green-400 to-emerald-600', emoji: '🥗' },
              { title: 'Saúde mental', color: 'from-purple-400 to-indigo-600', emoji: '🧠' },
              { title: 'Exercícios físicos', color: 'from-orange-400 to-red-600', emoji: '🏃' },
              { title: 'Higiene bucal', color: 'from-cyan-400 to-blue-600', emoji: '🦷' },
              { title: 'Prevenção', color: 'from-yellow-400 to-amber-600', emoji: '🛡️' },
              { title: 'Dor nas costas', color: 'from-blue-400 to-indigo-600', emoji: '🏋️' },
              { title: 'Diabetes', color: 'from-teal-400 to-emerald-600', emoji: '💉' },
              { title: 'Ansiedade', color: 'from-violet-400 to-purple-600', emoji: '🧘' },
              { title: 'Check-up', color: 'from-sky-400 to-blue-600', emoji: '🩺' },
              { title: 'Sono saudável', color: 'from-indigo-400 to-violet-600', emoji: '😴' },
              { title: 'Vacinas', color: 'from-emerald-400 to-teal-600', emoji: '💊' },
            ].map((post) => (
              <div
                key={post.title}
                className={`aspect-square rounded-xl bg-gradient-to-br ${post.color} flex flex-col items-center justify-center p-4 text-center hover:scale-105 transition-transform cursor-default`}
              >
                <span className="text-3xl mb-2">{post.emoji}</span>
                <span className="text-white text-xs font-medium leading-tight">{post.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 3 PASSOS SIMPLES ==================== */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
              Simples assim
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              3 passos simples
            </h2>
            <p className="text-lg text-gray-500">
              Sem precisar entender nada de design. Do tema ao post pronto.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Escolha o tema',
                desc: 'Selecione sua especialidade e a IA sugere temas relevantes e atuais para seu público.',
                badge: 'Sugestão inteligente',
                badgeColor: 'bg-emerald-50 text-emerald-700',
              },
              {
                step: '02',
                title: 'Personalize',
                desc: 'Revise o texto, ajuste o tom e escolha se quer incluir sua foto profissional no post.',
                badge: 'Controle total',
                badgeColor: 'bg-blue-50 text-blue-700',
              },
              {
                step: '03',
                title: 'Baixe e publique',
                desc: 'Receba 3 variações de arte profissional. Escolha a melhor e publique nas suas redes.',
                badge: 'Pronto em minutos',
                badgeColor: 'bg-purple-50 text-purple-700',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all h-full">
                  <div className="text-5xl font-bold text-emerald-500/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                  <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PROFISSIONAIS QUE ATENDEMOS ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Feito para profissionais da saúde
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Independente da sua especialidade, o ClinicFeed gera conteúdo personalizado para o seu público.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {professionals.map((prof) => (
              <div
                key={prof.name}
                className="flex-shrink-0 snap-center w-40 sm:w-48"
              >
                <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 mb-3 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all">
                  <img
                    src={prof.image}
                    alt={prof.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                      el.parentElement!.innerHTML = `<div class="text-center p-4"><div class="text-5xl mb-2">${['🩺','🦷','🥗','🏋️','🧠','💉','💊','🐾'][professionals.findIndex(p => p.name === prof.name)]}</div></div>`;
                    }}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 text-center text-sm">
                  {prof.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PROVA SOCIAL ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a0a1a]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-6">
            Powered by Congresse.me
          </p>
          <div className="text-6xl sm:text-7xl font-bold text-white mb-4">
            800.000<span className="text-emerald-400">+</span>
          </div>
          <p className="text-xl text-gray-400 mb-8">
            profissionais da saúde já se atualizaram com a Congresse.me
          </p>
          <div className="w-full max-w-md mx-auto bg-white/10 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full" style={{ width: '80%' }} />
          </div>
          <p className="text-gray-500 text-sm mt-4">
            A ClinicFeed é o braço de marketing digital da maior plataforma de educação em saúde do Brasil
          </p>
        </div>
      </section>

      {/* ==================== COMPARATIVO DE PREÇO ==================== */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Quanto você gasta hoje com marketing?
            </h2>
            <p className="text-base text-gray-500">
              Substitua vários fornecedores por uma única plataforma inteligente.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-100 px-4 py-3">
              <div className="text-xs font-semibold text-gray-600">Serviço</div>
              <div className="text-xs font-semibold text-gray-600 text-center">Tradicional</div>
              <div className="text-xs font-semibold text-emerald-700 text-center">ClinicFeed</div>
            </div>
            {/* Rows */}
            {comparisonItems.map((row, i) => (
              <div key={row.item} className={`grid grid-cols-3 px-4 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="text-xs sm:text-sm text-gray-700">{row.item}</div>
                <div className="text-xs sm:text-sm text-center">
                  {row.traditional === '—' ? (
                    <X className="h-4 w-4 text-gray-300 mx-auto" />
                  ) : (
                    <span className="text-red-500 font-medium">{row.traditional}</span>
                  )}
                </div>
                <div className="text-sm text-center">
                  <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                </div>
              </div>
            ))}
            {/* Total */}
            <div className="grid grid-cols-3 px-4 py-3 bg-emerald-50 border-t-2 border-emerald-200">
              <div className="text-xs sm:text-sm font-bold text-gray-900">Total mensal</div>
              <div className="text-xs sm:text-sm font-bold text-red-600 text-center">R$2.700+/mês</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-700 text-center">A partir de R$49/mês</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PREÇOS ==================== */}
      <section id="precos" className="py-20 px-4 sm:px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
              Planos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Comece com o plano que faz sentido para seu momento. Mude ou cancele quando quiser.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-start max-w-sm sm:max-w-none mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`rounded-2xl p-6 sm:p-8 border-2 transition-all ${
                  plan.highlight
                    ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10 relative'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                    Mais popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    R${plan.price}
                  </span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          plan.highlight ? 'text-emerald-500' : 'text-emerald-500'
                        }`}
                      />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center py-3.5 rounded-full font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DEPOIMENTO ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <blockquote className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed mb-6">
              &ldquo;Eu gastava horas tentando fazer posts bonitos ou pagava caro para um designer.
              Com a ClinicFeed, em 3 minutos tenho tudo pronto, dentro das normas do CFM e com
              design profissional.&rdquo;
            </blockquote>
            <div>
              <p className="font-semibold text-gray-900">Dra. Ana Ribeiro</p>
              <p className="text-gray-500 text-sm">Endocrinologista &bull; CRM 45.123</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#0a0a1a] to-[#1a1a3a] rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-[80px]" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Pronto para transformar suas redes sociais?
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
                Junte-se a milhares de profissionais da saúde que já usam a ClinicFeed para criar
                conteúdo profissional todos os dias.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-base font-semibold text-[#0a0a1a] bg-emerald-400 hover:bg-emerald-300 transition-all px-8 py-4 rounded-full shadow-lg shadow-emerald-400/25"
              >
                Começar agora — é grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-12 px-4 sm:px-6 bg-[#0a0a1a] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="ClinicFeed" className="h-8 w-auto brightness-0 invert" />
              <span className="text-gray-500 text-sm">by Congresse.me</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#funcionalidades" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Funcionalidades
              </a>
              <a href="#como-funciona" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Como funciona
              </a>
              <a href="#precos" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Preços
              </a>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Entrar
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} ClinicFeed. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
