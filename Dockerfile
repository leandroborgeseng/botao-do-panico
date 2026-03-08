# Backend — use quando Root Directory está VAZIO (raiz do repo).
# Se Root Directory = apps/backend, o Railway usa apps/backend/Dockerfile.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY apps/backend/package*.json ./
COPY apps/backend/prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY apps/backend ./
RUN npm run build

FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY apps/backend/package*.json ./
RUN npm install --omit=dev

COPY apps/backend/prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/src/main.js"]
