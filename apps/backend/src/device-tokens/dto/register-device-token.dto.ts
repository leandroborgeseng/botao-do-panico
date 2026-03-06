import { IsIn, IsString } from 'class-validator';

/** Apenas token e platform; ownerType e ownerId vêm do JWT (sempre USER + userId). */
export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsIn(['android', 'ios', 'web'])
  platform: string;
}
