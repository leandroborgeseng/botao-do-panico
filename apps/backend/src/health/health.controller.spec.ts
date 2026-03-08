import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('GET /health deve retornar ok e db: ok quando o banco responde', async () => {
    prisma.$queryRaw.mockResolvedValue(undefined);
    const result = await controller.health();
    expect(result).toMatchObject({ ok: true, db: 'ok' });
    expect(result).toHaveProperty('timestamp');
  });

  it('GET /health deve lançar ServiceUnavailableException quando o banco falha', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    await expect(controller.health()).rejects.toThrow(ServiceUnavailableException);
  });
});
