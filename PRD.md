# PRD — Clinify

**Produto:** Clinify
**Empresa:** Congresse.me
**Status:** Aprovado
**Data:** 24/02/2026

---

## 1. Visão Geral

Plataforma SaaS que permite a profissionais da saúde criar posts profissionais para redes sociais em minutos, usando IA. O profissional informa o tema do post e a plataforma gera automaticamente a legenda e a arte visual, respeitando as regras dos conselhos de cada área (CFM, CFP, CFN, COFEN, etc.) e os padrões estéticos que funcionam para a saúde.

Como diferencial adicional, a IA gera fotos profissionais do próprio profissional (estilo estúdio com jaleco) a partir de fotos amadoras enviadas por ele — benefício exclusivo incluso nos planos.

**Posicionamento:** "Seu conteúdo profissional prescrito por IA."

---

## 2. Problema

Profissionais da saúde precisam manter presença digital constante, mas não têm tempo, habilidade em design nem conhecimento de marketing. O resultado são posts amadores, inconsistentes ou que violam as normas dos conselhos profissionais — o que pode gerar advertências éticas.

---

## 3. Usuários-alvo

| Profissão | Conselho | Restrição principal |
|-----------|----------|-------------------|
| Médicos | CFM | Proibido prometer cura, obrigatório CRM |
| Nutricionistas | CFN | Proibido prometer emagrecimento com número, obrigatório CRN |
| Psicólogos | CFP | Proibido autopromoção excessiva, obrigatório CRP |
| Enfermeiros | COFEN | Proibido título não reconhecido, obrigatório COREN |
| Dentistas | CFO | Proibido antes/depois, obrigatório CRO |
| Farmacêuticos | CFF | Obrigatório CRF |

**Nível técnico:** baixo em design e marketing. Alto em conteúdo clínico.
**Contexto de uso:** mobile e desktop, entre atendimentos ou no fim do dia.

---

## 4. Diferencial Competitivo

- **Compliance por conselho:** a IA conhece o que cada conselho permite e proíbe
- **Elementos obrigatórios automáticos:** número de registro sempre presente na arte
- **Templates validados para saúde:** visuais que funcionam para esse público
- **Fotos profissionais com IA:** transforma fotos amadoras em fotos de estúdio com jaleco
- **Congresse.me:** 1MM+ de profissionais da saúde já na base

---

## 5. Funcionalidades

### MVP — obrigatório para lançar

#### Onboarding e Perfil do Profissional (Brand Kit)
- [ ] Cadastro via e-mail/senha, ativado por webhook da Kiwify após pagamento
- [ ] Seleção de profissão e especialidade no primeiro acesso
- [ ] Configuração do Brand Kit:
  - Nome completo e nome profissional
  - Profissão e especialidade
  - Número de registro (CRM, CRN, CRP, COREN, CRO, CRF)
  - Bio / tagline
  - Cores preferidas da marca (paleta)
  - Upload de logotipo
  - Foto de perfil
  - Arroba do Instagram
- [ ] Brand Kit alimenta automaticamente o prompt da IA (logo, cores, registro)

#### Fotos Profissionais com IA
- [ ] Upload de 8-15 fotos pessoais (orientação em tela para melhores resultados)
- [ ] IA gera fotos em estilos: estúdio com jaleco, consultório, fundo neutro
- [ ] Fotos salvas na biblioteca do perfil
- [ ] Fotos disponíveis para compor variações de arte nos posts
- [ ] Cota por plano: Starter 4 fotos | Pro 6 fotos | Expert 8 fotos por mês

#### Criação de Post
- [ ] Entrada do tema em linguagem natural (ex: "dicas de hidratação no verão")
- [ ] Seleção de categoria:
  - Conteúdo Educativo
  - Dica de Saúde
  - Institucional
  - Motivacional
  - Criativo para Anúncio
- [ ] Seleção de formato: Feed (1:1), Stories (9:16), Carrossel
- [ ] IA gera legenda respeitando as normas do conselho da área
- [ ] IA gera 2-3 variações de arte com estilos visuais diferentes para o profissional escolher
- [ ] Uma das variações pode incluir foto profissional do usuário (se gerada)

#### Editor Simples (ajuste fino)
- [ ] Edição de texto dentro da arte
- [ ] Troca de fonte
- [ ] Troca de cor da fonte
- [ ] Preview em tempo real

#### Gestão
- [ ] Histórico de posts criados
- [ ] Download da arte em alta resolução
- [ ] Reuso e variação de posts anteriores

#### Planos e Limites
- [ ] 3 planos com cota semanal de posts
- [ ] Painel com cota utilizada vs. disponível

| Plano | Posts/semana | Fotos profissionais/mês | Preço sugerido |
|-------|-------------|------------------------|---------------|
| Starter | 2 | 4 fotos | R$ 47/mês |
| Pro | 3 | 6 fotos | R$ 97/mês |
| Expert | 4 | 8 fotos | R$ 197/mês |

#### Landing Page
- [ ] Página de vendas completa com seções e copy persuasiva
- [ ] Integração com checkout da Kiwify (botões de compra por plano)
- [ ] Webhook da Kiwify para ativar acesso após pagamento confirmado

---

### Fase 2 — pós-MVP

- [ ] Publicação direta no Instagram (via Meta API)
- [ ] Agendamento de posts
- [ ] Calendário editorial semanal sugerido pela IA
- [ ] Integração com Google Meu Negócio (posts locais)
- [ ] Área de membros com acesso ao acervo de cursos da Congresse.me (Kiwify)
- [ ] Editor visual mais completo (estilo Canva lite)
- [ ] Vídeos curtos / Reels com IA

---

## 6. Fora do Escopo (MVP)

- Publicação direta em redes sociais
- Agendamento de posts
- Google Meu Negócio
- Área de membros / cursos
- Editor avançado de imagem
- Vídeos ou Reels
- App mobile nativo

---

## 7. Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend + API | Next.js 14 (App Router) | Full-stack, SEO, performance |
| Banco de dados | PostgreSQL + Prisma | Robusto, relacional, tipado |
| Connection pool | Prisma Accelerate / PgBouncer | Escala para 1MM+ usuários |
| Autenticação | NextAuth v5 | JWT, sessões seguras |
| Geração de texto | Claude API (Anthropic) | Melhor para copy em português |
| Geração de arte | Nanobanana (Gemini Image API) | Custo-benefício, integração simples |
| Fotos profissionais | Flux via fal.ai | Fine-tuning facial, qualidade superior |
| Fila de jobs | BullMQ + Redis | Geração assíncrona sem bloquear UI |
| Armazenamento | Cloudflare R2 + CDN | Barato, performático |
| Pagamento | Kiwify (webhook) | Já usam na Congresse.me |
| Hospedagem | Vercel | Edge, escala automática |
| Design system | Tailwind CSS + Shadcn/ui | Moderno, acessível, produtivo |

---

## 8. Arquitetura para Escala

- Geração de imagem via fila assíncrona (BullMQ + Redis) — usuário não espera na tela
- Rate limiting por plano no nível da API
- CDN Cloudflare para entrega de imagens geradas
- Connection pooling no PostgreSQL para suportar picos de acesso
- Código modular: separação clara entre API routes, workers e frontend

---

## 9. Design

- **Estilo:** Moderno, limpo e elegante — transmite credibilidade e saúde
- **Paleta:** Branco/off-white + azul confiança ou verde-saúde + accent dourado
- **Tipografia:** Sem serifa, profissional (Inter, Plus Jakarta Sans)
- **Tom:** Ferramenta de colega especialista, não de agência de marketing
- **Público:** Profissional exigente que valoriza credibilidade

---

## 10. Compliance por Conselho (a pesquisar)

Pesquisar resoluções específicas de:
- [ ] CFM — Resolução CFM nº 1.974/2011 e atualizações
- [ ] CFP — Resolução CFP nº 01/2009 e atualizações
- [ ] CFN — Resolução CFN nº 600/2018 e atualizações
- [ ] COFEN — Resoluções sobre publicidade em enfermagem
- [ ] CFO — Código de Ética Odontológica (publicidade)
- [ ] CFF — Resoluções sobre publicidade farmacêutica

---

## 11. Estimativa de Custo por Usuário/Mês

| Item | Starter | Pro | Expert |
|------|---------|-----|--------|
| Geração de arte (Nanobanana ×3 variações) | ~R$2,90 | ~R$4,30 | ~R$5,70 |
| Fotos profissionais (Flux/fal.ai) | ~R$2,40 | ~R$3,60 | ~R$4,80 |
| Geração de texto (Claude API) | ~R$1,80 | ~R$1,80 | ~R$1,80 |
| Infra (Vercel, R2, Redis, DB) | ~R$2,00 | ~R$2,00 | ~R$2,00 |
| **Total estimado** | **~R$9** | **~R$12** | **~R$14** |
| **Preço do plano** | **R$47** | **R$97** | **R$197** |
| **Margem bruta estimada** | **~81%** | **~88%** | **~93%** |

*Custos são estimativas e devem ser validados em produção.*

---

## 12. Critérios de Sucesso do MVP

- Profissional cria um post completo (legenda + arte) em menos de 3 minutos
- Arte gerada não viola nenhuma regra do conselho da área selecionada
- Foto profissional gerada é aprovada pelo usuário sem rejeição (taxa > 70%)
- Taxa de download > 70% dos posts gerados
- Landing page converte visitantes em assinantes (benchmark: 3-5%)
