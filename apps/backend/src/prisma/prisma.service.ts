import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Conexão em background para não atrasar o listen() e evitar 499 (timeout do proxy)
    this.$connect().catch((err) => console.error('[Prisma] Erro ao conectar:', err));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
