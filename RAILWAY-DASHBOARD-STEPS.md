# 🚂 Configuração Railway no Dashboard — Passo a Passo

Seu projeto está em: https://railway.com/project/726c39b1-f9f8-4d50-adf4-9b221894604f

---

## PASSO 1: Adicionar PostgreSQL

1. No dashboard, clique em **"+ Add Service"** ou **"Add"**
2. Procure por **"PostgreSQL"** ou **"Database"**
3. Clique em **"PostgreSQL"**
4. Confirme para criar a instância
5. Espere 1-2 minutos para provisionar

**Resultado:** Railway cria um banco Postgres automático com URL `DATABASE_URL` injetada.

---

## PASSO 2: Adicionar Redis

1. Clique novamente em **"+ Add Service"**
2. Procure por **"Redis"**
3. Clique em **"Redis"**
4. Confirme
5. Espere 1-2 minutos

**Resultado:** Redis provisionado com `REDIS_URL` injetada.

---

## PASSO 3: Conectar GitHub (Backend)

1. Clique em **"+ Add Service"**
2. Selecione **"GitHub Repo"**
3. Escolha seu repositório: **`guilhermetorrejon-hash/clinify-saas`**
4. Selecione **"Deploy from a specific root directory"**
5. Digite: **`backend`** como root directory
6. Clique **"Create Service"**
7. Espere o build (5-10 minutos)

**Resultado:** Backend deploiado automaticamente em:
```
https://your-clinify-backend.railway.app
```

---

## PASSO 4: Conectar GitHub (Frontend)

Repita PASSO 3, mas:
- Root directory: **`frontend`** (em vez de `backend`)
- Service name: **`frontend`** (ou deixar automático)

**Resultado:** Frontend deploiado em:
```
https://your-clinify-frontend.railway.app
```

---

## PASSO 5: Configurar Variáveis de Ambiente (Backend)

Você vai ver o backend service no dashboard.

1. Clique no **serviço "backend"**
2. Vá para aba **"Variables"**
3. Clique em **"+ Add Variable"**
4. Adicione as seguintes variáveis (copie exatamente como está):

### Variáveis Obrigatórias

```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
R2_ACCOUNT_ID=b0c59342acba3acf81ee54e69249a340
R2_ACCESS_KEY_ID=3fd5cf6f19e927569bc111a2a62c04cc
R2_SECRET_ACCESS_KEY=e45179367e9aa5788a7b638dd3d0712070715c3b735f74a5463406c871f6816a
R2_BUCKET_NAME=clinify-uploads
R2_PUBLIC_URL=https://pub-f4a7c5620ffc425884471513e4aeefcd.r2.dev
OPENROUTER_API_KEY=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
OPENROUTER_TEXT_MODEL=anthropic/claude-sonnet-4-6
GOOGLE_AI_API_KEY=AIzaSyBZ5-kKXynmTdaiyrccq6ar7-SldFunPWk
GOOGLE_IMAGE_MODEL=nano-banana-pro-preview
FAL_API_KEY=72a78373-79d7-450e-a54b-3cc48977c811:5a3bd81b6a70fa5f44ce54d0d1a849e5
```

### Variáveis de Banco de Dados e Cache

**Para DATABASE_URL:**
- Railway injeta automaticamente quando você adiciona PostgreSQL
- Se não aparecer, é gerada automaticamente

**Para REDIS_URL:**
- Railway injeta automaticamente quando você adiciona Redis
- Se não aparecer, é gerada automaticamente

**Para FRONTEND_URL:**
- Primeiro deploy e obtenha a URL pública do frontend
- Exemplo: `https://clinify-frontend-abc123.railway.app`
- Depois edite e adicione: `FRONTEND_URL=https://clinify-frontend-abc123.railway.app`

---

## PASSO 6: Configurar Variáveis de Ambiente (Frontend)

1. Clique no **serviço "frontend"**
2. Vá para aba **"Variables"**
3. Adicione:

```
NEXT_PUBLIC_API_URL=https://clinify-backend-xyz789.railway.app/api
NODE_ENV=production
```

**Importante:** A URL do backend será disponível após o deploy do backend (próximo passo).

---

## PASSO 7: Primeiro Deploy Automático

Após adicionar as variáveis:

1. Volte para a aba **"Deployments"** do backend
2. Clique em **"Redeploy"** para usar as novas variáveis
3. Espere 3-5 minutos para rebuild e deploy
4. Quando terminar, você verá:
   - Status: **"Success"** ou **"Live"** ✅
   - URL pública: **`https://clinify-backend-xxx.railway.app`**

---

## PASSO 8: Atualizar Frontend com URL do Backend

1. Após backend estar online, copie sua URL pública (ex: `https://clinify-backend-abc123.railway.app`)
2. Vá para variáveis do **frontend**
3. Edite **`NEXT_PUBLIC_API_URL`** e cole:
   ```
   https://clinify-backend-abc123.railway.app/api
   ```
4. Clique **"Redeploy"** no frontend
5. Espere 3-5 minutos

---

## ✅ Verificação Final

Quando tudo estiver online, você terá:

| Serviço | Status | URL |
|---------|--------|-----|
| Backend | ✅ Live | `https://clinify-backend-xxx.railway.app` |
| Frontend | ✅ Live | `https://clinify-frontend-yyy.railway.app` |
| PostgreSQL | ✅ Active | (interno) |
| Redis | ✅ Active | (interno) |

---

## 🧪 Testar Acesso

1. **Backend Swagger:**
   ```
   https://clinify-backend-xxx.railway.app/api/docs
   ```
   Você deve ver a documentação Swagger da API

2. **Frontend Login:**
   ```
   https://clinify-frontend-yyy.railway.app
   ```
   Você deve ver a página de login

3. **Testar Register:**
   - Email: `teste@gmail.com`
   - Senha: `Senha123!`
   - Clique "Registrar"

4. **Testar Login:**
   - Faça login com as credenciais acima

5. **Testar Fluxo Completo:**
   - Login → Perfil (preencher brand kit) → Novo Post → Verificar se gera imagens

---

## 🐛 Troubleshooting Comum

### "Build failed" ou "Deployment failed"
- Verifique as variáveis de ambiente
- Abra o log de build clicando em "View logs"
- Procure por mensagens de erro

### Frontend não conecta ao backend
- Verifique se `NEXT_PUBLIC_API_URL` está correto
- Certifique-se de que backend está online e acessível

### Banco de dados não conecta
- PostgreSQL foi adicionado?
- Aguarde 2 minutos para provisionar completamente
- Verifique se `DATABASE_URL` foi injetada

### Imagens não geram
- Verifique se `GOOGLE_AI_API_KEY` está correto
- Verifique `R2_*` variáveis

---

## 📋 Checklist Final

- [ ] PostgreSQL adicionado e provisionado
- [ ] Redis adicionado e provisionado
- [ ] Backend conectado via GitHub + deploiado
- [ ] Frontend conectado via GitHub + deploiado
- [ ] Todas as variáveis de backend configuradas
- [ ] Todas as variáveis de frontend configuradas
- [ ] Backend respondendo em `/api/docs`
- [ ] Frontend carregando (login page)
- [ ] Fluxo completo testado (register → login → perfil → novo post)

---

**Próximos passos:**
1. ✅ Setup concluído — Sistema online
2. ⏭️ Convide usuários controlados
3. ⏭️ Monitore logs e errors
4. ⏭️ Reporte issues
5. ⏭️ Prepare para lançamento em produção

