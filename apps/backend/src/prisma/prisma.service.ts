import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Conexão em background para não atrasar o listen() e evitar 499 (timeout do proxy)
    this.$connect().catch((err) => this.logger.error('Erro ao conectar ao banco', err));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
