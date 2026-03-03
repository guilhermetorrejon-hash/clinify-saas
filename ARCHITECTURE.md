# ARCHITECTURE.md — Clinify

**Versão:** 1.0.0
**Data:** 24/02/2026
**Status:** Aprovada

---

## 1. Visão Geral do Sistema

Clinify é um SaaS que permite a profissionais da saúde criar posts profissionais para redes sociais em minutos, usando IA. A plataforma gera legendas e artes visuais respeitando as normas dos conselhos profissionais (CFM, CFP, CFN, COFEN, CFO, CFF) e os padrões estéticos adequados para a área de saúde.

### Componentes principais

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO (browser/mobile)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│              FRONTEND — Next.js 16 (App Router)                  │
│              Vercel Edge  •  porta 3000 (dev)                    │
│  - Landing page (SEO / conversão)                                │
│  - Dashboard autenticado (NextAuth v5)                           │
│  - Wizard de criação de post                                     │
│  - Upload de fotos                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST  /api/*
┌────────────────────────────▼────────────────────────────────────┐
│              BACKEND — NestJS  •  porta 3001 (dev)               │
│              Módulos: auth | users | brand-kit | plans           │
│                       subscriptions | posts | photos             │
│                       kiwify | ai | storage                      │
└───────┬───────────────────────────────────┬─────────────────────┘
        │ Prisma ORM                         │ BullMQ
┌───────▼───────┐                  ┌────────▼────────┐
│  PostgreSQL   │                  │     Redis        │
│  (dados app)  │                  │  (filas de jobs) │
└───────────────┘                  └────────┬─────────┘
                                            │ Worker
                                   ┌────────▼────────┐
                                   │  Workers NestJS  │
                                   │  - TranscribeJob │
                                   │  - GeneratePost  │
                                   │  - GeneratePhoto │
                                   └────────┬─────────┘
                                            │
                    ┌───────────────────────┼────────────────────┐
                    │                       │                     │
          ┌─────────▼──────┐    ┌──────────▼──────┐   ┌─────────▼──────┐
          │  Anthropic API  │    │  Google Gemini  │   │   fal.ai (Flux) │
          │  (Claude — copy)│    │  (Nanobanana    │   │  (fotos profis.)│
          │                 │    │   — arte visual)│   │                 │
          └─────────────────┘    └─────────────────┘   └─────────────────┘
                                            │
                                   ┌────────▼────────┐
                                   │  Cloudflare R2   │
                                   │  (armazenamento  │
                                   │   de imagens)    │
                                   └─────────────────┘
```

---

## 2. Por que NestJS + Next.js separados

| Critério | Solução adotada | Alternativa rejeitada |
|----------|----------------|----------------------|
| Workers de longa duração | NestJS roda Node.js contínuo — ideal para workers BullMQ | Next.js API routes têm timeout curto no Vercel (30s) |
| Escala independente | Backend pode escalar horizontalmente sem redeployar o frontend | Monolito full-stack não permite escalar camadas separadamente |
| Swagger / OpenAPI | NestJS tem `@nestjs/swagger` nativo — gera docs automáticos | Next.js não tem geração automática de OpenAPI |
| DI e modularidade | NestJS usa injeção de dependência, facilitando testes e mocks | Next.js API routes são funções simples sem contêiner de DI |
| Validação centralizada | `class-validator` + pipes globais validam todos os DTOs | Precisaria reescrever validação por rota no Next.js |

---

## 3. Padrão de Comunicação

```
Frontend (Next.js)  ──REST──►  Backend (NestJS)
  porta 3000                    porta 3001

Headers obrigatórios:
  Authorization: Bearer <JWT>
  Content-Type: application/json

Prefixo de rotas: /api/v1/
Versioning: URI versioning (v1, v2...)
```

Exemplo de chamada do frontend:
```typescript
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts`,
  { theme, category, format },
  { headers: { Authorization: `Bearer ${session.accessToken}` } }
)
```

---

## 4. Fluxo de Criação de Post

```
USUÁRIO                FRONTEND              BACKEND              WORKERS / AI
   │                      │                     │                     │
   │── digita tema ──────►│                     │                     │
   │── seleciona cat. ───►│                     │                     │
   │── seleciona formato ►│                     │                     │
   │                      │── POST /posts ─────►│                     │
   │                      │                     │── cria Post (DRAFT) │
   │                      │                     │── enfileira job ───►│
   │                      │◄── { postId, status: GENERATING } ──────  │
   │◄── "gerando..." ─────│                     │                     │
   │                      │                     │                     │── Claude API (caption)
   │                      │                     │                     │── Gemini (3 variações)
   │                      │                     │                     │── salva no R2
   │                      │                     │◄── job complete ────│
   │                      │                     │── atualiza Post (COMPLETED)
   │                      │── GET /posts/:id ──►│                     │
   │                      │◄── { variations[] } │                     │
   │◄── exibe variações ──│                     │                     │
   │── escolhe variação ──►│                    │                     │
   │                      │── POST /posts/:id/select ──►│             │
   │◄── "download pronto" ─│                    │                     │
```

---

## 5. Decisões de Banco de Dados

### Por que PostgreSQL + Prisma

- **ACID compliance:** transações críticas (criação de assinatura, débito de cota)
- **Prisma ORM:** type-safety total com TypeScript, migrações versionadas, Prisma Studio para inspeção
- **Arrays nativos:** campo `originalPhotoUrls String[]` aproveita array nativo do Postgres
- **JSONB:** campo `payload Json` no modelo `KiwifyEvent` usa JSONB para queries eficientes

### Connection Pooling para escala

Para suportar 1MM+ usuários sem esgotamento de conexões:

```
App (múltiplos pods) → PgBouncer / Prisma Accelerate → PostgreSQL
```

- No desenvolvimento: conexão direta via `DATABASE_URL`
- Em produção: `DATABASE_URL` aponta para PgBouncer em modo transaction pooling

### Índices importantes (a adicionar em migrations futuras)

```sql
CREATE INDEX idx_posts_user_id       ON posts(user_id);
CREATE INDEX idx_posts_status        ON posts(status);
CREATE INDEX idx_subscriptions_user  ON subscriptions(user_id);
CREATE INDEX idx_kiwify_events_type  ON kiwify_events(event_type);
```

---

## 6. Estratégia de Filas Assíncronas (BullMQ + Redis)

### Por que assíncrono

Geração de imagem com Flux/fal.ai pode levar 15-90 segundos. Rodar isso de forma síncrona bloquearia a requisição HTTP e causaria timeout.

### Estrutura das filas

```
Queue: post-generation
  Job: generate-post
    data: { postId, userId, theme, category, format, brandKit }
    steps:
      1. Gerar caption via Claude API
      2. Gerar 3 variações de arte via Gemini (Nanobanana)
      3. Upload de cada arte para R2
      4. Criar PostVariation no banco para cada arte
      5. Atualizar Post.status = COMPLETED

Queue: photo-generation
  Job: generate-photo
    data: { photoId, userId, originalPhotoUrls, style }
    steps:
      1. Download das fotos originais do R2
      2. Fine-tune / inference via fal.ai Flux
      3. Upload da foto gerada para R2
      4. Atualizar ProfessionalPhoto.status = COMPLETED

Queue: email-notification
  Job: send-email
    data: { userId, type, payload }
```

### Configuração de retry e dead letter

```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
}
```

Falhas após 3 tentativas → `Post.status = FAILED`, usuário notificado por email, cota não é debitada.

---

## 7. Autenticação

```
Registro ──► POST /api/v1/auth/register
              bcryptjs hash da senha
              cria User + Subscription (via webhook Kiwify)

Login ──────► POST /api/v1/auth/login
              valida email + senha
              retorna JWT (7 dias de validade)

JWT payload:
  { sub: userId, email, role, planSlug }

Guards NestJS:
  JwtAuthGuard     → protege rotas autenticadas
  RolesGuard       → protege rotas ADMIN
  ThrottlerGuard   → rate limiting global (100 req/min por IP)
```

O frontend usa NextAuth v5 com `credentials` provider apontando para `POST /api/v1/auth/login`, armazenando o JWT como `accessToken` na sessão.

---

## 8. Integração Kiwify

```
Kiwify ──── POST /api/v1/kiwify/webhook ──► Backend
                                              │
                                              ├── valida HMAC (KIWIFY_WEBHOOK_SECRET)
                                              ├── persiste KiwifyEvent
                                              └── processa por eventType:
                                                    order.approved  → cria/ativa Subscription
                                                    order.refunded  → cancela Subscription
                                                    order.chargebacked → suspende Subscription
```

---

## 9. Armazenamento de Arquivos (Cloudflare R2)

```
Uploads do usuário:
  r2://clinify-uploads/users/{userId}/originals/{uuid}.jpg

Fotos geradas pela IA:
  r2://clinify-uploads/users/{userId}/photos/{uuid}.jpg

Artes de posts geradas:
  r2://clinify-uploads/users/{userId}/posts/{postId}/{variationId}.png

URLs públicas via CDN:
  https://{R2_PUBLIC_URL}/users/{userId}/posts/{postId}/{variationId}.png
```

Presigned URLs são geradas pelo backend para upload direto do cliente sem passar pela API.

---

## 10. Considerações de Escala (1MM+ usuários)

| Camada | Estratégia |
|--------|-----------|
| Frontend | Vercel Edge — CDN global automático, ISR para landing page |
| Backend | Containers horizontais stateless (Fly.io / Railway / ECS) |
| DB connections | PgBouncer transaction pooling — ~100 conexões reais para N pods |
| Filas | Redis Cluster — workers escaláveis independentemente |
| Storage | R2 sem egress fees — CDN integrado |
| Rate limiting | ThrottlerGuard por IP + por userId (cotas de plano) |
| Observabilidade | OpenTelemetry → Grafana / Datadog |
| Cache | Redis para session e cache de brand-kit (TTL 5min) |

### Estimativa de capacidade

- 1MM usuários × 20% MAU × 3 posts/semana = ~600k jobs/semana = ~86k jobs/dia
- Pico: ~5k jobs/hora → 3-5 workers paralelos conseguem processar sem fila
- Cada worker consome ~200MB RAM → escala econômica

---

## 11. Estrutura de Pastas

```
Ia-profissionais-saude/
├── PRD.md
├── ARCHITECTURE.md          ← este arquivo
├── docker-compose.yml       ← Postgres + Redis para desenvolvimento local
│
├── frontend/                ← Next.js 16 (App Router)
│   ├── app/
│   │   ├── (marketing)/     ← landing page pública
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── cadastro/
│   │   └── (dashboard)/     ← área autenticada
│   │       ├── dashboard/
│   │       ├── posts/novo/
│   │       ├── perfil/
│   │       └── fotos/
│   ├── components/
│   │   ├── ui/              ← Shadcn/ui base components
│   │   ├── marketing/       ← Hero, Pricing, Testimonials, etc.
│   │   ├── dashboard/       ← Sidebar, Header, QuotaBar, etc.
│   │   └── posts/           ← PostWizard, PostCard, VariationPicker, etc.
│   ├── lib/                 ← utils, auth config, api client
│   ├── hooks/               ← custom React hooks
│   └── types/               ← TypeScript types compartilhados
│
└── backend/                 ← NestJS
    └── src/
        ├── modules/
        │   ├── auth/        ← JWT, login, register
        │   ├── users/       ← CRUD de usuários
        │   ├── brand-kit/   ← perfil profissional
        │   ├── plans/       ← planos de assinatura
        │   ├── subscriptions/ ← status de assinatura
        │   ├── posts/       ← criação e listagem de posts
        │   ├── photos/      ← fotos profissionais
        │   ├── kiwify/      ← webhook de pagamento
        │   ├── ai/          ← orquestração Claude + Gemini + fal.ai
        │   └── storage/     ← Cloudflare R2
        ├── common/
        │   ├── decorators/  ← @CurrentUser, @Public, etc.
        │   ├── filters/     ← GlobalExceptionFilter
        │   ├── guards/      ← JwtAuthGuard, RolesGuard
        │   ├── interceptors/ ← LoggingInterceptor, TransformInterceptor
        │   └── pipes/       ← ValidationPipe global
        ├── database/        ← PrismaService (singleton)
        ├── queues/          ← BullMQ producers e consumers
        └── config/          ← ConfigModule (variáveis de ambiente tipadas)
```
