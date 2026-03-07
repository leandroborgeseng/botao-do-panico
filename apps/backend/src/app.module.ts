import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { DeviceTokensModule } from './device-tokens/device-tokens.module';
import { PanicEventsModule } from './panic-events/panic-events.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
    ]),
    PrismaModule,
    AuthModule,
    ContactsModule,
    DeviceTokensModule,
    PanicEventsModule,
    UsersModule,
  ],
  controllers: [AppController, HealthController],
})
export class AppModule {}
