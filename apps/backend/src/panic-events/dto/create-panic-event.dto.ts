import { IsNumber, IsString, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePanicEventDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90, { message: 'Latitude deve estar entre -90 e 90.' })
  @Max(90, { message: 'Latitude deve estar entre -90 e 90.' })
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180, { message: 'Longitude deve estar entre -180 e 180.' })
  @Max(180, { message: 'Longitude deve estar entre -180 e 180.' })
  longitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Precisão (accuracy_m) deve ser maior ou igual a 0.' })
  @Max(100_000, { message: 'Precisão (accuracy_m) deve ser no máximo 100000 metros.' })
  accuracy_m: number;

  @IsString()
  @IsDateString()
  captured_at: string;
}
