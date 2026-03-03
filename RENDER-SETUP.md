# Deploy Clinify no Render

## Passo 1: Criar Conta e Banco de Dados

1. Acesse https://render.com
2. Faça login/signup com GitHub
3. **Criar PostgreSQL Database:**
   - Dashboard → "New +" → PostgreSQL
   - Nome: `clinify-db`
   - Plan: Free
   - Region: Frankfurt (ou próximo)
   - Copiar `Internal Database URL` (você vai precisar)

## Passo 2: Variáveis de Ambiente

Salve a `DATABASE_URL` do PostgreSQL - você vai usar no backend service.

## Passo 3: Deploy Backend

1. No Render Dashboard → "New +" → Web Service
2. Conectar repositório GitHub: `clinify-saas`
3. **Configurar:**
   - Name: `clinify-backend`
   - Environment: Node
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm run start:prod`
   - Plan: Free
   - Region: Frankfurt

4. **Environment Variables (Add):**
   ```
   NODE_ENV=production
   DATABASE_URL=<sua_database_url_aqui>
   PORT=3001
   JWT_SECRET=<generate_random_string>
   FRONTEND_URL=https://clinify-frontend.onrender.com
   OPENROUTER_API_KEY=<your_key>
   GOOGLE_GENAI_API_KEY=<your_key>
   CLOUDFLARE_R2_ACCOUNT_ID=<your_key>
   CLOUDFLARE_R2_ACCESS_KEY=<your_key>
   CLOUDFLARE_R2_SECRET_KEY=<your_key>
   CLOUDFLARE_R2_BUCKET=<your_bucket>
   REDIS_URL=<se_tiver_redis_externo>
   ```

5. Clicar "Create Web Service"
6. Esperar build (~5-10 min)

## Passo 4: Deploy Frontend

1. "New +" → Web Service (novamente)
2. Conectar repo `clinify-saas`
3. **Configurar:**
   - Name: `clinify-frontend`
   - Environment: Node
   - Build Command: `cd frontend && npm install && npm run build`
   - Start Command: `cd frontend && npm run start`
   - Plan: Free
   - Region: Frankfurt

4. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://clinify-backend.onrender.com
   NODE_ENV=production
   ```

5. Clicar "Create Web Service"
6. Esperar build

## Passo 5: Testar

- Backend: `https://clinify-backend.onrender.com/health` (se tiver endpoint)
- Frontend: `https://clinify-frontend.onrender.com`

## Notas

- **Free tier**: serviços dormem após 15 min inatividade
- **Redis**: Você pode:
  - Usar Redis Cloud (plan free) e passar URL como `REDIS_URL`
  - Ou usar em-memory (remover BullMQ se quiser simplificar)
- **Migrations**: Rodar manualmente:
  ```bash
  curl https://clinify-backend.onrender.com/run-migrations
  ```

## Troubleshooting

**Build failed:**
- Verifique Dockerfile ou build command
- Verifique package.json scripts
- Check logs no dashboard

**Conexão DB:**
- Verifique DATABASE_URL está correto
- Verifique network access (Render PostgreSQL aceita todas as IPs por padrão)

**CORS/API:**
- Frontend set `NEXT_PUBLIC_API_URL` corretamente
- Backend set `FRONTEND_URL` env var
