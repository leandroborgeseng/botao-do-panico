import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { DeviceTokensService } from '../device-tokens/device-tokens.service';
import { FcmService } from './fcm.service';
import { GeocodingService } from './geocoding.service';
import { CreatePanicEventDto } from './dto/create-panic-event.dto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOADS_DIR = 'uploads';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

@Injectable()
export class PanicEventsService {
  constructor(
    private prisma: PrismaService,
    private contacts: ContactsService,
    private deviceTokens: DeviceTokensService,
    private fcm: FcmService,
    private geocoding: GeocodingService,
  ) {}

  async create(
    userId: string,
    dto: CreatePanicEventDto,
    audioBuffer?: Buffer,
  ) {
    const event = await this.prisma.panicEvent.create({
      data: {
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracyM: dto.accuracy_m,
        capturedAt: new Date(dto.captured_at),
        audioDurationS: 30,
      },
    });

    let audioUrl: string | null = null;
    if (audioBuffer && audioBuffer.length > 0) {
      const dir = join(process.cwd(), UPLOADS_DIR);
      await mkdir(dir, { recursive: true });
      const filename = `${event.id}.m4a`;
      const filepath = join(dir, filename);
      await writeFile(filepath, audioBuffer);
      audioUrl = `${BASE_URL}/uploads/${filename}`;
      await this.prisma.panicEvent.update({
        where: { id: event.id },
        data: { audioUrl },
      });
    }

    const contacts = await this.contacts.getContactsByUserId(userId);
    const contactIds = contacts.map((c: { id: string }) => c.id);
    const contactUserIds = contacts
      .map((c: { contactUserId: string | null }) => c.contactUserId)
      .filter((id: string | null): id is string => !!id);
    const tokensContact = await this.deviceTokens.getTokensForContactIds(contactIds);
    const tokensUser = await this.deviceTokens.getTokensForUserIds(contactUserIds);
    const tokens = [...new Set([...tokensContact, ...tokensUser])];
    const mapUrl = `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;
    const title = 'Botão do Pânico acionado';
    const body = `Localização: ${mapUrl}`;
    const results = await this.fcm.sendToTokens(tokens, title, body, {
      panicEventId: event.id,
      latitude: String(event.latitude),
      longitude: String(event.longitude),
      url: mapUrl,
    });
    await this.fcm.logResults(event.id, results);

    // Geocodificação reversa em background (rua, bairro, cidade)
    this.geocoding
      .reverseGeocode(event.latitude, event.longitude)
      .then((addr) => {
        if (!addr) return;
        return this.prisma.panicEvent.update({
          where: { id: event.id },
          data: {
            addressStreet: addr.street ?? null,
            addressNeighborhood: addr.neighborhood ?? null,
            addressCity: addr.city ?? null,
            addressState: addr.state ?? null,
          },
        });
      })
      .catch(() => {});

    return this.prisma.panicEvent.findUnique({
      where: { id: event.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(userId: string, isAdmin: boolean) {
    const where = isAdmin ? {} : { userId };
    return this.prisma.panicEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOne(id: string, userId: string, isAdmin: boolean) {
    const event = await this.prisma.panicEvent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        notificationLogs: true,
        readReceipts: true,
      },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    const isOwner = event.userId === userId;
    const isContact = !isOwner && !isAdmin && (await this.isContactOfEvent(id, userId));
    if (!isOwner && !isAdmin && !isContact) throw new ForbiddenException();
    if (isContact) {
      await this.recordReadReceipt(id, userId);
    }
    return this.prisma.panicEvent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        notificationLogs: true,
        readReceipts: true,
      },
    });
  }

  private async isContactOfEvent(panicEventId: string, contactUserId: string): Promise<boolean> {
    const event = await this.prisma.panicEvent.findUnique({
      where: { id: panicEventId },
      select: { userId: true },
    });
    if (!event) return false;
    const contact = await this.prisma.emergencyContact.findFirst({
      where: { userId: event.userId, contactUserId },
    });
    return !!contact;
  }

  private async recordReadReceipt(panicEventId: string, contactUserId: string): Promise<void> {
    await this.prisma.panicEventReadReceipt.upsert({
      where: {
        panicEventId_contactUserId: { panicEventId, contactUserId },
      },
      create: { panicEventId, contactUserId },
      update: {},
    });
  }

  async getNotificationStatus(panicEventId: string, userId: string) {
    const event = await this.prisma.panicEvent.findUnique({
      where: { id: panicEventId },
      include: {
        user: { select: { id: true } },
        notificationLogs: { where: { success: true }, select: { targetToken: true } },
        readReceipts: { select: { contactUserId: true, readAt: true } },
      },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    if (event.userId !== userId) throw new ForbiddenException();
    const contacts = await this.prisma.emergencyContact.findMany({
      where: { userId: event.userId },
      select: { id: true, name: true, contactUserId: true },
    });
    const successTokens = new Set(
      event.notificationLogs.map((l: { targetToken: string }) => l.targetToken),
    );
    const contactTokens = await this.prisma.deviceToken.findMany({
      where: {
        ownerType: 'USER',
        ownerId: {
          in: contacts
            .map((c: { contactUserId: string | null }) => c.contactUserId)
            .filter((id: string | null): id is string => !!id),
        },
      },
      select: { ownerId: true, token: true },
    });
    const readByContact = new Map(
      event.readReceipts.map((r: { contactUserId: string; readAt: Date }) => [
        r.contactUserId,
        r.readAt,
      ]),
    );
    const tokensByContact = new Map<string, Set<string>>();
    for (const ct of contactTokens) {
      if (!ct.ownerId) continue;
      if (!tokensByContact.has(ct.ownerId)) tokensByContact.set(ct.ownerId, new Set());
      tokensByContact.get(ct.ownerId)!.add(ct.token);
    }
    return contacts.map((c: { id: string; name: string; contactUserId: string | null }) => {
      const tokenSet = c.contactUserId ? tokensByContact.get(c.contactUserId) : null;
      const received =
        !!c.contactUserId &&
        (tokenSet ? [...tokenSet].some((t: string) => successTokens.has(t)) : false);
      const readAt: Date | undefined = c.contactUserId
        ? readByContact.get(c.contactUserId)
        : undefined;
      return {
        contactId: c.id,
        contactName: c.name,
        contactUserId: c.contactUserId,
        received,
        readAt: readAt != null ? readAt.toISOString() : null,
      };
    });
  }

  async close(id: string, userId: string, isAdmin: boolean) {
    const event = await this.prisma.panicEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento não encontrado');
    if (!isAdmin && event.userId !== userId) throw new ForbiddenException();
    return this.prisma.panicEvent.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  async findReceived(userId: string) {
    return this.prisma.panicEvent.findMany({
      where: {
        user: {
          emergencyContacts: {
            some: { contactUserId: userId },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, cpf: true } },
      },
    });
  }

  /** Preenche endereço (rua, bairro, cidade) em eventos que ainda não têm. Só admin. Respeita 1 req/s do Nominatim. */
  async backfillAddresses(): Promise<{ processed: number; updated: number }> {
    const events = await this.prisma.panicEvent.findMany({
      where: { addressCity: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, latitude: true, longitude: true },
    });
    let updated = 0;
    for (const ev of events) {
      const addr = await this.geocoding.reverseGeocode(ev.latitude, ev.longitude);
      if (addr && (addr.street || addr.neighborhood || addr.city || addr.state)) {
        await this.prisma.panicEvent.update({
          where: { id: ev.id },
          data: {
            addressStreet: addr.street ?? null,
            addressNeighborhood: addr.neighborhood ?? null,
            addressCity: addr.city ?? null,
            addressState: addr.state ?? null,
          },
        });
        updated++;
      }
      await new Promise((r) => setTimeout(r, 1100));
    }
    return { processed: events.length, updated };
  }
}
