FROM node:20-alpine

WORKDIR /app

# Copiar package files e prisma schema
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci && npm list prisma

# Gerar Prisma Client explicitamente
RUN ls -la prisma/ && npx prisma generate --schema=./prisma/schema.prisma && ls -la node_modules/@prisma/client/

# Copiar código restante
COPY . .

# Build com TypeScript
RUN npm run build

# Remover devDependencies para imagem final
RUN npm ci --only=production

# Expor porta
EXPOSE 3001

# Start
CMD ["npm", "run", "start:prod"]
