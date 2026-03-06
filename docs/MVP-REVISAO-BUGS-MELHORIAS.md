# Revisão MVP – Bugs e melhorias (Backend, Web, Mobile)

Documento consolidado da análise do backend, painel web e app mobile para correção de bugs e melhorias antes/publicação do MVP.

---

## Backend (apps/backend)

### Bugs concretos

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `users.service.ts` | `findUniqueOrThrow` gera exceção do Prisma (P2025), não `NotFoundException`; cliente recebe 500 em vez de 404 ao editar usuário inexistente. |
| 2 | `auth.controller.ts` + `register.dto.ts` | CPF obrigatório no registro é garantido por `if (!dto.cpf)` no controller; DTO tem `cpf` opcional e sem mensagem de validação específica. |
| 3 | `contacts.controller.ts` | `GET /contacts/lookup-by-cpf/:cpf` acessível por qualquer usuário logado; permite descobrir se um CPF está cadastrado e obter nome/email (vazamento de dado). |
| 4 | `auth.service.ts` (registerAdmin) | CPF vazio `""` é armazenado; segundo admin sem CPF falha por unique. Tratar vazio como “sem CPF” e usar placeholder único. |
| 5 | `users.service.ts` | `UpdateUserDto.cpf` sem validação de formato; admin pode salvar CPF inválido (apenas dígitos removidos com `replace`). |
| 6 | `contacts.service.ts` | `update` não inclui `contactUser` no retorno; create retorna com `contactUser` — resposta inconsistente. |
| 7 | Rotas com `:id` (users, contacts, panic-events) | Falta validação de UUID; IDs malformados geram erro do Prisma e resposta 500 em vez de 400. |
| 8 | `panic-events.service.ts` | `create` retorna `findUnique` sem `include: { user }`; outros métodos incluem `user` — formato de retorno inconsistente. |
| 9 | `auth.service.ts` (register/registerAdmin) | Conflito de email/CPF já cadastrado lança `UnauthorizedException` (401); semanticamente melhor usar 409 Conflict ou 400 Bad Request. |

### Melhorias priorizadas (backend)

**Alta**
- Usar `ParseUUIDPipe` (ou equivalente) em todos os `:id` para retornar 400 para ID inválido.
- Trocar `findUniqueOrThrow` em UsersService.update por `findUnique` + `throw new NotFoundException('Usuário não encontrado')`.
- Restringir lookup por CPF: só o dono dos contatos pode buscar (ou usar apenas no fluxo de “adicionar contato” sem expor dados de terceiros).
- Usar 409 ou 400 para “email/CPF já cadastrado” em vez de 401.
- RegisterAdmin: tratar CPF vazio como ausente (placeholder único).

**Média**
- ThrottlerGuard em mais rotas (device-tokens, contacts) para evitar abuso.
- Transação no register: criar User + contatos em `prisma.$transaction`.
- Adicionar validação de CPF (ex.: `@IsCPF()`) em UpdateUserDto quando cpf presente.
- PanicEventsService.create: incluir `user` no retorno.
- ContactsService.update: incluir `contactUser` no retorno.

**Baixa**
- Timeouts em fetch (Nominatim, Expo Push).
- Índices em DeviceToken e PanicEvent conforme uso.
- CORS: em produção não usar `origin: true` se CORS_ORIGINS estiver vazio.

---

## Web (apps/web)

### Bugs concretos

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `app/dashboard/users/page.tsx` | `if (error) return <p>...</p>` — qualquer erro substitui toda a página (lista + formulários); usuário não consegue “sair” do erro sem recarregar. |
| 2 | `app/login/page.tsx` | Middleware redireciona para `/login?from=/dashboard/...`, mas após login sempre `router.push('/dashboard')`; não redireciona de volta à rota original. |
| 3 | `app/dashboard/events/[id]/page.tsx` | Texto fixo “Áudio (30s)”; deveria usar `event.audioDurationS`. |

### Melhorias priorizadas (web)

**Alta**
- Usuários: não fazer early return por `error`; mostrar erro em banner/inline e manter lista + formulários; limpar erro ao fechar modal ou trocar de ação.
- Login: usar `searchParams.get('from')` e, após login, redirecionar para esse path se for rota do dashboard; senão `/dashboard`.
- Listas vazias: mensagem “Nenhum contato” em contatos; “Nenhum usuário cadastrado” na tabela de usuários.

**Média**
- Timeout nas chamadas da API (AbortController + signal).
- Feedback de sucesso: toast ou mensagem temporária após criar/editar contato e usuário.
- Máscara de CPF nos formulários (contato e usuário).

**Baixa**
- Acessibilidade: htmlFor/id nos labels, aria-live/aria-busy onde fizer sentido.
- Tabelas em cards ou layout alternativo em mobile.

---

## Mobile (apps/mobile)

### Bugs concretos

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `app/(tabs)/received/[id].tsx` | Se `id` for `undefined` (rota inválida), o useEffect não chama a API e a tela fica em loading infinito; falta `if (!id) { setLoading(false); setError('...'); return; }`. |
| 2 | `app/register.tsx` | Um único estado `error` para CEP (blur) e para submit; erro de CEP pode ser sobrescrito ou confundir com erro do cadastro. |
| 3 | `app/(tabs)/profile.tsx` | Se `auth.me()` falhar, mostra só mensagem de erro sem botão “Tentar novamente”. |
| 4 | `app/(tabs)/received/[id].tsx` | Em falha do `get(id)` só texto de erro, sem botão de retry. |
| 5 | `app/(tabs)/contacts.tsx` | API tem `contacts.update`; não há fluxo de edição de contato (só adicionar e remover). |

### Melhorias priorizadas (mobile)

**Alta**
- Corrigir loading infinito em `received/[id]` quando `id` ausente.
- Adicionar botão “Tentar novamente” no perfil quando falha o carregamento.
- Adicionar botão “Tentar novamente” no detalhe do evento quando falha o carregamento.
- Separar estado de erro de CEP do erro geral no registro (ex.: `cepError`).

**Média**
- `Keyboard.dismiss()` antes de submit em login, registro, perfil e modal de contatos.
- Timeout nas requisições da API (ex.: 15–30s) com mensagem amigável.
- Fluxo de edição de contato (nome/telefone/e-mail) usando `contactsApi.update`.
- Feedback quando permissão de notificação é negada ou registro do push falha.

**Baixa**
- Empty state explícito na lista de contatos (“Nenhum contato cadastrado”).
- Mensagens de permissão (localização/microfone) mais claras.

---

## Resumo executivo

- **Backend:** 9 bugs listados (IDs inválidos, 404/500, lookup CPF, CPF vazio admin, respostas inconsistentes, códigos HTTP). Foco em UUID nos params, NotFoundException em users, restrição do lookup CPF e 409 para conflito de cadastro.
- **Web:** 3 bugs (tela de usuários tomada pelo erro, login ignora `from`, duração do áudio fixa). Foco em não substituir toda a tela por erro em usuários, redirecionar após login com `from` e listas vazias.
- **Mobile:** 5 bugs (loading infinito sem id, erro de CEP misturado, perfil e detalhe sem retry, sem edição de contato). Foco em tratar `id` ausente, retry em perfil e detalhe, separar erro de CEP e, se fizer parte do escopo, edição de contato.

Implementação pode ser feita por prioridade (alta primeiro) em cada camada.
