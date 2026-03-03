FROM node:20-alpine

WORKDIR /app

# Copiar package files e prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Gerar Prisma Client
RUN npm run prisma:generate

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
