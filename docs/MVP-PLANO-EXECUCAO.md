# Plano de execução – Melhorias do MVP

Plano para resolver **um por um** os pontos da análise (`MVP-ANALISE-MELHORIAS.md`). Cada item tem um número; ao concluir, marque com `[x]`.

---

## Fase 1 – Crítico (MVP funcional)

| # | Status | Área | Tarefa |
|---|--------|------|--------|
| 1 | [x] | Backend | **Device token: usar userId do JWT** – No `DeviceTokensService.register`, ignorar `ownerId` do body e usar sempre o `userId` passado pelo controller (vindo do JWT). Garantir que usuário só registre token para si. |
| 2 | [x] | Mobile | **Registrar push token após login** – Pedir permissão de notificação, obter Expo Push Token/FCM, chamar `deviceTokens.register` com `ownerType: 'USER'` e `ownerId: user.id` (token e platform). Fazer após login e após cadastro (quando já logado). |
| 3 | [x] | Mobile | **Abrir alerta ao tocar na notificação** – Usar `expo-notifications`: ao receber notificação com `panicEventId`, navegar para `/(tabs)/received/[id]`. Tratar app em foreground e em background. |
| 4 | [x] | Backend | **Rate limit em login e registro** – Aplicar `ThrottlerGuard` em `POST /auth/login` e `POST /auth/register` (ex.: 5 req/min por IP ou por corpo). Manter o que já existe em `POST /panic-events`. |

---

## Fase 2 – Recomendado (segurança e UX)

| # | Status | Área | Tarefa |
|---|--------|------|--------|
| 5 | [x] | Web | **Middleware de autenticação** – Criar `middleware.ts` no Next.js: para rotas `/dashboard/*`, verificar token (cookie ou header); se não houver, redirecionar para `/login`. Evita flash de conteúdo e acesso direto sem login. |
| 6 | [x] | Web | **Bloquear /dashboard/users para não-admin** – Na página de usuários (ou no layout), se `user.role !== 'ADMIN'`, redirecionar para `/dashboard` ou exibir tela “Sem permissão”. |
| 7 | [x] | Mobile | **401 global: redirecionar para login** – Garantir que qualquer chamada à API que retorne 401 limpe storage, limpe token e redirecione para `/login` (em todas as telas). Pode ser um wrapper da `api()` ou um hook/contexto que trate 401. |
| 8 | [x] | Backend | **Documentação da API** – Adicionar Swagger (`@nestjs/swagger`) com tags (auth, contacts, device-tokens, panic-events, users), DTOs e indicação de Bearer nas rotas protegidas. Ou doc estática em Markdown com lista de endpoints. |
| 9 | [x] | Backend | **CORS e JWT_SECRET em produção** – Usar `origin` restrito (lista de origens permitidas) quando `NODE_ENV=production`. Na subida, se produção, validar que `JWT_SECRET` está definido (e não é o fallback). |
| 10 | [x] | Backend | **DTO para PATCH /auth/me** – Criar `UpdateMeDto` com class-validator (name, endereço, etc.) e usar no `AuthController` em vez de body livre. |
| 11 | [x] | Web | **Mensagens de erro de rede e ViaCEP** – Na função `api()` ou nos catch das páginas: se erro for “Failed to fetch” / “NetworkError”, exibir “Verifique sua conexão”. No ViaCEP: em falha ou CEP inexistente, exibir mensagem clara (ex.: “CEP não encontrado” ou “Erro ao buscar endereço”). |
| 12 | [x] | Mobile | **Mensagem “Sem conexão” e “Tentar novamente”** – Detectar “Network request failed” e exibir “Sem conexão. Tente novamente.” Nas listas (contatos, alertas), em erro de carregamento, exibir botão “Tentar novamente”. |

---

## Fase 3 – Desejável (robustez e produção)

| # | Status | Área | Tarefa |
|---|--------|------|--------|
| 13 | [x] | Backend | **DATABASE_URL no schema e .env.example** – No `schema.prisma`, usar `url = env("DATABASE_URL")` com fallback ou arquivo separado para dev; documentar no `.env.example`. |
| 14 | [x] | Backend | **ExceptionFilter global** – Padronizar resposta de erro (ex.: `{ success: false, message, statusCode }`) e log centralizado. Tratar erros do Prisma (ex.: P2002 unique → 409 com mensagem). |
| 15 | [x] | Web | **Responsividade (sidebar e tabelas)** – Em telas pequenas: sidebar colapsável (menu hambúrguer) ou empilhada; tabelas com overflow horizontal ou layout em cards. |
| 16 | [ ] | Web | **Validação de formulários (email, CPF, telefone)** – Validação de formato nos campos relevantes; mensagens de erro por campo onde fizer sentido. |
| 17 | [x] | Mobile | **Refresh ao voltar (Contatos e Perfil)** – Em Contatos: `useFocusEffect` para recarregar lista ao voltar; opcional pull-to-refresh. Em Perfil: recarregar dados ao ganhar foco. Em Alertas: ao voltar do detalhe, recarregar lista para refletir “lido”. |
| 18 | [x] | Mobile | **Microfone: canAskAgain no Android** – Em `requestMicrophonePermission`, verificar `canAskAgain` quando negado; se não puder perguntar de novo, mostrar Alert com “Abrir configurações” em vez de insistir. |
| 19 | [ ] | Backend | **Testes e2e** – Pelo menos: registro, login, criar evento de pânico, listar eventos. Opcional: unitários para AuthService, ContactsService, validador CPF. |
| 20 | [x] | Mobile | **EAS Build e URL da API em produção** – Configurar `eas.json` com perfis (development, preview, production). Garantir que `EXPO_PUBLIC_API_URL` seja usado em produção e nunca localhost. |

---

## Resumo por fase

- **Fase 1:** 4 itens (1–4) – críticos para push e segurança.
- **Fase 2:** 8 itens (5–12) – proteção de rotas, 401 global, documentação, CORS, DTO, mensagens de erro.
- **Fase 3:** 8 itens (13–20) – DB URL, ExceptionFilter, responsividade, validação, refresh, permissões, testes, build.

**Total:** 20 itens.

---

## Como usar este plano

1. Resolver na ordem **1 → 2 → 3 → …** (respeitando dependências: ex. item 1 antes do 2).
2. Ao concluir cada item, marcar `[x]` na coluna Status e, se quiser, anotar em “Concluído em” ou commit.
3. Depois de concluir os itens, você pode apontar outras melhorias; o plano pode ser estendido com novos números (21, 22, …).
