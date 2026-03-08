import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock };
    refreshToken: { create: jest.Mock };
  };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      refreshToken: { create: jest.fn().mockResolvedValue({}) },
    };
    jwt = { sign: jest.fn().mockReturnValue('fake-access-token') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ContactsService, useValue: {} },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('x@x.com', 'senha')).rejects.toThrow(UnauthorizedException);
    });

    it('deve retornar access_token e refresh_token quando credenciais válidas', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('senha123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        role: 'USER',
        active: true,
        cpf: '12345678901',
        supportOnly: false,
        passwordHash: hash,
        cep: null,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        createdAt: new Date(),
      });

      const result = await service.login('test@test.com', 'senha123');
      expect(result).toHaveProperty('access_token', 'fake-access-token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@test.com');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });
});
