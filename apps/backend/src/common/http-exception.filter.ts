import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno';

    // Multer: tamanho do arquivo excedido (ex.: áudio > 10 MB)
    const errCode = (exception as { code?: string } | null)?.code;
    if (errCode === 'LIMIT_FILE_SIZE') {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Arquivo de áudio muito grande. O tamanho máximo é 10 MB.';
    } else if (typeof errCode === 'string') {
      // Prisma: evita 500 desnecessário e não vaza detalhes internos
      switch (errCode) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          message = 'Já existe um registro com esse valor.';
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado.';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = 'Erro de banco de dados.';
        }
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      message = typeof payload === 'string' ? payload : (payload as { message?: string | string[] })?.message as string ?? message;
      if (Array.isArray(message)) message = message[0] ?? message;
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      message: typeof message === 'string' ? message : 'Erro na requisição',
    });
  }
}
