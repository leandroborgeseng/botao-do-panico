import { Module } from '@nestjs/common';
import { PanicEventsController } from './panic-events.controller';
import { PanicEventsService } from './panic-events.service';
import { FcmService } from './fcm.service';
import { GeocodingService } from './geocoding.service';
import { ContactsModule } from '../contacts/contacts.module';
import { DeviceTokensModule } from '../device-tokens/device-tokens.module';

@Module({
  imports: [ContactsModule, DeviceTokensModule],
  controllers: [PanicEventsController],
  providers: [PanicEventsService, FcmService, GeocodingService],
  exports: [PanicEventsService],
})
export class PanicEventsModule {}
