# 🚂 Configuração Railway — Guia Completo

## Pré-requisitos

✅ Railway CLI instalado (`brew install railway`)
✅ Conta GitHub com repositório clinify-saas criado
✅ Variáveis de ambiente preparadas

---

## PASSO 1: Autenticar com Railway

```bash
railway login
```

Isso abrirá seu navegador. Faça login com sua conta Railway (crie uma se não tiver em https://railway.app).

**Após autenticar,** volte ao terminal e prossiga.

---

## PASSO 2: Criar Projeto Railway

```bash
cd /Users/guilhermetorrejon/Ia-profissionais-saude
railway init
```

Responda as perguntas:
- **Project name:** `clinify-saas`
- **Environment:** `production`

Isso cria um arquivo `.railway/config.json` no seu projeto.

---

## PASSO 3: Adicionar Serviço Backend

```bash
railway service add
```

Selecione "Add GitHub Repository" e escolha `guilhermetorrejon-hash/clinify-saas`.

Configure:
- **Service name:** `backend`
- **Root directory:** `backend/`
- **Buildpack:** Node.js

---

## PASSO 4: Adicionar Serviço Frontend

```bash
railway service add
```

Repita para o frontend:
- **Service name:** `frontend`
- **Root directory:** `frontend/`
- **Buildpack:** Node.js

---

## PASSO 5: Adicionar PostgreSQL

```bash
railway add postgres
```

Railway provisionará automaticamente um banco PostgreSQL.

---

## PASSO 6: Adicionar Redis

```bash
railway add redis
```

Railway provisionará automaticamente um Redis.

---

## PASSO 7: Configurar Variáveis de Ambiente (Backend)

```bash
railway variable add --service backend JWT_SECRET="sua-chave-jwt-aqui"
railway variable add --service backend DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variable add --service backend REDIS_URL="${{Redis.REDIS_URL}}"
railway variable add --service backend NODE_ENV="production"
railway variable add --service backend PORT="3001"
railway variable add --service backend FRONTEND_URL="${{frontend.RAILWAY_PUBLIC_DOMAIN}}"
railway variable add --service backend R2_ACCOUNT_ID="seu-account-id"
railway variable add --service backend R2_ACCESS_KEY_ID="sua-access-key"
railway variable add --service backend R2_SECRET_ACCESS_KEY="sua-secret-key"
railway variable add --service backend R2_BUCKET_NAME="clinify"
railway variable add --service backend R2_PUBLIC_URL="https://seu-dominio-r2.com"
railway variable add --service backend OPENROUTER_API_KEY="sua-api-key"
railway variable add --service backend GOOGLE_GEMINI_API_KEY="sua-api-key"
railway variable add --service backend ANTHROPIC_API_KEY="sua-api-key"
```

**Onde pegar cada valor:**
- `JWT_SECRET`: Use um UUID: `uuidgen`
- `DATABASE_URL`: Railway injetará automaticamente
- `REDIS_URL`: Railway injetará automaticamente
- R2 keys: Do seu painel Cloudflare
- API keys: OpenRouter, Google Gemini, Anthropic

---

## PASSO 8: Configurar Variáveis de Ambiente (Frontend)

```bash
railway variable add --service frontend NEXT_PUBLIC_API_URL="${{backend.RAILWAY_PUBLIC_DOMAIN}}/api"
railway variable add --service frontend NODE_ENV="production"
```

---

## PASSO 9: Deploy

```bash
railway up
```

Isso vai:
1. Fazer build do backend e frontend
2. Criar containers
3. Provisionar PostgreSQL e Redis
4. Subir tudo para Railway
5. Gerar URLs públicas

**Tempo esperado:** 15-25 minutos

---

## PASSO 10: Obter URLs Geradas

```bash
railway open
```

Ou acesse https://railway.app e veja seu projeto.

**URLs importantes:**
- Backend: `https://your-clinify-backend.railway.app`
- Frontend: `https://your-clinify-frontend.railway.app`
- PostgreSQL: fornecido automaticamente
- Redis: fornecido automaticamente

---

## PASSO 11: Testar Acesso

```bash
# Testar backend
curl https://your-clinify-backend.railway.app/api/docs

# Testar frontend
open https://your-clinify-frontend.railway.app
```

Você deve ver:
- Backend: Swagger docs (http://localhost:3001/api/docs)
- Frontend: Login page

---

## PASSO 12: Testando Fluxo Completo

1. Abra **Frontend**: https://your-clinify-frontend.railway.app
2. **Registre** um usuário: `usuario@teste.com` / `senha123`
3. **Login** com as credenciais
4. **Crie perfil** (brand kit)
5. **Crie post** (novo)
6. **Verifique** se as imagens estão sendo geradas via Gemini

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Ver logs
railway logs --service backend

# Verificar variáveis (devem estar todas preenchidas)
railway variable ls --service backend
```

### Frontend não carrega API
- Verifique se `NEXT_PUBLIC_API_URL` está correto
- Backend URL deve estar acessível publicamente

### PostgreSQL não conecta
- Verifique `DATABASE_URL` está completa
- Rode migrations: `npm run migrate`

### Imagens não geram
- Verifique `GOOGLE_GEMINI_API_KEY` está válida
- Verifique `R2_*` variáveis (se usando R2)

---

## 📝 Comandos Úteis

```bash
# Ver status do projeto
railway status

# Ver logs em tempo real
railway logs --follow

# Redeploy
railway up

# Ver variáveis
railway variable ls --service backend

# Atualizar uma variável
railway variable update JWT_SECRET "novo-valor"

# Abrir dashboard
railway open
```

---

## ✅ Checklist Final

- [ ] Railway CLI instalado e autenticado
- [ ] Projeto criado em Railway
- [ ] Backend deploiado e online
- [ ] Frontend deploiado e online
- [ ] PostgreSQL provisionado
- [ ] Redis provisionado
- [ ] Todas as variáveis de ambiente setadas
- [ ] Backend respondendo em `/api/docs`
- [ ] Frontend carregando (login page)
- [ ] Fluxo completo testado (register → login → perfil → post → imagem)

---

**Próximos passos após tudo online:**
1. Convide usuários controlados para testar
2. Monitore logs em `railway logs --follow`
3. Reporte issues encontradas
4. Prepare para lançamento em produção
