# Botão do Pânico

MVP completo de um sistema de botão de pânico: **app mobile** (Android/iOS), **API backend** e **painel web administrativo**. Tudo roda 100% local com **SQLite** e sem Docker.

---

## Objetivo

Ao pressionar o botão **PÂNICO** no app:

1. Captura geolocalização (latitude, longitude, precisão, timestamp)
2. Grava 30 segundos de áudio
3. Envia localização + áudio para o backend
4. Backend salva e dispara notificações PUSH para até 3 contatos cadastrados (FCM ou modo MOCK)

---

## Pré-requisitos

- **Node.js** 18+
- **npm** ou **yarn**
- **Expo CLI** (opcional, para rodar o app: `npm install -g expo-cli`)
- Para Android: **Android Studio** / SDK
- Para iOS: **Xcode** (apenas macOS)

---

## Estrutura do projeto (monorepo)

```
/apps
  /backend   → API NestJS (porta 3001)
  /web       → Painel Next.js (porta 3000)
  /mobile    → App Expo (React Native)
```

- **Banco:** SQLite em `apps/backend/prisma/dev.db`
- **Uploads:** áudio em `apps/backend/uploads/` (arquivo `{panicEventId}.m4a`)

---

## Como rodar

### 1. Instalar dependências

Na raiz do projeto:

```bash
npm install
```

Isso instala as dependências de todos os workspaces (`backend`, `web`, `mobile`).

### 2. Backend (API)

```bash
cd apps/backend
cp .env.example .env
# O .env precisa de DATABASE_URL (ex.: DATABASE_URL=file:./dev.db para SQLite)
npm run db:push
npm run db:seed
npm run dev
```

- API: **http://localhost:3001**
- Banco SQLite: `apps/backend/prisma/dev.db`
- Migrations: `npm run db:migrate` (ou `db:push` para aplicar schema sem arquivo de migração)

**Seeds (usuários iniciais):**

| E-mail             | Senha     | Função  |
|--------------------|-----------|---------|
| admin@example.com | Admin@123 | ADMIN   |
| user@example.com  | User@123  | USER    |

### 3. Painel Web

```bash
cd apps/web
cp .env.local.example .env.local
npm run dev
```

- Painel: **http://localhost:3000**
- Configure `NEXT_PUBLIC_API_URL=http://localhost:3001` no `.env.local` se a API estiver em outra URL.

### 4. App Mobile (Expo)

```bash
cd apps/mobile
cp .env.example .env
npm run dev
```

- Escaneie o QR Code com **Expo Go** (Android/iOS) ou use:
  - `npm run android` (após `npx expo run:android` na primeira vez)
  - `npm run ios` (apenas macOS)
- No `.env` use `EXPO_PUBLIC_API_URL=http://SEU_IP:3001` (ex.: `http://192.168.1.10:3001`) para o dispositivo/emulador acessar a API na sua rede.

---

## Fluxo completo para testar

1. **Backend:** rodar com `npm run dev` em `apps/backend` (e rodar `db:seed` se ainda não rodou).
2. **Web:** acessar http://localhost:3000 → Entrar com `admin@example.com` / `Admin@123` ou `user@example.com` / `User@123`.
3. **Mobile:** abrir o app, fazer login com `user@example.com` / `User@123`.
4. Na aba **Contatos**, cadastrar até 3 contatos (nome, telefone, e-mail).
5. Na aba **Pânico**, apertar **PÂNICO** → aguardar 3 segundos (ou cancelar) → permitir localização e microfone → aguardar 30s de gravação → envio para a API.
6. No **painel web**, em **Eventos de pânico**, conferir o novo evento, link do Google Maps e player de áudio.

---

## Push Notifications (FCM)

### Modo MOCK (padrão sem configuração)

- Se **não** houver credenciais Firebase no `.env` do backend:
  - A aplicação **não quebra**.
  - O payload do push é **logado no console** do backend.
  - Em `PanicNotificationLog` os registros ficam com `success = false` e `error = "MOCK_MODE"`.

### Ativar FCM de verdade

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Adicione um app Android e/ou iOS e baixe o arquivo de configuração (ex.: `google-services.json` / `GoogleService-Info.plist`).
3. No projeto Firebase: **Project settings** → **Service accounts** → **Generate new private key** → salve o JSON.
4. No **backend**, em `apps/backend/.env`:

   **Opção A – arquivo:**

   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./caminho/para/serviceAccountKey.json
   ```

   **Opção B – JSON inline (escapado em uma linha):**

   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

5. Reinicie o backend. Com credenciais válidas, o FCM envia o push de verdade e `PanicNotificationLog` passa a registrar `success = true` quando o envio for bem-sucedido.

Os **contatos** que devem receber o push precisam ter o app instalado e registrar o **device token** (ownerType `CONTACT`, ownerId = id do contato). O fluxo de “vincular este dispositivo a um contato” pode ser implementado em cima do endpoint `POST /device-tokens/register`.

---

## API – Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /auth/login | Login (email, password) |
| POST | /auth/register | Registro de usuário |
| POST | /auth/register-admin | Criar usuário (admin, JWT) |
| GET | /contacts | Listar contatos do usuário |
| POST | /contacts | Criar contato (máx. 3) |
| PATCH | /contacts/:id | Atualizar contato |
| DELETE | /contacts/:id | Remover contato |
| POST | /device-tokens/register | Registrar token FCM |
| POST | /panic-events | Criar evento (multipart: location + audio) |
| GET | /panic-events | Listar eventos (admin: todos; user: próprios) |
| GET | /panic-events/:id | Detalhe do evento |
| POST | /panic-events/:id/close | Encerrar evento |
| GET | /users | Listar usuários (admin) |
| PATCH | /users/:id | Atualizar usuário (admin) |
| DELETE | /users/:id | Excluir usuário (admin) |

**Áudio:** enviado em `POST /panic-events` no campo `audio` (multipart). Servido em:  
`GET http://localhost:3001/uploads/{panicEventId}.m4a`

---

## Segurança

- **JWT** para autenticação.
- **bcrypt** para hash de senha.
- **Rate limit** no endpoint de pânico (ex.: 5 req/min).
- **class-validator** para validação de entrada.
- **CORS** configurado no backend.

---

## Compatibilidade mobile

- **Android** 8+ (API 26)
- **iOS** 13+

Permissões tratadas: localização e microfone; inclusive “negada permanentemente” com opção de abrir as configurações do app.

---

## Scripts úteis

| Onde | Comando | Descrição |
|------|---------|-----------|
| Raiz | `npm run dev:backend` | Sobe o backend |
| Raiz | `npm run dev:web` | Sobe o painel web |
| Raiz | `npm run dev:mobile` | Sobe o app Expo |
| Raiz | `npm run db:migrate` | Roda migrações (backend) |
| Raiz | `npm run db:seed` | Roda seeds (backend) |
| backend | `npm run db:push` | Aplica schema Prisma no SQLite |
| backend | `npm run db:seed` | Cria admin e user de teste |

---

## Resumo do fluxo do botão pânico

1. Usuário aperta **PÂNICO** no app.
2. Contagem de **3 segundos** para cancelar.
3. App solicita permissões (localização e microfone) se necessário.
4. Captura **localização** (latitude, longitude, precisão, timestamp).
5. Grava **áudio por 30 segundos** (contador na tela).
6. Envia **multipart** para `POST /panic-events`: latitude, longitude, accuracy_m, captured_at, arquivo de áudio.
7. Backend salva o arquivo em `/uploads`, cria `PanicEvent`, busca tokens dos contatos e dispara **push** (FCM ou MOCK).
8. No **painel web** é possível ver o evento, link do Google Maps e ouvir o áudio.

Se algo falhar (permissão, rede, etc.), o app mostra mensagem de erro e o evento pode ser reenviado depois, desde que o rate limit permita.

---

## Melhorias aplicadas para o MVP

- **Painel web – Contatos:** formulário de criação de contato exige **CPF** (a pessoa precisa estar cadastrada no app). Edição continua com nome, telefone e e-mail.
- **Painel web – Usuários:** ao criar usuário (admin), o campo **CPF** é opcional; se informado, o usuário poderá ser adicionado como contato de emergência por CPF no app.
- **API web:** `auth.register` e `contacts.create` alinhados ao backend (CPF obrigatório em registro de usuário e em novo contato).

Para produção: considere restringir CORS (`origin`) no backend, usar `BASE_URL` e `JWT_SECRET` em variáveis de ambiente seguras e configurar FCM para push real.

---

## Esquema de cores (identidade visual)

| Finalidade | Cor (hex) | Uso |
|------------|-----------|-----|
| **Primary** (azul institucional) | `#005BBB` | Cabeçalho, menus principais, botões primários |
| **Text** (preto padrão) | `#000000` | Textos e títulos |
| **Background** (branco) | `#FFFFFF` | Plano de fundo geral |
| **Link / Destaque** | `#007ACC` | Links e botões secundários |
| **Gray / Subtexto** | `#666666` | Descrições menores |

- **Web:** variáveis CSS em `apps/web/app/globals.css` (`--color-primary`, `--color-text`, etc.).
- **Mobile:** objeto `colors` em `apps/mobile/lib/theme.ts`.
- O botão de **pânico** no app permanece vermelho (`#dc2626`) por convenção de emergência.
# botao-do-panico
