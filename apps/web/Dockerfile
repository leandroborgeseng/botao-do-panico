# Frontend Next.js para Railway
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# NEXT_PUBLIC_API_URL precisa estar no build (Railway passa como variável ou build arg)
# Backend no Railway (sem barra no final)
ARG NEXT_PUBLIC_API_URL=https://botao-do-panico-production.up.railway.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Produção - Railway injeta PORT em runtime
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

CMD ["npm", "start"]
