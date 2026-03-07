# Variáveis de ambiente

## Railway (backend – serviço botao-do-panico)

Configure em **Variables** do serviço no Railway:

| Variável         | Obrigatório | Exemplo / descrição |
|------------------|-------------|----------------------|
| `DATABASE_URL`   | Sim         | URL do Postgres. Formato: `postgresql://USER:SENHA@HOST:PORTA/DATABASE`. No Railway, use a referência à variável do serviço Postgres. |
| `JWT_SECRET`     | Sim         | String longa e aleatória (ex.: `openssl rand -base64 32`). Não use o valor de desenvolvimento. |
| `CORS_ORIGINS`   | Sim         | Origens permitidas separadas por vírgula. Ex.: `https://seu-app.vercel.app,https://outro-dominio.com` |
| `PORT`           | Não         | Railway define automaticamente. |
| `NODE_ENV`       | Não         | Railway define como `production`. |

## Mobile (Expo)

Em **apps/mobile/.env** (não commitar) ou no EAS / build:

| Variável                 | Uso |
|--------------------------|-----|
| `EXPO_PUBLIC_API_URL`    | **Dev:** `http://IP_DA_MAQUINA:3001`. **Produção:** URL do backend no Railway, ex.: `https://botao-do-panico-production.up.railway.app` |

## Web (Next.js)

Em **apps/web/.env.local** (não commitar) ou no Vercel:

| Variável                 | Uso |
|--------------------------|-----|
| `NEXT_PUBLIC_API_URL`    | URL do backend. Produção: mesma URL do Railway do backend. |

---

**Importante:** Nunca commite arquivos `.env` com senhas ou segredos. Use `.env.example` como modelo e preencha os valores localmente ou nos painéis (Railway, Vercel, EAS).
