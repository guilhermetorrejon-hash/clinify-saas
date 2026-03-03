FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Gerar Prisma Client (com verbose para debug)
RUN npx -y @prisma/cli generate --schema=./prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Expor porta
EXPOSE 3001

# Start
CMD ["npm", "run", "start"]
