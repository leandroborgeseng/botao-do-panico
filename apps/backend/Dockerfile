# Build stage - Debian para OpenSSL compatível com Prisma
FROM node:22-bookworm-slim AS builder

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
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

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

# Tudo no Docker: migrations + app
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/src/main.js"]
