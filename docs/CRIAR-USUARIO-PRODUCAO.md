# Criar usuários para testar em produção (Railway)

Duas formas: **rodar o seed** (cria usuários de teste) ou **criar um usuário via API**.

---

## Opção 1: Rodar o seed no banco de produção

O seed cria dois usuários de teste:

| E-mail             | Senha     | Perfil |
|--------------------|-----------|--------|
| admin@example.com | Admin@123 | ADMIN  |
| user@example.com  | User@123  | USER   |

**Na sua máquina**, no projeto:

1. Abra o serviço **Postgres** no Railway → **Variables** (ou **Connect**) e copie a **connection string** (DATABASE_URL). Exemplo: `postgresql://postgres:SENHA@host:porta/railway`

2. No terminal, na pasta do backend:
   ```bash
   cd apps/backend
   DATABASE_URL="postgresql://postgres:SUA_SENHA@HOST:PORTA/railway" npx prisma db seed
   ```
   Substitua pela URL real do Postgres do Railway.

3. Se der certo, deve aparecer: `Seed criado: { admin: 'admin@example.com', user: 'user@example.com' }`

4. No frontend (ou app), faça login com **admin@example.com** / **Admin@123** ou **user@example.com** / **User@123**.

---

## Opção 2: Criar um usuário via API (curl)

Para criar **um usuário comum** (sem precisar de admin logado):

```bash
curl -X POST https://botao-do-panico-production.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Seu Nome",
    "email": "seu@email.com",
    "cpf": "12345678909",
    "password": "SuaSenha123"
  }'
```

Substitua:
- a URL pela URL do seu backend no Railway (se for diferente);
- nome, e-mail, CPF (11 dígitos) e senha (mín. 6 caracteres).

Resposta esperada: JSON com o usuário criado. Depois use **email** e **password** para login no frontend/app.

---

## Importar usuários da máquina local (SQLite → Postgres)

Se você tem usuários no SQLite local (`apps/backend/dev.db` ou `file:./dev.db`) e quer levá-los para o Postgres de produção:

1. Exportar do SQLite (exemplo com sqlite3 no terminal):
   ```bash
   cd apps/backend
   sqlite3 prisma/dev.db .dump
   ```
   Ou use um script que leia a tabela `User` e gere INSERTs para Postgres.

2. No Postgres de produção, as senhas estão em **password_hash** (bcrypt). O formato é igual; você pode inserir os mesmos hashes no Postgres.

3. Forma mais simples: anotar **e-mail e senha** de um usuário local e criar o mesmo usuário em produção com a **Opção 2** (curl), usando a mesma senha.
