# API – Botão do Pânico

Base URL: `http://localhost:3001` (ou `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL` em produção).

## Autenticação

Rotas protegidas exigem o header: `Authorization: Bearer <token>`.

- **POST /auth/login** (público)  
  Body: `{ "email": string, "password": string }`  
  Retorno: `{ "access_token": string, "user": User }`

- **POST /auth/register** (público)  
  Body: `{ "name", "email", "cpf", "password", "supportOnly?", "contactCpfs?", "cep?", "street?", "number?", "complement?", "neighborhood?", "city?", "state?" }`  
  Retorno: `{ "user": User, "notFoundCpfs"?: string[] }`

- **GET /auth/me** (protegido)  
  Retorno: `User`

- **PATCH /auth/me** (protegido)  
  Body: `{ "name"?, "cep"?, "street"?, "number"?, "complement"?, "neighborhood"?, "city"?, "state"? }`  
  Retorno: `User`

- **POST /auth/register-admin** (protegido, ADMIN)  
  Body: mesmo formato de register (sem contactCpfs). Cria usuário admin.

---

## Contatos de emergência

- **GET /contacts** (protegido)  
  Retorno: lista de contatos do usuário.

- **GET /contacts/lookup-by-cpf/:cpf** (protegido)  
  Retorno: `{ id, name, email, cpf } | null`

- **POST /contacts** (protegido)  
  Body: `{ "cpf", "name"?, "phone"?, "email"? }`  
  Máximo 3 contatos.

- **PATCH /contacts/:id** (protegido)  
  Body: `{ "name"?, "phone"?, "email"? }`

- **DELETE /contacts/:id** (protegido)

---

## Device tokens (push)

- **POST /device-tokens/register** (protegido)  
  Body: `{ "token": string, "platform": "android" | "ios" | "web" }`  
  O backend associa o token ao usuário do JWT.

---

## Eventos de pânico

- **POST /panic-events** (protegido, rate limit 5/min)  
  Body (multipart): `latitude`, `longitude`, `accuracy_m`, `captured_at`; opcional `audio` (arquivo).  
  Retorno: evento criado. Dispara push para contatos e geocodificação reversa em background.

- **GET /panic-events** (protegido)  
  Retorno: lista de eventos (do usuário ou todos se ADMIN).

- **GET /panic-events/received** (protegido)  
  Retorno: eventos em que o usuário é contato de emergência.

- **GET /panic-events/:id** (protegido)  
  Retorno: detalhe do evento. Se o usuário for contato, registra leitura (read receipt).

- **GET /panic-events/:id/notification-status** (protegido, dono do evento)  
  Retorno: status de notificação por contato (recebido, lido).

- **POST /panic-events/:id/close** (protegido)  
  Encerra o evento (dono ou ADMIN).

- **POST /panic-events/backfill-addresses** (protegido, ADMIN)  
  Preenche endereço (rua, bairro, cidade) em eventos antigos. Retorno: `{ processed, updated }`.

---

## Usuários (ADMIN)

- **GET /users** (protegido, ADMIN)  
  Retorno: lista de usuários.

- **GET /users/:id** (protegido, ADMIN)  
  Retorno: usuário.

- **PATCH /users/:id** (protegido, ADMIN)  
  Body: campos editáveis do usuário.

- **DELETE /users/:id** (protegido, ADMIN)

---

## Respostas de erro

Padrão: `{ "success": false, "statusCode": number, "message": string }`.

- 400: validação ou requisição inválida  
- 401: não autorizado (token inválido ou ausente)  
- 403: sem permissão  
- 404: recurso não encontrado  
