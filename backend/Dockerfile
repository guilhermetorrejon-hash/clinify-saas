FROM node:20-alpine

WORKDIR /app

# Copiar apenas package files primeiro para aproveitar cache
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && npm install --save-dev prisma @prisma/cli

# Gerar Prisma Client EXPLICITAMENTE com schema path
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar código restante
COPY . .

# Build da aplicação
RUN npm run build

# Cleanup
RUN npm ci --only=production && rm -rf node_modules/.cache

# Expor porta
EXPOSE 3001

# Start
CMD ["npm", "run", "start:prod"]
