import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

function stripCpf(value: string): string {
  return (value || '').replace(/\D/g, '');
}

function isValidCpfLength(cpf: string): boolean {
  return cpf.length === 11;
}

function allSameDigits(cpf: string): boolean {
  return /^(\d)\1{10}$/.test(cpf);
}

function isValidCpfChecksum(cpf: string): boolean {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === parseInt(cpf[10], 10);
}

export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCPF',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const cpf = stripCpf(value);
          return (
            isValidCpfLength(cpf) &&
            !allSameDigits(cpf) &&
            isValidCpfChecksum(cpf)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve ser um CPF válido (11 dígitos)`;
        },
      },
    });
  };
}

export function formatCpfForStorage(value: string): string {
  return stripCpf(value);
}
