import Link from 'next/link'
import {
  Sparkles,
  Camera,
  Palette,
  Zap,
  Shield,
  Clock,
  Check,
  ArrowRight,
  Instagram,
  MessageCircle,
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
      '16 sugestões de tema',
      '12 abordagens de copy',
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
      '32 sugestões de tema',
      '24 abordagens de copy',
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
      '48 sugestões de tema',
      '36 abordagens de copy',
    ],
    cta: 'Escolher Referência',
    highlight: false,
  },
]

const features = [
  {
    icon: Sparkles,
    title: 'IA Especializada em Saúde',
    description:
      'Textos gerados por inteligência artificial treinada para profissionais da saúde, respeitando as normas do CFM.',
  },
  {
    icon: Palette,
    title: '3 Estilos de Design',
    description:
      'Cada post é gerado em 3 variações visuais (fotográfico, tipográfico e gráfico) para você escolher a melhor.',
  },
  {
    icon: Camera,
    title: 'Foto Pro com IA',
    description:
      'Envie suas fotos e nossa IA gera retratos profissionais para usar nas suas artes e redes sociais.',
  },
  {
    icon: Zap,
    title: 'Pronto em 3 Minutos',
    description:
      'Escolha o tema, personalize os textos e receba suas artes prontas em poucos minutos.',
  },
  {
    icon: Shield,
    title: 'Dentro das Normas',
    description:
      'Conteúdos adequados às regulamentações dos conselhos de classe (CFM, CRO, CREFITO, etc.).',
  },
  {
    icon: Clock,
    title: 'Economize Horas',
    description:
      'Pare de gastar horas pensando em conteúdo ou esperando designers. A Clinify faz tudo por você.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ==================== NAVBAR ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Clinify</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-2.5 rounded-full"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Marketing digital com inteligência artificial
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Posts profissionais para{' '}
            <span className="text-blue-600">profissionais da saúde</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Crie conteúdo para Instagram em minutos. A Clinify gera textos, artes e
            fotos profissionais com IA — tudo dentro das normas do seu conselho.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-8 py-4 rounded-full shadow-lg shadow-blue-600/25"
            >
              Começar agora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#precos"
              className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors px-8 py-4"
            >
              Ver planos e preços
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            Usado por médicos, dentistas, fisioterapeutas e outros profissionais
          </p>
        </div>
      </section>

      {/* ==================== FUNCIONALIDADES ==================== */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tudo o que você precisa para suas redes sociais
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Pare de gastar tempo e dinheiro com designers. A Clinify entrega conteúdo
              profissional em minutos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== COMO FUNCIONA ==================== */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simples como 1, 2, 3
            </h2>
            <p className="text-lg text-gray-500">
              Do tema ao post pronto em poucos minutos.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Escolha o tema',
                desc: 'Selecione uma categoria e a IA sugere temas relevantes para sua especialidade.',
              },
              {
                step: '2',
                title: 'Personalize',
                desc: 'Revise os textos gerados, ajuste o tom e escolha se quer incluir sua foto profissional.',
              },
              {
                step: '3',
                title: 'Baixe e publique',
                desc: 'Receba 3 variações de arte, escolha a melhor e publique direto nas suas redes.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PREÇOS ==================== */}
      <section id="precos" className="py-20 px-4 sm:px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Planos e preços
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Escolha o plano ideal para o tamanho da sua presença digital.
              Cancele quando quiser.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-start max-w-sm sm:max-w-none mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`rounded-2xl p-6 sm:p-8 border-2 transition-all ${
                  plan.highlight
                    ? 'border-blue-600 bg-white shadow-xl shadow-blue-600/10 relative'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
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
                          plan.highlight ? 'text-blue-600' : 'text-green-500'
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
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
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
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="h-6 w-6 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed mb-6">
              &ldquo;Eu gastava horas tentando fazer posts bonitos ou pagava caro para um designer.
              Com a Clinify, em 3 minutos tenho tudo pronto, dentro das normas do CFM e com
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
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pronto para transformar suas redes sociais?
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
              Junte-se a centenas de profissionais da saúde que já usam a Clinify para criar
              conteúdo profissional todos os dias.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-base font-semibold text-blue-600 bg-white hover:bg-blue-50 transition-colors px-8 py-4 rounded-full"
            >
              Criar minha conta grátis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-12 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Clinify</span>
              <span className="text-gray-400 text-sm ml-1">by Congresse.me</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Entrar
              </Link>
              <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Criar conta
              </Link>
              <a href="#precos" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Preços
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Clinify. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
