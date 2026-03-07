# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copia package e prisma primeiro (melhor cache)
COPY package*.json ./
COPY prisma ./prisma/

# Instala deps (inclui dev para build)
RUN npm install

# Gera Prisma client
RUN npx prisma generate

# Copia o resto do código e compila
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copia package
COPY package*.json ./

# Instala apenas produção
RUN npm install --omit=dev

# Copia Prisma (schema + migrations) - ESSENCIAL para prisma migrate deploy
COPY prisma ./prisma/

# Gera Prisma client em produção (usa schema e migrations copiados)
RUN npx prisma generate

# Copia o build compilado
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Migrations rodam no start (DATABASE_URL vem do Railway)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
