#!/bin/sh
# Start do backend no Railway quando o build é pela raiz (Railpack).
# Usa caminho absoluto do schema para o Prisma encontrar.
set -e
cd "$(dirname "$0")/.."
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
cd apps/backend && npx nest start
