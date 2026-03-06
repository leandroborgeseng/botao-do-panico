# Deploy no Railway (Backend + Frontend)

Este guia descreve como publicar o **backend (NestJS)** e o **painel web (Next.js)** no [Railway](https://railway.app).

---

## 1. Conta e projeto no Railway

1. Crie uma conta em [railway.app](https://railway.app) (login com GitHub é o mais prático).
2. Crie um **novo projeto** (New Project).
3. Você vai configurar **dois serviços** no mesmo projeto:
   - **Backend** (API NestJS)
   - **Web** (painel Next.js)

---

## 2. Banco de dados (recomendado para produção)

O backend usa SQLite por padrão. No Railway o disco é efêmero, então os dados podem ser perdidos a cada deploy.

**Opção recomendada:** usar **PostgreSQL** no Railway.

1. No projeto Railway, clique em **+ New** → **Database** → **PostgreSQL**.
2. Railway cria o banco e expõe a variável `DATABASE_URL` (algo como `postgresql://...`).
3. Para o backend usar Postgres, é preciso alterar o Prisma (veja a seção **Backend com PostgreSQL** no final deste doc).  
   **Por enquanto** você pode subir com SQLite para testar (os dados podem ser perdidos em redeploy).

---

## 3. Serviço 1 – Backend (API)

1. No projeto, clique em **+ New** → **GitHub Repo** e selecione o repositório do Botão do Pânico.
2. Railway cria um serviço. Clique nele e vá em **Settings**.
3. **Root Directory:** defina `apps/backend`.
4. **Build Command:** deixe em branco (Railway usa `npm install` + `npm run build` pelo `package.json`).
5. **Start Command:** use `npm run start:prod` (roda as migrações do Prisma e sobe o Nest).
6. **Variáveis de ambiente** (Variables):

   | Variável        | Valor                                                                 | Obrigatório |
   |-----------------|-----------------------------------------------------------------------|-------------|
   | `NODE_ENV`      | `production`                                                          | Sim         |
   | `PORT`          | Railway define automaticamente; não é obrigatório definir             | —           |
   | `DATABASE_URL`  | Para SQLite: `file:./data/prod.db`. Para Postgres: use a URL do add-on | Sim         |
   | `JWT_SECRET`    | Uma string longa e aleatória (ex.: gere com `openssl rand -base64 32`) | Sim         |
   | `BASE_URL`      | URL pública do backend (ex.: `https://seu-backend.railway.app`)        | Sim         |
   | `CORS_ORIGINS`  | URL do frontend (ex.: `https://seu-web.railway.app`)                   | Sim         |

7. Depois do primeiro deploy, anote a **URL pública** do backend (ex.: `https://backend-production-xxxx.up.railway.app`).
8. **Migrações:** na primeira vez, rode as migrações no backend. No Railway você pode usar **Settings** → **Deploy** e em "Custom Start Command" temporariamente usar algo como `npx prisma migrate deploy && npx nest start`, ou abrir o **Shell** do serviço (se disponível) e rodar `npx prisma migrate deploy` antes de iniciar. A forma mais simples é adicionar no `package.json` um script `"postinstall": "prisma generate"` e um script de start que rode migrate + start (veja abaixo).

---

## 4. Serviço 2 – Frontend (Painel Web)

1. No mesmo projeto, **+ New** → **GitHub Repo** de novo e selecione o **mesmo** repositório.
2. Clique no novo serviço → **Settings**.
3. **Root Directory:** `apps/web`.
4. **Build Command:** em branco (usa `npm run build`).
5. **Start Command:** em branco (usa `npm start`).
6. **Variáveis de ambiente:**

   | Variável               | Valor                                                                 |
   |------------------------|-----------------------------------------------------------------------|
   | `NEXT_PUBLIC_API_URL`  | URL pública do **backend** (ex.: `https://seu-backend.railway.app`)   |

   Importante: essa variável é usada no **build** do Next.js. Após alterá-la, faça um novo deploy.

7. Gere o **domínio público** em **Settings** → **Networking** → **Generate Domain** e anote a URL do frontend.

---

## 5. Ordem e CORS

1. Faça o deploy do **backend** primeiro e anote a URL.
2. Defina **CORS_ORIGINS** no backend com a URL exata do frontend (ex.: `https://web-production-yyyy.up.railway.app`).
3. No serviço **web**, defina **NEXT_PUBLIC_API_URL** com a URL do backend e faça um novo deploy do frontend.

Assim o painel web consegue chamar a API sem erro de CORS.

---

## 6. App mobile

No build de produção do app (EAS), configure a variável **EXPO_PUBLIC_API_URL** (ou a que o app usa) com a **URL do backend no Railway**. O app na loja vai usar essa URL para todas as chamadas à API.

---

## 7. Resumo rápido

| Onde        | Root Directory  | Variáveis importantes                                      |
|------------|------------------|------------------------------------------------------------|
| **Backend**| `apps/backend`   | `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `BASE_URL`, `CORS_ORIGINS` |
| **Web**    | `apps/web`      | `NEXT_PUBLIC_API_URL` = URL do backend                    |

Depois de configurar, cada push no repositório (ou deploy manual) pode gerar um novo deploy nos dois serviços, se o Railway estiver ligado ao GitHub.
