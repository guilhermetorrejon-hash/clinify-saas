FROM node:20-alpine

WORKDIR /app

# Copiar package files APENAS
COPY package*.json ./

# Copiar prisma schema E config ANTES de npm install
COPY prisma ./prisma
COPY prisma.config.ts .

# Instalar todas as dependências (dev também)
RUN npm install

# Gerar Prisma Client - DEVE FUNCIONAR AGORA
RUN npx prisma generate

# Copiar código restante
COPY . .

# Build NestJS
RUN npm run build

# Limpar cache e remover devDependencies para stage final
RUN npm ci --omit=dev

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
