import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { formatCpfForStorage } from '../common/validators/cpf.validator';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RegisterResult {
  user: { id: string; name: string; email: string; role: string; cpf: string; supportOnly?: boolean };
  notFoundCpfs?: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private contacts: ContactsService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    return {
      access_token: this.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      } as JwtPayload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf,
        supportOnly: user.supportOnly,
        cep: user.cep,
        street: user.street,
        number: user.number,
        complement: user.complement,
        neighborhood: user.neighborhood,
        city: user.city,
        state: user.state,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpf: true,
        supportOnly: true,
        cep: true,
        street: true,
        number: true,
        complement: true,
        neighborhood: true,
        city: true,
        state: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateMe(
    userId: string,
    data: {
      name?: string;
      cep?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpf: true,
        cep: true,
        street: true,
        number: true,
        complement: true,
        neighborhood: true,
        city: true,
        state: true,
      },
    });
  }

  async registerAdmin(
    name: string,
    email: string,
    password: string,
    cpf?: string,
    address?: {
      cep?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email já cadastrado');
    const cpfNorm = cpf && String(cpf).trim() ? formatCpfForStorage(cpf) : undefined;
    if (cpfNorm) {
      const existingCpf = await this.prisma.user.findUnique({ where: { cpf: cpfNorm } });
      if (existingCpf) throw new ConflictException('CPF já cadastrado');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        cpf: cpfNorm ?? `admin-${Date.now()}`,
        passwordHash,
        role: 'ADMIN',
        ...address,
      },
    });
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async register(
    name: string,
    email: string,
    cpf: string,
    password: string,
    address?: {
      cep?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    },
    supportOnly = false,
    contactCpfs?: string[],
  ): Promise<RegisterResult> {
    const cpfNorm = formatCpfForStorage(cpf);
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new ConflictException('Email já cadastrado');
    const existingCpf = await this.prisma.user.findUnique({ where: { cpf: cpfNorm } });
    if (existingCpf) throw new ConflictException('CPF já cadastrado');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        cpf: cpfNorm,
        passwordHash,
        role: 'USER',
        supportOnly: !!supportOnly,
        ...address,
      },
    });

    const notFoundCpfs: string[] = [];
    if (!supportOnly && contactCpfs?.length) {
      const normalizedCpfs = contactCpfs.map((c) => formatCpfForStorage(c)).filter((c) => c.length === 11);
      for (const contactCpf of normalizedCpfs) {
        const created = await this.contacts.createFromCpfIfExists(user.id, contactCpf);
        if (!created) notFoundCpfs.push(contactCpf);
      }
    }

    const { passwordHash: _, supportOnly: so, ...safeUser } = user;
    return {
      user: { ...safeUser, supportOnly: so },
      ...(notFoundCpfs.length > 0 && { notFoundCpfs }),
    };
  }
}
