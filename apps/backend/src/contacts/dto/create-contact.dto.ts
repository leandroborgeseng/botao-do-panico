import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { IsCPF } from '../../common/validators/cpf.validator';

export class CreateContactDto {
  @IsCPF()
  cpf: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
