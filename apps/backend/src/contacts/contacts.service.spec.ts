import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();
    service = module.get<ContactsService>(ContactsService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findByCpf', () => {
    it('deve retornar { exists: true, name } quando usuário existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ name: 'João Silva' });
      const result = await service.findByCpf('12345678901');
      expect(result).toEqual({ exists: true, name: 'João Silva' });
    });

    it('deve retornar { exists: false } quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByCpf('99999999999');
      expect(result).toEqual({ exists: false });
    });
  });
});
