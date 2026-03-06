import { BadRequestException, Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { JwtUser } from './jwt-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@JwtUser('id') userId: string) {
    return this.auth.getMe(userId);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateMe(@JwtUser('id') userId: string, @Body() body: UpdateMeDto) {
    return this.auth.updateMe(userId, body);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    if (!dto.cpf) throw new BadRequestException('CPF é obrigatório');
    return this.auth.register(
      dto.name,
      dto.email,
      dto.cpf,
      dto.password,
      {
        cep: dto.cep,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
      },
      dto.supportOnly ?? false,
      dto.contactCpfs,
    );
  }

  @Post('register-admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async registerAdmin(@Body() dto: RegisterDto) {
    return this.auth.registerAdmin(dto.name, dto.email, dto.password, dto.cpf, {
      cep: dto.cep,
      street: dto.street,
      number: dto.number,
      complement: dto.complement,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
    });
  }
}
