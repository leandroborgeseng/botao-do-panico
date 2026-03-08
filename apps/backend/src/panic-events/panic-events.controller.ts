import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { PanicEventsService } from './panic-events.service';
import { CreatePanicEventDto } from './dto/create-panic-event.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtUser } from '../auth/jwt-user.decorator';

@ApiTags('panic-events')
@Controller('panic-events')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class PanicEventsController {
  constructor(private panicEvents: PanicEventsService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async create(
    @JwtUser('id') userId: string,
    @JwtUser('role') role: string,
    @Body() dto: CreatePanicEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const audioBuffer = file?.buffer;
    return this.panicEvents.create(userId, dto, audioBuffer);
  }

  @Get()
  findAll(@JwtUser('id') userId: string, @JwtUser('role') role: string) {
    return this.panicEvents.findAll(userId, role === 'ADMIN');
  }

  @Get('received')
  findReceived(@JwtUser('id') userId: string) {
    return this.panicEvents.findReceived(userId);
  }

  @Get(':id/notification-status')
  getNotificationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @JwtUser('id') userId: string,
  ) {
    return this.panicEvents.getNotificationStatus(id, userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @JwtUser('id') userId: string,
    @JwtUser('role') role: string,
  ) {
    return this.panicEvents.findOne(id, userId, role === 'ADMIN');
  }

  @Post('backfill-addresses')
  async backfillAddresses(@JwtUser('role') role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException('Apenas administradores');
    return this.panicEvents.backfillAddresses();
  }

  @Post(':id/close')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @JwtUser('id') userId: string,
    @JwtUser('role') role: string,
  ) {
    return this.panicEvents.close(id, userId, role === 'ADMIN');
  }
}
