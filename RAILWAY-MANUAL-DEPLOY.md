# 🚂 Railway — Deploy Manual (Solução Definitiva)

O CLI do Railway tem problemas com root directories e submódulos. Vamos fazer deploy **manual no Dashboard** de forma explícita.

---

## PASSO 1: Deletar Serviços Quebrados

1. Abra: https://railway.com/project/726c39b1-f9f8-4d50-adf4-9b221894604f
2. **Deletar "backend":**
   - Clique no box do serviço backend
   - Clique em ⋮ (três pontinhos) ou Settings
   - Procure **"Remove Service"** ou **"Delete Service"**
   - Confirme

3. **Deletar "frontend":**
   - Clique no box do serviço frontend
   - Clique em ⋮ ou Settings
   - Procure **"Remove Service"** ou **"Delete Service"**
   - Confirme

4. **Deletar PostgreSQL e Redis** (opcional, mas recomendado para limpar)
   - Faça o mesmo para Postgres e Redis

---

## PASSO 2: Criar PostgreSQL Novo

1. No dashboard, clique em **"+ Add"** ou **"New Service"**
2. Procure por **"PostgreSQL"** ou **"Database"**
3. Clique em **"PostgreSQL"**
4. Confirme e aguarde provisionar (2-3 min)

---

## PASSO 3: Criar Redis Novo

1. Clique em **"+ Add"** ou **"New Service"**
2. Procure por **"Redis"**
3. Clique em **"Redis"**
4. Confirme e aguarde provisionar (2-3 min)

---

## PASSO 4: Criar Backend Service

**EXTREMAMENTE IMPORTANTE:** Siga EXATAMENTE estes passos.

1. Clique em **"+ Create"** ou **"Add Service"**
2. Escolha **"GitHub Repo"** (NÃO Docker, NÃO outro tipo)
3. Você será perguntado:
   - **"Select a GitHub org or user"** → Selecione `guilhermetorrejon-hash`
   - **"Select a repository"** → Escolha `clinify-saas`
   - **"Select a branch"** (optional) → Deixe em branco ou `main`

4. **PRÓXIMA TELA — SUPER IMPORTANTE:**
   - Procure por campo que diz **"Root Directory"** ou **"Service Path"** ou **"Configure Root Directory"**
   - Se não aparecer automaticamente, procure por **"Advanced Options"**
   - **DIGITE:** `backend`
   - **DO NOT** deixar em branco!

5. **PRÓXIMA TELA:**
   - Service Name: `backend` (ou deixe automático)
   - Clique **"Deploy"** ou **"Create Service"**

6. **Aguarde o build** (5-10 minutos)
   - Você deve ver status passando por: BUILDING → DEPLOYING → SUCCESS/LIVE

---

## PASSO 5: Criar Frontend Service

Repita PASSO 4, mas:
- **Root Directory:** `frontend` (em vez de `backend`)
- **Service Name:** `frontend`

---

## PASSO 6: Configurar Variáveis de Ambiente

Quando ambos os serviços estiverem **LIVE** (✅):

### Backend Variables

1. Clique no serviço **backend**
2. Vá para aba **"Variables"**
3. Clique em **"+ New Variable"**
4. Adicione cada uma:

```
JWT_SECRET = your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN = 7d
NODE_ENV = production
PORT = 3001
R2_ACCOUNT_ID = b0c59342acba3acf81ee54e69249a340
R2_ACCESS_KEY_ID = 3fd5cf6f19e927569bc111a2a62c04cc
R2_SECRET_ACCESS_KEY = e45179367e9aa5788a7b638dd3d0712070715c3b735f74a5463406c871f6816a
R2_BUCKET_NAME = clinify-uploads
R2_PUBLIC_URL = https://pub-f4a7c5620ffc425884471513e4aeefcd.r2.dev
OPENROUTER_API_KEY = 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
OPENROUTER_TEXT_MODEL = anthropic/claude-sonnet-4-6
GOOGLE_AI_API_KEY = AIzaSyBZ5-kKXynmTdaiyrccq6ar7-SldFunPWk
GOOGLE_IMAGE_MODEL = nano-banana-pro-preview
FAL_API_KEY = 72a78373-79d7-450e-a54b-3cc48977c811:5a3bd81b6a70fa5f44ce54d0d1a849e5
```

**Nota:** `DATABASE_URL` e `REDIS_URL` serão automaticamente injetadas pelo Railway.

### Frontend Variables

1. Clique no serviço **frontend**
2. Vá para aba **"Variables"**
3. Adicione:

```
NEXT_PUBLIC_API_URL = https://clinify-backend-XXXX.railway.app/api
NODE_ENV = production
```

(Substitua `XXXX` pela URL do seu backend, que você pode copiar do serviço backend no dashboard)

---

## PASSO 7: Triggerar Redeploy com Variáveis

Após adicionar as variáveis:

1. Clique em **"Redeploy"** (ícone de seta circular)
2. Selecione **"Latest"**
3. Clique **"Redeploy"**
4. Aguarde 3-5 minutos para o rebuild

---

## ✅ Verificação Final

Quando tudo estiver **LIVE** ✅:

### Testar Backend
```
https://clinify-backend-XXXX.railway.app/api/docs
```
Você deve ver **Swagger documentation**

### Testar Frontend
```
https://clinify-frontend-YYYY.railway.app
```
Você deve ver **Login page**

### Testar Fluxo Completo
1. Register: `teste@exemplo.com` / `Senha123!`
2. Login
3. Preencher perfil (brand kit)
4. Criar novo post
5. Gerar imagens

---

## 🐛 Se algo falhar:

1. **Backend não builda?**
   - Clique no serviço
   - Vá para "Deployments"
   - Clique na implantação
   - Vá para "Logs"
   - Procure pela mensagem de erro

2. **Frontend não conecta ao backend?**
   - Verifique se `NEXT_PUBLIC_API_URL` está correto
   - Certifique-se de que não tem espaços extras

3. **Variáveis não aparecem?**
   - PostgreSQL/Redis foram criados?
   - Aguarde 2-3 minutos para Railway injetar `DATABASE_URL` e `REDIS_URL`

---

## ⏳ Tempo Total Esperado

- Deletar serviços: 2 min
- Criar PostgreSQL: 3 min
- Criar Redis: 3 min
- Build Backend: 8 min
- Build Frontend: 8 min
- Configurar variáveis: 3 min
- Redeploy com variáveis: 5 min

**Total: ~30-35 minutos**

---

**Avise quando completar cada PASSO!**
