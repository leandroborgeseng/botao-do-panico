# Build do backend a partir da raiz do monorepo (Railway pode usar raiz como Root Directory)
# Usamos Debian (bookworm) para OpenSSL compatível com o Prisma schema engine
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY apps/backend/package*.json ./
COPY apps/backend/prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY apps/backend .
RUN npm run build

# Imagem final
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY apps/backend/package*.json ./
RUN npm install --omit=dev

COPY apps/backend/prisma ./prisma/
RUN test -f /app/prisma/schema.prisma || (echo "ERRO: prisma/schema.prisma nao encontrado." && exit 1)
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/prisma/schema.prisma && node dist/main.js"]
