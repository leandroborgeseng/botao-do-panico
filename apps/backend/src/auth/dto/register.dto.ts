import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { IsCPF } from '../../common/validators/cpf.validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsCPF()
  cpf?: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  /** Se true, usuário é apenas contato de apoio e não cadastra contatos de emergência */
  @IsOptional()
  @IsBoolean()
  supportOnly?: boolean;

  /** Até 3 CPFs de contatos de emergência (somente se supportOnly for false) */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(3)
  contactCpfs?: string[];

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;
}
