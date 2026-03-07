# Deploy do Frontend (Web) no Railway

## Passos

1. No mesmo **projeto** Railway, clique em **+ New** → **GitHub Repo** e conecte o mesmo repositório **botao-do-panico** (ou **+ Service** se já estiver no projeto).

2. O Railway criará um novo serviço. Vá em **Settings** e configure:

   | Configuração    | Valor        |
   |-----------------|--------------|
   | **Root Directory** | `apps/web` |
   | **Builder**     | Dockerfile (ou deixe usar o Dockerfile automaticamente) |

3. Em **Variables**, adicione:

   | Variável               | Valor                                                                 |
   |------------------------|-----------------------------------------------------------------------|
   | `NEXT_PUBLIC_API_URL`  | URL do backend, ex.: `https://botao-do-panico-production.up.railway.app` |

   ⚠️ `NEXT_PUBLIC_*` precisa estar definido **antes do build** para ser embutido no bundle.

4. No backend (**botao-do-panico**), adicione a URL do frontend em **CORS_ORIGINS**:
   - Ex.: `https://seu-frontend-production.up.railway.app` (a URL que o Railway der ao frontend depois do deploy)

5. Faça o deploy. O frontend usará `PORT` definido pelo Railway.

---

## Estrutura de serviços no Railway

| Serviço     | Root Directory | URL típica              |
|-------------|----------------|-------------------------|
| botao-do-panico (backend) | `apps/backend` | `https://botao-do-panico-production.up.railway.app` |
| botao-do-panico-web (frontend) | `apps/web`  | `https://xxx-production.up.railway.app` |
