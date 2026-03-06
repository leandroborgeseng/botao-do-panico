# Análise do MVP – Botão do Pânico

Documento gerado a partir da análise do backend, painel web e app mobile. Objetivo: listar o que está pronto e o que falta ou pode ser melhorado para chegar a um **MVP sólido**.

---

## Resumo executivo

| Área | Estado | Crítico para MVP |
|------|--------|------------------|
| **Push no celular** | App **nunca** registra device token; contatos não recebem notificação | **Sim** |
| **Segurança (device token)** | Backend aceita `ownerId` do body; usuário pode registrar token de outro | **Sim** |
| **Rate limit em login/registro** | Só existe no endpoint de pânico; login/registro sem throttle | **Sim** |
| **Proteção de rotas (web)** | Só no cliente; sem middleware; flash de conteúdo antes do redirect | Recomendado |
| **Página Usuários (web)** | Não-admin pode abrir URL diretamente | Recomendado |
| **401 global (mobile)** | 401 limpa sessão mas não redireciona para login em todas as telas | Recomendado |
| **Documentação da API** | Inexistente (Swagger ou doc estática) | Recomendado |
| **Testes** | Nenhum (backend e mobile) | Desejável |
| **Config produção** | DATABASE_URL, JWT_SECRET obrigatório, CORS restrito | Desejável |

---

## 1. Crítico: notificações push no app

**Problema:** O backend envia FCM para os contatos do usuário que acionou o pânico, mas o app mobile **nunca** chama `deviceTokens.register`. Ou seja, não há tokens cadastrados e ninguém recebe push no celular.

**O que fazer:**

- No app (Expo): após login (e opcionalmente ao obter permissão de notificação):
  1. Pedir permissão de notificação (`expo-notifications`).
  2. Obter o token (Expo Push Token / FCM).
  3. Chamar `deviceTokens.register({ token, platform: 'ios'|'android', ownerType: 'USER', ownerId: user.id })`.
- Ao tocar na notificação, abrir a tela do alerta: `/(tabs)/received/[panicEventId]` (e o GET do evento já marca como lido).
- Backend: **não** confiar em `ownerId` vindo do body; usar sempre o `userId` do JWT para `ownerType: 'USER'`. Assim um usuário não pode registrar token em nome de outro.

**Prioridade:** Máxima. Sem isso, o fluxo “contato recebe alerta no celular” não funciona.

---

## 2. Backend – melhorias

### 2.1 Segurança

- **Device token:** No `DeviceTokensController`, passar apenas `userId` do JWT para o service; no `DeviceTokensService.register`, usar esse `userId` como `ownerId` quando `ownerType === 'USER'`, ignorando o body. Para contatos (se no futuro um “contato” registrar o próprio app), definir regra clara (ex.: só o próprio usuário ou admin).
- **Rate limit:** Aplicar `ThrottlerGuard` em `POST /auth/login` e `POST /auth/register` (ou globalmente) para reduzir risco de brute force.
- **CORS:** Em produção, restringir `origin` a domínios conhecidos (painel e app), em vez de `origin: true`.
- **JWT_SECRET:** Em produção, não usar fallback; validar na subida que `JWT_SECRET` está definido.

### 2.2 Configuração e ambiente

- **DATABASE_URL:** Usar `env("DATABASE_URL")` no `schema.prisma` e documentar no `.env.example`, permitindo PostgreSQL em produção sem mudar código.
- **.env.example:** Deixar explícitas variáveis obrigatórias (ex.: `JWT_SECRET`) e opcionais (FCM, BASE_URL).

### 2.3 Validação e erros

- **PATCH /auth/me:** Criar um DTO com class-validator (nome, endereço, etc.) em vez de aceitar body livre.
- **ExceptionFilter global:** Padronizar corpo de erro (ex.: `{ success: false, message, code }`) e log centralizado.
- **Prisma:** Tratar erros como P2002 (unique) e retornar 409 ou 400 com mensagem clara.

### 2.4 Documentação e testes

- **API:** Adicionar Swagger (ou doc estática em Markdown) com rotas, DTOs e indicação de rotas públicas vs protegidas (Bearer).
- **Testes:** Pelo menos e2e para: registro, login, criar evento de pânico, listar eventos. Opcional: unitários para AuthService, ContactsService, validador de CPF.

---

## 3. Painel web – melhorias

### 3.1 Autenticação e rotas

- **Middleware Next.js:** Proteger rotas do dashboard no servidor (verificar token/cookie) para evitar flash de conteúdo e acesso direto a `/dashboard/*` sem login.
- **Página Usuários:** Bloquear acesso para não-admin: ao carregar `/dashboard/users`, se `user.role !== 'ADMIN'`, redirecionar para `/dashboard` ou exibir “Sem permissão”.

### 3.2 Formulários e erros

- **Validação:** Validação de formato de e-mail, CPF e telefone onde aplicável; mensagens de erro por campo.
- **ViaCEP:** Em falha (rede ou CEP inexistente), exibir mensagem clara em vez de apenas remover o “Buscando...”.
- **Erro de rede:** Quando `fetch` falhar (ex.: “Failed to fetch”), exibir mensagem do tipo “Verifique sua conexão” em vez da mensagem bruta.

### 3.3 UX e acessibilidade

- **Responsividade:** Sidebar em telas pequenas (menu colapsável/hambúrguer); tabelas com scroll horizontal ou layout adaptado.
- **Acessibilidade:** Uso de `aria-live` para erros dinâmicos, `aria-busy` em loading, descrições em botões/links importantes (ex.: “Encerrar evento”).
- **Token expirado (opcional):** Ao detectar 401, exibir brevemente “Sessão expirada” antes de redirecionar para o login.

---

## 4. App mobile – melhorias

### 4.1 Sessão e 401

- **Redirecionamento global em 401:** Garantir que, em **qualquer** tela, quando a API retornar 401 (ex.: “Sessão expirada”), o app limpe o storage e redirecione para `/login`, em vez de apenas mostrar erro na tela atual.
- **User no boot (opcional):** Restaurar também o objeto `user` do AsyncStorage no boot para exibir nome/avatar sem chamar `auth.me()` imediatamente.

### 4.2 Permissões

- **Notificações:** Já coberto no item 1 (obrigatório para push).
- **Microfone (Android):** Verificar `canAskAgain` ao negar microfone, para não insistir quando o usuário negou permanentemente.

### 4.3 Erros e feedback

- **Rede indisponível:** Detectar “Network request failed” (e similares) e exibir “Sem conexão. Tente novamente.”
- **Listas:** Em telas de lista (contatos, alertas), em caso de erro de carregamento, exibir botão “Tentar novamente”.
- **Retry:** Avaliar retry automático (com backoff) em falhas de rede para ações críticas (ex.: envio do pânico), com limite para não ficar em loop.

### 4.4 Refresh de dados

- **Contatos:** Usar `useFocusEffect` (e/ou pull-to-refresh) para recarregar a lista ao voltar da tela de adicionar ou de outra tab.
- **Perfil:** Recarregar dados ao ganhar foco (ex.: após editar em outra tela).
- **Alertas recebidos:** Após voltar do detalhe (onde o backend marca como lido), invalidar/recarregar a lista para refletir “lido” sem depender só do pull-to-refresh.

### 4.5 Funcionalidades opcionais para MVP

- **Esqueci a senha:** Fluxo de recuperação (backend: endpoint + email ou link; app: tela “Esqueci senha”).
- **Trocar senha:** No perfil, opção “Alterar senha” (backend: endpoint PATCH /auth/me com senha atual + nova).
- **Detalhe do alerta (contato):** Botão “Encerrar evento” se o backend permitir que o contato encerre (e o backend tiver essa regra).

### 4.6 Build e produção

- **EAS Build:** Configurar `eas.json` e perfis de build (development, preview, production).
- **URL da API:** Garantir que em produção o app use `EXPO_PUBLIC_API_URL` (ou equivalente) apontando para a API real, nunca localhost.
- **Testes:** Pelo menos unitários para helpers (CPF, CEP, ViaCEP, storage) e um ou dois fluxos de integração (login, lista de alertas).

---

## 5. Ordem sugerida de implementação

1. **Push e device token (app + backend)**  
   Registrar token no backend após login; usar `userId` do JWT no backend; abrir `/received/[id]` ao tocar na notificação.

2. **Segurança mínima no backend**  
   Rate limit em login/registro; device token com ownerId do JWT; CORS e JWT_SECRET em produção.

3. **Proteção de rotas no painel**  
   Middleware de auth; bloqueio de `/dashboard/users` para não-admin.

4. **401 global no app**  
   Redirecionar para login em qualquer 401.

5. **Documentação da API**  
   Swagger ou Markdown com endpoints e exemplos.

6. **Ajustes de UX**  
   Mensagens de erro de rede e ViaCEP no web; “Tentar novamente” e refresh em listas no mobile.

7. **Testes e build**  
   E2e no backend; testes no mobile; EAS e env de produção.

---

## 6. O que já está bem resolvido

- Fluxos principais: login, cadastro (com apoio/suporte e contatos por CPF), botão de pânico (confirmação, áudio, envio), contatos, perfil, alertas recebidos (lista + detalhe com mapa e endereço).
- Backend: módulos bem separados, JWT, roles, validação com DTOs, geocodificação reversa e backfill de endereços.
- Painel: dashboard com mapa de ocorrências, lista unificada de eventos, detalhe com mapa e áudio, backfill para admin, CRUD de contatos com busca por CPF.
- Mobile: permissões de localização e microfone tratadas; tema e design consistentes; polling de status do pânico; pull-to-refresh em alertas.
- Sincronização entre web e app (regra fullstack-sync): backend e painel acompanham as funcionalidades do app.

Com as correções críticas (push + device token + segurança) e as melhorias prioritárias acima, o produto fica em condições sólidas de MVP para uso real (incluindo implantação piloto com a Prefeitura de Franca).
