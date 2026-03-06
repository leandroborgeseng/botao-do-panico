import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { formatCpfForStorage } from '../common/validators/cpf.validator';

const MAX_CONTACTS = 3;

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { contactUser: { select: { id: true, name: true, email: true, cpf: true } } },
    });
  }

  async create(userId: string, dto: CreateContactDto) {
    const count = await this.prisma.emergencyContact.count({ where: { userId } });
    if (count >= MAX_CONTACTS) {
      throw new BadRequestException(`Máximo de ${MAX_CONTACTS} contatos permitidos.`);
    }
    const cpfNorm = formatCpfForStorage(dto.cpf);
    const contactUser = await this.prisma.user.findUnique({ where: { cpf: cpfNorm } });
    if (!contactUser) {
      throw new BadRequestException('Nenhum usuário encontrado com este CPF. A pessoa precisa estar cadastrada no app.');
    }
    if (contactUser.id === userId) {
      throw new BadRequestException('Você não pode adicionar a si mesmo como contato.');
    }
    const existing = await this.prisma.emergencyContact.findFirst({
      where: { userId, cpf: cpfNorm },
    });
    if (existing) {
      throw new BadRequestException('Este CPF já está na sua lista de contatos.');
    }
    return this.prisma.emergencyContact.create({
      data: {
        userId,
        cpf: cpfNorm,
        name: dto.name ?? contactUser.name,
        phone: dto.phone ?? '',
        email: dto.email ?? contactUser.email,
        contactUserId: contactUser.id,
      },
      include: { contactUser: { select: { id: true, name: true, email: true, cpf: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateContactDto) {
    await this.ensureOwnership(userId, id);
    return this.prisma.emergencyContact.update({
      where: { id },
      data: dto,
      include: { contactUser: { select: { id: true, name: true, email: true, cpf: true } } },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwnership(userId, id);
    return this.prisma.emergencyContact.delete({ where: { id } });
  }

  private async ensureOwnership(userId: string, contactId: string) {
    const contact = await this.prisma.emergencyContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
    if (contact.userId !== userId) throw new ForbiddenException();
  }

  async findByCpf(cpf: string) {
    const cpfNorm = formatCpfForStorage(cpf);
    const user = await this.prisma.user.findUnique({
      where: { cpf: cpfNorm },
      // Retorna o mínimo necessário para evitar vazamento de dados (ex.: email)
      select: { id: true, name: true, cpf: true },
    });
    return user ?? null;
  }

  /**
   * Cria contato de emergência a partir do CPF se o usuário existir no sistema.
   * Usado no fluxo de cadastro. Retorna o contato criado ou null se CPF não encontrado.
   */
  async createFromCpfIfExists(ownerId: string, cpf: string) {
    const cpfNorm = formatCpfForStorage(cpf);
    const count = await this.prisma.emergencyContact.count({ where: { userId: ownerId } });
    if (count >= MAX_CONTACTS) return null;
    const contactUser = await this.prisma.user.findUnique({ where: { cpf: cpfNorm } });
    if (!contactUser || contactUser.id === ownerId) return null;
    const existing = await this.prisma.emergencyContact.findFirst({
      where: { userId: ownerId, cpf: cpfNorm },
    });
    if (existing) return existing;
    return this.prisma.emergencyContact.create({
      data: {
        userId: ownerId,
        cpf: cpfNorm,
        name: contactUser.name,
        phone: '',
        email: contactUser.email,
        contactUserId: contactUser.id,
      },
      include: { contactUser: { select: { id: true, name: true, email: true, cpf: true } } },
    });
  }

  async getContactsByUserId(userId: string) {
    return this.prisma.emergencyContact.findMany({
      where: { userId },
      select: { id: true, contactUserId: true },
    });
  }
}
