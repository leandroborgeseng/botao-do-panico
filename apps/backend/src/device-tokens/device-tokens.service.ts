import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class DeviceTokensService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra token do dispositivo para o usuário autenticado.
   * Sempre usa ownerType 'USER' e ownerId do JWT; ignora qualquer valor vindo do body (segurança).
   */
  async register(userId: string, dto: RegisterDeviceTokenDto) {
    const existing = await this.prisma.deviceToken.findFirst({
      where: {
        token: dto.token,
        ownerType: 'USER',
        ownerId: userId,
      },
    });
    if (existing) {
      return this.prisma.deviceToken.update({
        where: { id: existing.id },
        data: { platform: dto.platform },
      });
    }
    return this.prisma.deviceToken.create({
      data: {
        token: dto.token,
        platform: dto.platform,
        ownerType: 'USER',
        ownerId: userId,
      },
    });
  }

  async getTokensForContactIds(contactIds: string[]): Promise<string[]> {
    if (contactIds.length === 0) return [];
    const tokens = await this.prisma.deviceToken.findMany({
      where: {
        ownerType: 'CONTACT',
        ownerId: { in: contactIds },
      },
      select: { token: true },
    });
    return [...new Set(tokens.map((t: { token: string }) => t.token))];
  }

  async getTokensForUserIds(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const tokens = await this.prisma.deviceToken.findMany({
      where: {
        ownerType: 'USER',
        ownerId: { in: userIds },
      },
      select: { token: true },
    });
    return [...new Set(tokens.map((t: { token: string }) => t.token))];
  }
}
