import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { DeviceTokensService } from './device-tokens.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtUser } from '../auth/jwt-user.decorator';

@Controller('device-tokens')
@UseGuards(AuthGuard('jwt'))
export class DeviceTokensController {
  constructor(private deviceTokens: DeviceTokensService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  register(@JwtUser('id') userId: string, @Body() dto: RegisterDeviceTokenDto) {
    return this.deviceTokens.register(userId, dto);
  }
}
