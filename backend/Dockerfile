FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client explicitly
RUN echo "=== Generating Prisma Client ===" && npx prisma generate && echo "=== Prisma Client Generated ===" && ls -la node_modules/@prisma/client/ | head -10

COPY . .

RUN npm run build

RUN npm ci --omit=dev

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
