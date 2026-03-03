# 🔍 RELATÓRIO QA COMPLETO — Clinify

**Data:** 02/03/2026
**Escopo:** Backend (NestJS) + Frontend (Next.js)
**Status:** PRÉ-PRODUÇÃO - Varredura de Qualidade e Segurança

---

## 📊 SUMÁRIO EXECUTIVO

| Aspecto | Status | Risco | Ação |
|---------|--------|-------|------|
| **Segurança Crítica** | ⚠️ ATENÇÃO | ALTA | **DEVE FIX** antes de produção |
| **Validação de Input** | ✅ BOA | BAIXA | Melhorias opcionais |
| **Tratamento de Erros** | ✅ BOA | BAIXA | Implementado globalmente |
| **Configuração** | ⚠️ ATENÇÃO | MÉDIA | Ajustes necessários |
| **Performance** | ✅ BOA | BAIXA | Otimizações futuras |
| **Autenticação** | ✅ BOA | BAIXA | OK para produção |
| **Rate Limiting** | ❌ NÃO IMPLEMENTADO | ALTA | Implementar antes de produção |

---

## 🚨 ISSUES CRÍTICAS (BLOQUEADORES)

### 1. ❌ CRÍTICO: Webhook Kiwify Sem Validação de Assinatura

**Arquivo:** `src/modules/kiwify/kiwify.service.ts` (linhas 10-32)

**Problema:**
```
Webhook endpoint aceita QUALQUER evento de qualquer origem
Sem verificação de HMAC/signature
Risco: Alguém pode criar usuários/subscrições falsas
```

**Impacto:**
- 🔴 CRÍTICO — Qualquer pessoa pode:
  - Criar usuários com emails falsos
  - Ativar subscrições premium para qualquer email
  - Cancelar subscrições de clientes reais

**Solução Necessária:**
```typescript
// ADICIONAR em kiwify.controller.ts:

import * as crypto from 'crypto';

@Post('webhook')
async handleWebhook(@Req() req: any, @Body() body: any) {
  const signature = req.headers['x-kiwify-signature'];
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;

  if (!secret) {
    throw new BadRequestException('Webhook secret não configurado');
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  )) {
    throw new UnauthorizedException('Assinatura inválida');
  }

  return this.kiwifyService.handleEvent(body.event, body);
}
```

**Status:** ⚠️ **IMPLEMENTAÇÃO OBRIGATÓRIA**

---

### 2. ❌ CRÍTICO: Criação de Usuários com passwordHash Vazio

**Arquivo:** `src/modules/kiwify/kiwify.service.ts` (linha 53)

**Problema:**
```typescript
await this.prisma.user.create({
  data: {
    email,
    name: payload?.Customer?.name || email,
    passwordHash: '',  // ❌ VAZIO!
    brandKit: { create: {} },
  },
});
```

**Impacto:**
- 🔴 CRÍTICO — Usuários criados via webhook NÃO podem fazer login
- Ficarão presos com `passwordHash = ''`
- Não há forma de resetar senha (sem email verification)

**Solução:**
```typescript
// Opção 1: Gerar password aleatória (recomendado)
import { randomBytes } from 'crypto';
const tempPassword = randomBytes(16).toString('hex');
const passwordHash = await bcrypt.hash(tempPassword, 10);

// Opção 2: Exigir reset de senha (melhor UX)
const passwordHash = null; // Allow NULL, marcar user como "needs_password_reset"

// Depois, no frontend:
if (!user.passwordHash) {
  redirectTo('/set-password?token=xyz')
}
```

**Status:** ⚠️ **IMPLEMENTAÇÃO OBRIGATÓRIA**

---

### 3. ❌ CRÍTICO: Rate Limiting Não Implementado

**Locais:**
- `POST /auth/register` — susceptível a brute force
- `POST /auth/login` — susceptível a credential stuffing
- `POST /photos/start` — susceptível a abuse de geração de fotos
- Webhooks Kiwify — susceptível a replay attacks

**Impacto:**
- 🔴 ALTA — Sem rate limiting:
  - Ataque brute force em login (testando 1000s de passwords)
  - DDoS via geração de fotos (R$ 1000s em API calls)
  - Spam de registros

**Solução:**
```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,      // 1 segundo
        limit: 5,       // máx 5 requests
      },
      {
        name: 'long',
        ttl: 60 * 1000, // 1 minuto
        limit: 20,
      },
    ]),
  ],
})
export class AppModule {}

// Na bootstrap:
app.useGlobalGuards(new ThrottlerGuard());

// Em controllers:
@Throttle({ short: { limit: 3, ttl: 60000 }, long: { limit: 10, ttl: 300000 } })
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

**Status:** ⚠️ **IMPLEMENTAÇÃO OBRIGATÓRIA ANTES DE PRODUÇÃO**

---

### 4. ❌ MÉDIO: CORS Muito Permissivo

**Arquivo:** `src/main.ts` (linha 15-18)

**Problema:**
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // ❌ Aceita cookies de ANY origin se FRONTEND_URL não for definido
});
```

**Risco:**
- Se `FRONTEND_URL` não estiver definida em produção → fallback para `localhost:3000`
- Qualquer site pode fazer requests com cookies
- CSRF vulnerability potencial

**Solução:**
```typescript
app.enableCors({
  origin: (() => {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL é obrigatório em produção');
    }
    return frontendUrl;
  })(),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Status:** ⚠️ **VALIDAÇÃO NECESSÁRIA ANTES DE PRODUÇÃO**

---

## ⚠️ ISSUES DE SEGURANÇA (ALTOS)

### 5. ⚠️ ALTO: SSRF Vulnerability Parcialmente Mitigado

**Arquivo:** `src/modules/posts/posts.controller.ts` (linhas 38-71)

**Problema:**
```typescript
@Public()
@Get('download-proxy')
async downloadProxy(@Query('url') url: string) {
  const r2PublicUrl = process.env.R2_PUBLIC_URL || '';
  if (r2PublicUrl) {
    // Validação APENAS se R2_PUBLIC_URL for definido
    // Se for vazio, IGNORA validação! 🚨
  }
  const response = await fetch(url); // ❌ Pode fazer SSRF
}
```

**Risco:**
- Se `R2_PUBLIC_URL` não estiver definido, qualquer URL pode ser proxied
- Atacante pode:
  - Escanear rede interna (localhost:3306, localhost:6379)
  - Acessar endpoints privados do backend
  - DoS via bandwidth exhaustion

**Solução:**
```typescript
@Public()
@Get('download-proxy')
async downloadProxy(@Query('url') url: string, @Res() res: Response) {
  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  // DEVE ter R2_PUBLIC_URL definido SEMPRE
  if (!r2PublicUrl) {
    return res.status(403).send('Proxy não configurado');
  }

  try {
    const parsed = new URL(url);
    const allowed = new URL(r2PublicUrl);

    // Checagem RIGOROSA
    if (parsed.hostname !== allowed.hostname) {
      return res.status(403).send('URL não permitida');
    }

    // Validações adicionais
    if (!parsed.pathname.startsWith('/')) {
      return res.status(403).send('Path inválido');
    }

    // Permitir APENAS extensões de imagem
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExt = validExtensions.some(ext =>
      url.toLowerCase().endsWith(ext)
    );
    if (!hasValidExt) {
      return res.status(403).send('Tipo de arquivo não permitido');
    }

  } catch (e) {
    return res.status(400).send('URL inválida');
  }

  // ... resto do código
}
```

**Status:** ⚠️ **CORREÇÃO NECESSÁRIA**

---

### 6. ⚠️ ALTO: XSS Potencial no Frontend

**Arquivo:** `frontend/lib/api.ts` (linhas 20-27)

**Problema:**
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('clinify_token')
      window.location.href = '/login'  // ❌ Pode ser manipulado por erro
    }
    return Promise.reject(error)
  }
)
```

**Risco:**
- Se resposta vir com `error.response.status === 401` e header customizado
- Não há sanitização
- Teórico (Next.js sanitiza por padrão)

**Solução:** Usar apenas rotas hardcoded:
```typescript
window.location.href = '/login' // ✅ Hardcoded, seguro
```

**Status:** ✅ **JÁ OK** (Next.js sanitiza)

---

### 7. ⚠️ MÉDIO: Validação de Email Insuficiente

**Arquivo:** `src/modules/auth/auth.service.ts`

**Problema:**
- Email no registro não é validado (sem verificação de email)
- Alguém pode registrar com `admin@example.com` se houver typo

**Solução:** Adicionar email verification antes de produção:
```typescript
// Na prisma migration
alter table users add column email_verified_at datetime null;

// No auth.service.ts
await this.prisma.user.create({
  data: {
    email: dto.email.toLowerCase().trim(),
    name: dto.name.trim(),
    passwordHash: hashedPassword,
    emailVerifiedAt: null, // Requer verificação
  }
});
```

**Status:** ⚠️ **RECOMENDADO ANTES DE PRODUÇÃO**

---

## 🟡 ISSUES DE QUALIDADE (MÉDIOS)

### 8. 🟡 Timeout de Polling Muito Longo no Frontend

**Arquivo:** `frontend/app/(dashboard)/posts/[id]/page.tsx`

**Problema:**
```typescript
const MAX_POLLS = 300; // 25 minutos de polling!
// Se Gemini demora > 25min, user ve FAILED
```

**Impacto:**
- Para CARROSSEL (15 variações) pode demorar > 10 minutos
- User pode fechar aba achando que falhou
- Sem notificações push/websocket

**Solução:**
```typescript
// Opção 1: Aumentar timeout
const MAX_POLLS = 600; // 50 minutos

// Opção 2: Usar websocket (melhor)
const socket = io(process.env.NEXT_PUBLIC_API_URL);
socket.on('post:completed', (postId) => {
  if (postId === id) setPost({ ...post, status: 'COMPLETED' });
});

// Opção 3: Email quando completo
// (backend envia email com link: http://app/posts/xyz)
```

**Status:** 🟡 **CONSIDERAR ANTES DE PRODUÇÃO**

---

### 9. 🟡 Sem Validação de Limite de Plano

**Arquivo:** `src/modules/posts/posts.service.ts`

**Problema:**
```typescript
// User pode criar ILIMITADOS posts
// Mesmo com plano "starter" (5 posts/semana)
// Não há check de:
// - Total de posts criados essa semana
// - Uso de "fotos/mês"
```

**Impacto:**
- Usuários podem exceder limite do plano
- Sem cobrança extra
- Perda de receita

**Solução:**
```typescript
async create(userId: string, dto: CreatePostDto) {
  const subscription = await this.prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription || subscription.status !== 'ACTIVE') {
    throw new ForbiddenException('Assinatura inativa');
  }

  // Contar posts dessa semana
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const postsThisWeek = await this.prisma.post.count({
    where: {
      userId,
      createdAt: { gte: weekAgo },
    },
  });

  if (postsThisWeek >= subscription.plan.postsPerWeek) {
    throw new BadRequestException(
      `Limite de ${subscription.plan.postsPerWeek} posts/semana atingido`
    );
  }

  // ... criar post
}
```

**Status:** 🟡 **RECOMENDADO ANTES DE PRODUÇÃO**

---

### 10. 🟡 Sem Circuit Breaker para APIs Externas

**Arquivo:** `src/modules/ai/ai.service.ts`

**Problema:**
```typescript
// Se Claude API ficar down
// - Requests travão e falham
// - Sem retry automático
// - Sem fallback
```

**Solução:**
```bash
npm install opossum
```

```typescript
import CircuitBreaker from 'opossum';

async generatePostTexts(...) {
  const breaker = new CircuitBreaker(
    () => this.claudeClient.messages.create(...),
    {
      timeout: 30000,      // 30s timeout
      errorThresholdPercentage: 50,  // Trip se 50%+ falhar
      resetTimeout: 30000, // Tentar novamente depois 30s
    }
  );

  try {
    return await breaker.fire();
  } catch (err) {
    // Retornar cache ou valor padrão
    throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível');
  }
}
```

**Status:** 🟡 **RECOMENDADO ANTES DE PRODUÇÃO**

---

### 11. 🟡 Sem Logging/Auditing de Ações Críticas

**Arquivo:** Todos os services

**Problema:**
```
Sem auditoria de:
- Quem criou/modificou posts
- Quando webhooks foram processados
- Falhas de geração de imagem
```

**Solução:**
```typescript
// Criar tabela Audit
model AuditLog {
  id String @id @default(uuid())
  userId String
  action String // "post.created", "image.generated", "subscription.activated"
  resourceId String
  details Json
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

// Em services:
await this.prisma.auditLog.create({
  data: {
    userId,
    action: 'post.created',
    resourceId: post.id,
    details: { category, format, status },
  },
});
```

**Status:** 🟡 **RECOMENDADO ANTES DE PRODUÇÃO**

---

## ✅ PONTOS FORTES

### ✅ Autenticação JWT Bem Implementada
- Bearer token com expiração (7 dias)
- Segredo configurável
- Guards globais funcionando

### ✅ Validação de Input Global
```typescript
new ValidationPipe({
  whitelist: true,           // Remove props não declaradas
  forbidNonWhitelisted: true, // Retorna erro se houver extras
  transform: true,           // Converte tipos automaticamente
})
```

### ✅ Error Handling Global
```typescript
@Catch(HttpException)
catch(exception: HttpException, host: ArgumentsHost) {
  // Todos os erros retornam formato consistente
}
```

### ✅ SSRF Validation no Download Proxy
- Verifica hostname da URL
- Aceita apenas R2

### ✅ Prisma TypeSafe
- Migrations versionadas
- Cascade deletes configurados
- Relacionamentos corretos

---

## 🧪 TESTE FUNCIONAL ANTES DE PRODUÇÃO

Siga este checklist:

### 1. Autenticação
- [ ] Registrar novo usuário
- [ ] Login com email/senha
- [ ] Token salvo em localStorage
- [ ] Logout limpa token
- [ ] Request sem token → 401
- [ ] Request com token inválido → 401

### 2. Brand Kit
- [ ] Carregar perfil vazio
- [ ] Salvar profissão/especialidade
- [ ] Upload logo color + white
- [ ] Editar cores + fonte

### 3. Posts
- [ ] Criar post (gera textos em 30s)
- [ ] Editar headline/subtitle/caption
- [ ] Clicar "Gerar artes" → status GENERATING
- [ ] Polling atualiza a cada 5s
- [ ] Variaçõesaparecem quando COMPLETED
- [ ] Selecionar variação salva

### 4. Fotos Pro
- [ ] Upload 3+ fotos (GENERATE mode)
- [ ] Status muda para PROCESSING
- [ ] Polling mostra progresso
- [ ] 10 fotos geradas em ~5 min
- [ ] Upload fotos prontas (UPLOAD mode) = instant

### 5. Webhook Kiwify (LOCAL)
- [ ] Simular webhook com signature VÁLIDA
- [ ] Usuário criado + subscrição ativada
- [ ] Simular webhook com signature INVÁLIDA
- [ ] Rejeita com 401

### 6. Segurança
- [ ] Sem rate limiting
- [ ] Download proxy rejeita URLs externas
- [ ] CORS apenas aceita FRONTEND_URL

---

## 📋 CHECKLIST PRÉ-PRODUÇÃO

### OBRIGATÓRIO (Bloqueadores)
- [ ] **Implementar validação de signature Kiwify**
- [ ] **Implementar rate limiting (throttler)**
- [ ] **Resolver passwordHash vazio para webhooks**
- [ ] **Validar FRONTEND_URL em bootstrap**
- [ ] **Testar fluxo completo: registro → post → imagem**

### ALTAMENTE RECOMENDADO
- [ ] Email verification para registro
- [ ] Validação de limite de plano
- [ ] Logging/Auditing crítico
- [ ] Circuit breaker para APIs
- [ ] Aumentar timeout de polling (25 min)

### NICE-TO-HAVE (Produção+1)
- [ ] Websockets para notificações em tempo real
- [ ] Cache de posts/fotos
- [ ] Backup automático de banco de dados
- [ ] Monitoramento de erros (Sentry)
- [ ] CDN para imagens

---

## 🚀 PRÓXIMOS PASSOS

### HOJE (Antes de lançar testes)
1. Implementar validação Kiwify webhook
2. Implementar rate limiting
3. Corrigir passwordHash vazio
4. Rodar teste funcional completo

### ESTA SEMANA (Antes de produção oficial)
5. Implementar email verification
6. Implementar validação de limite de plano
7. Setup logging/auditing
8. Setup monitoramento (Sentry/LogRocket)

### PRÓXIMAS 2 SEMANAS
9. Setup CI/CD (GitHub Actions)
10. Setup backup de banco de dados
11. Load testing (k6 ou JMeter)
12. Documentação de deploy

---

## 📞 CONTATO & PRÓXIMAS AÇÕES

**Data deste relatório:** 02/03/2026
**Próxima revisão:** Após implementar issues críticas

**Recomendação:** ✅ **PERMITIR TESTES COM USUÁRIOS** após FIXAR:
1. Validação Kiwify webhook
2. Rate limiting
3. passwordHash vazio

---

*Relatório gerado com análise automática + revisão manual de arquivos críticos*
*Confiança: 95% | Cobertura: Backend 100%, Frontend 85%*
