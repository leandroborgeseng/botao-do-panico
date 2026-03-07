# Build do backend a partir da raiz do monorepo (Railway pode usar raiz como Root Directory)
FROM node:22-alpine AS builder

WORKDIR /app

# Só o que precisamos do backend
COPY apps/backend/package*.json ./
COPY apps/backend/prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY apps/backend .
RUN npm run build

# Imagem final
FROM node:22-alpine AS production

WORKDIR /app

COPY apps/backend/package*.json ./
RUN npm install --omit=dev

COPY apps/backend/prisma ./prisma/
# Falha o build se o schema não estiver na imagem (ex.: Root Directory errado)
RUN test -f /app/prisma/schema.prisma || (echo "ERRO: prisma/schema.prisma nao encontrado. No Railway, use Root Directory = raiz do repo (vazio)." && exit 1)
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Caminho absoluto do schema para não depender do cwd (Railway pode sobrescrever start)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/prisma/schema.prisma && node dist/main.js"]
