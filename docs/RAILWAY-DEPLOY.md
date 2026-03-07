# Deploy do Backend no Railway

## Configuração obrigatória

Para o deploy funcionar, use **uma** das opções abaixo.

---

### Opção A: Root Directory = `apps/backend` (recomendado)

1. No serviço **botao-do-panico** no Railway, vá em **Settings**.
2. Em **Root Directory**, defina: **`apps/backend`**
3. Em **Deploy** (ou **Start Command**), defina o comando de start:
   ```bash
   npx prisma migrate deploy && node dist/main.js
   ```
   (Não use caminho `apps/backend/...` — o processo já roda dentro de `apps/backend`.)
4. Em **Variables**, adicione **`DATABASE_URL`** como referência à variável do serviço **Postgres** (ou cole a connection string do Postgres).
5. Faça um novo deploy.

Com isso, o Prisma encontra `prisma/schema.prisma` e o OpenSSL é resolvido pelo `nixpacks.toml` do backend.

---

### Opção B: Usar Dockerfile (raiz do repo)

1. **Root Directory**: deixe **vazio** (raiz do repositório).
2. **Builder**: em Settings, mude de Railpack para **Dockerfile** (se houver essa opção).
3. **Start Command**: deixe **vazio** para usar o `CMD` do `Dockerfile` da raiz.
4. **Variables**: `DATABASE_URL` do Postgres.
5. Faça um novo deploy.

---

## Resumo

| Configuração     | Valor (Opção A)     |
|------------------|---------------------|
| Root Directory   | `apps/backend`      |
| Start Command    | `npx prisma migrate deploy && npx nest start` |
| DATABASE_URL     | Referência ao Postgres |
