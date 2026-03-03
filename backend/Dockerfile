FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Gerar Prisma Client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Expor porta
EXPOSE 3001

# Start
CMD ["npm", "run", "start"]
