# Deploy completo no Railway

Guia para fazer backend, banco e frontend funcionarem no [Railway](https://railway.com).

**Recriar o backend do zero (Docker + Postgres):** use o guia [docs/RAILWAY-BACKEND-DO-ZERO.md](docs/RAILWAY-BACKEND-DO-ZERO.md).

---

## Visão geral

Backend e frontend usam **Docker** (Dockerfile) no Railway — não Nixpacks. Em cada serviço, **Root Directory** define a pasta e o Dockerfile correspondente é usado.

| Serviço | Root Directory | Builder |
|---------|----------------|---------|
| **Postgres** | (template) | — |
| **Backend (API)** | `apps/backend` | Dockerfile |
| **Frontend (Web)** | `apps/web` | Dockerfile |

---

## 1. Criar/verificar o projeto no Railway

1. Acesse [railway.com](https://railway.com) e crie ou abra um projeto.
2. Conecte o repositório GitHub **botao-do-panico** (ou o nome do seu repo).

---

## 2. Banco de dados (PostgreSQL)

1. No projeto, clique em **+ New** → **Database** → **PostgreSQL**.
2. Aguarde o deploy.
3. No serviço Postgres, vá em **Variables** e copie (ou referencie):
   - `DATABASE_URL` — connection string completa

---

## 3. Backend (NestJS + Prisma)

1. Clique em **+ New** → **GitHub Repo** e selecione o repositório **botao-do-panico**.
2. O Railway cria um novo serviço. Em **Settings**:
   - **Root Directory**: `apps/backend`
   - **Builder**: Dockerfile (usar o Dockerfile de apps/backend)
3. Em **Variables**, adicione:
   - `DATABASE_URL` — referência à variável do Postgres OU cole a connection string (ex: `postgresql://postgres:SENHA@host:porta/railway`)
   - `JWT_SECRET` — string aleatória longa (ex: gere com `openssl rand -base64 32`)
   - `CORS_ORIGINS` — URLs do frontend separadas por vírgula (ex: `https://seu-frontend-production.up.railway.app`) ou `*` para aceitar qualquer origem
4. Em **Settings** → **Networking**, gere um domínio público se ainda não existir.
5. Salve. O deploy será disparado automaticamente.
6. **Guarde a URL pública** do backend (ex: `https://botao-do-panico-production.up.railway.app`).

---

## 4. Frontend (Next.js)

1. No mesmo projeto, clique em **+ New** → **GitHub Repo** e selecione o mesmo repositório.
2. Em **Settings**:
   - **Root Directory**: `apps/web`
   - **Builder**: Dockerfile
3. Em **Variables**, adicione:
   - `NEXT_PUBLIC_API_URL` — URL do backend (a que você guardou no passo 3). Ex: `https://botao-do-panico-production.up.railway.app`
4. Se usar **Build Arguments** no Railway, passe `NEXT_PUBLIC_API_URL` como build arg (alguns planos permitem).
5. Em **Settings** → **Networking**, gere um domínio público.
6. Salve e aguarde o deploy.

---

## 5. Atualizar CORS no backend

Depois que o frontend tiver uma URL:

1. No serviço **backend**, em **Variables**, edite `CORS_ORIGINS`:
   - Coloque a URL exata do frontend (ex: `https://botao-do-panico-web-production.up.railway.app`)
   - Ou use `*` para aceitar qualquer origem (apenas para testes)
2. Faça um novo deploy do backend (Redeploy).

---

## 6. Variáveis resumidas

### Backend (apps/backend)

| Variável | Obrigatório | Exemplo |
|----------|-------------|---------|
| DATABASE_URL | Sim | Referência ao Postgres ou `postgresql://...` |
| JWT_SECRET | Recomendado | String longa aleatória |
| CORS_ORIGINS | Sim | `*` ou `https://seu-frontend.up.railway.app` |

### Frontend (apps/web)

| Variável | Obrigatório | Exemplo |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Sim | `https://seu-backend-production.up.railway.app` |

---

## Troubleshooting

- **502 Bad Gateway**: Verifique **Deploy Logs** do serviço. Se aparecer erro de JWT ou CORS, ajuste as variáveis e faça redeploy.
- **Prisma schema not found**: Confirme **Root Directory** = `apps/backend`.
- **Frontend não conecta ao backend**: Confirme `NEXT_PUBLIC_API_URL` e `CORS_ORIGINS` corretos.
- **NEXT_PUBLIC_API_URL não funciona**: Ela precisa existir **no build**. Defina antes do build ou use build args no Railway.
