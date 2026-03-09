# Checklist antes de colocar em produção

Use este checklist para garantir que backend, frontend web e app mobile estão prontos para produção.

---

## 1. Backend (Railway)

- [ ] **Variáveis de ambiente** no serviço Backend (Railway → Variables):
  - `DATABASE_URL` — referência ao Postgres (ex.: variável vinculada ao serviço Postgres)
  - `JWT_SECRET` — gerar com: `openssl rand -base64 32`
  - `CORS_ORIGINS` — URL do frontend web (ex.: `https://botao-do-panico-production-xxx.up.railway.app`). Múltiplas origens separadas por vírgula. Não use `*` com login/cookies.
  - `BASE_URL` — URL pública da API (ex.: `https://botao-do-panico-production.up.railway.app`) para links de áudio e redirects.
  - Opcional: `JWT_ACCESS_EXPIRES` (ex.: `15m`) para tempo do access token.

- [ ] **Migration**: no primeiro deploy, a migration `add_refresh_tokens` roda automaticamente (o Dockerfile usa `prisma migrate deploy` antes de iniciar o app). Confirme no log que não houve erro.

- [ ] **Testes**: após o deploy, abra no navegador:
  - `https://<sua-api>/health` → deve retornar `{ "ok": true, "db": "ok" }`
  - `https://<sua-api>/docs` → Swagger deve abrir

---

## 2. Frontend Web (Railway)

- [ ] **Variáveis de ambiente** no serviço Frontend (Railway → Variables):
  - `NEXT_PUBLIC_API_URL` — URL do backend (ex.: `https://botao-do-panico-production.up.railway.app`), **sem barra no final**.

- [ ] **URLs para as lojas**: anote a URL pública do frontend (ex.: `https://botao-do-panico-production-xxx.up.railway.app`). Você vai usar:
  - **Política de privacidade / uso:** `https://<seu-front>/politica-de-uso`
  - **Solicitação de descadastramento:** `https://<seu-front>/descadastramento`

---

## 3. App Mobile (EAS Build + lojas)

- [ ] **API em produção**: no `app.config.js` o padrão já é a URL de produção. Para builds EAS com perfil `production`, confira no `eas.json` se `EXPO_PUBLIC_API_URL` está com a URL do backend em produção (ou deixe vazio para usar o padrão do app.config.js).

- [ ] **Versão e build**:
  - `version`: ex. `1.0.0` (visível para o usuário)
  - Android `versionCode`: inteiro (1, 2, 3…) — incrementar a cada envio à Play Store
  - iOS `buildNumber`: a Apple recomenda um número inteiro (ex.: `"1"`) para o primeiro envio; em atualizações use `"2"`, `"3"`, etc.

- [ ] **Política de privacidade**: nas duas lojas é obrigatório informar uma **URL pública**. Use a página do frontend: `https://<seu-front>/politica-de-uso`.

- [ ] **Descadastramento**: o frontend tem a página `/descadastramento`. Use `https://<seu-front>/descadastramento` nos metadados do app ou na política, se a loja exigir link de descadastramento.

- [ ] **Screenshots e textos**: prepare descrição, palavras-chave e screenshots conforme `docs/PUBLICACAO-APP-STORES.md`.

---

## 4. Segurança e boas práticas

- [ ] **JWT_SECRET**: nunca use o valor de desenvolvimento em produção. Gere um segredo forte e guarde só no Railway (Variables).

- [ ] **HTTPS**: no Railway as URLs já são HTTPS. Não exponha a API por HTTP em produção.

- [ ] **Logs**: em produção, evite logar dados sensíveis (senhas, tokens completos). O backend já usa Logger do NestJS.

---

## 5. Após o primeiro deploy

- [ ] Testar **login** no frontend web (e se o refresh token renova após expiração do access token).
- [ ] Testar **login** no app mobile contra a API de produção.
- [ ] Testar **fluxo de pânico** (criar evento, receber como contato, áudio).
- [ ] Confirmar que os **links de áudio** dos eventos abrem (BASE_URL correto no backend).

Quando todos os itens estiverem marcados, o sistema está pronto para uso em produção e para submissão às lojas.
