FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Build Next.js
RUN npm run build

# Expor porta
EXPOSE 3000

# Start
CMD ["npm", "run", "start"]
