import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const userHash = await bcrypt.hash('User@123', 10);
  const leandroHash = await bcrypt.hash('Lean777$', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { cpf: '00000000191' },
    create: {
      name: 'Administrador',
      email: 'admin@example.com',
      cpf: '00000000191',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { cpf: '00000000202' },
    create: {
      name: 'Usuário Teste',
      email: 'user@example.com',
      cpf: '00000000202',
      passwordHash: userHash,
      role: 'USER',
    },
  });

  const leandro = await prisma.user.upsert({
    where: { email: 'leandro.borges@me.com' },
    update: { passwordHash: leandroHash, role: 'ADMIN' },
    create: {
      name: 'Leandro Borges',
      email: 'leandro.borges@me.com',
      cpf: '00000000303',
      passwordHash: leandroHash,
      role: 'ADMIN',
    },
  });

  console.log('Seed criado:', { admin: admin.email, user: user.email, leandro: leandro.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
