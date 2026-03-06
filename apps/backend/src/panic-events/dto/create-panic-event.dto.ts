import { IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePanicEventDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @Type(() => Number)
  @IsNumber()
  accuracy_m: number;

  @IsString()
  @IsDateString()
  captured_at: string;
}
