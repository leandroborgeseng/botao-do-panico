import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtUser } from '../auth/jwt-user.decorator';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class ContactsController {
  constructor(private contacts: ContactsService) {}

  @Get()
  findAll(@JwtUser('id') userId: string) {
    return this.contacts.findAll(userId);
  }

  @Get('lookup-by-cpf/:cpf')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 8, ttl: 60000 } })
  findByCpf(@Param('cpf') cpf: string) {
    const digits = (cpf || '').replace(/\D/g, '');
    if (digits.length !== 11) throw new BadRequestException('CPF inválido.');
    return this.contacts.findByCpf(digits);
  }

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 8, ttl: 60000 } })
  create(@JwtUser('id') userId: string, @Body() dto: CreateContactDto) {
    return this.contacts.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 12, ttl: 60000 } })
  update(
    @JwtUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contacts.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 12, ttl: 60000 } })
  remove(@JwtUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contacts.remove(userId, id);
  }
}
