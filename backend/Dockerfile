# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma generated client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy compiled app
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]
