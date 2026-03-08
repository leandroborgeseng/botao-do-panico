# Recriar o backend no Railway (do zero) com Docker e Postgres

Siga estes passos no **mesmo projeto** onde está o Postgres.

---

## 1. Criar o serviço do backend

1. No projeto Railway, clique em **+ New** (ou **Add Service**).
2. Escolha **GitHub Repo**.
3. Selecione o repositório **botao-do-panico** (ou o nome do seu repo).
4. Confirme. O Railway cria um **novo serviço** e começa um deploy.

---

## 2. Configurar para usar Docker

1. Clique no **novo serviço** (o que acabou de ser criado).
2. Vá em **Settings** (ícone de engrenagem ou aba Settings).
3. Em **Source** ou **Build** — escolha **uma** das opções:

   **Opção A — Root Directory vazio (raiz do repo)**  
   - Deixe **Root Directory** em branco (ou `.`).  
   - O Railway usa o **Dockerfile** e o **railway.toml** da **raiz** do repositório, que já buildam o backend a partir de `apps/backend`.  
   - Nada mais a configurar no Builder.

   **Opção B — Root Directory = apps/backend**  
   - **Root Directory**: digite **`apps/backend`** e salve.  
   - O Railway usa o `Dockerfile` de `apps/backend`.  
   - Em **Builder**, deve aparecer **Dockerfile**; se houver opção, selecione **Dockerfile**.

---

## 3. Conectar ao banco de dados (Postgres)

1. Ainda no serviço do backend, vá em **Variables** (ou **Variables** no menu).
2. Clique em **+ New Variable** ou **Add Variable**.
3. Para **DATABASE_URL** você pode fazer de dois jeitos:

   **Opção A – Referência ao Postgres (recomendado)**  
   - Escolha **Add variable reference** / **Referência**.
   - **Service**: selecione o serviço **Postgres** do projeto.
   - **Variable**: selecione **`DATABASE_URL`** (ou a variável que tem a connection string do Postgres).
   - No backend, o **nome** da variável deve ser **`DATABASE_URL`** (igual).
   - Salve.

   **Opção B – Colar a URL**  
   - **Name**: `DATABASE_URL`  
   - **Value**: cole a connection string do Postgres.  
   - Para pegar: no serviço **Postgres** → **Variables** (ou **Connect**), copie **DATABASE_URL** ou **POSTGRES_URL**.  
   - Formato: `postgresql://postgres:SENHA@HOST:PORTA/railway`  
   - Salve.

4. Confira se **DATABASE_URL** aparece na lista de variáveis do backend.

---

## 4. Outras variáveis do backend

Ainda em **Variables** do backend, adicione:

| Nome            | Valor                                                                 |
|-----------------|-----------------------------------------------------------------------|
| **JWT_SECRET**  | Uma string longa e aleatória (ex.: gere com `openssl rand -base64 32` no terminal). |
| **CORS_ORIGINS**| `*` (para teste) ou a URL do frontend, ex.: `https://seu-frontend.up.railway.app` |

Salve após cada uma.

---

## 5. Domínio público (URL do backend)

1. No serviço do backend, vá em **Settings** → **Networking** (ou **Public Networking**).
2. Clique em **Generate Domain** (ou **Add Domain**).
3. O Railway vai gerar uma URL tipo `https://xxx-production.up.railway.app`.
4. **Guarde essa URL** — é a do backend (use no frontend em `NEXT_PUBLIC_API_URL` e em `CORS_ORIGINS` se precisar).

---

## 6. Deploy

1. Se o deploy não tiver começado sozinho, em **Deployments** clique em **Deploy** / **Redeploy**.
2. Em **Build Logs** deve aparecer o build usando o **Dockerfile** (não Nixpacks).
3. Quando o status ficar **Completed**, teste no navegador:
   - `https://SUA-URL-BACKEND/` → deve retornar um JSON da API.
   - `https://SUA-URL-BACKEND/health` → deve retornar `{"ok":true,...}`.

---

## Resumo

| O quê              | Onde / valor        |
|--------------------|---------------------|
| Root Directory     | `apps/backend`      |
| Builder            | Dockerfile          |
| DATABASE_URL       | Referência ao Postgres ou connection string |
| JWT_SECRET         | String aleatória    |
| CORS_ORIGINS       | `*` ou URL do front |
| Domínio            | Gerar em Networking |

Se algo falhar, confira **Deploy Logs** e **Build Logs** do serviço do backend.
