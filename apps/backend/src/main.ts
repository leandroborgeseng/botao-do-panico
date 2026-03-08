import { randomBytes } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/http-exception.filter';
import helmet from 'helmet';
import { requestIdMiddleware } from './common/request-id.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !process.env.DATABASE_URL?.trim()) {
    logger.error('DATABASE_URL é obrigatória em produção. Defina no Railway → Backend → Variables.');
    process.exit(1);
  }
  if (isProduction) {
    const raw = process.env.JWT_SECRET;
    const secret = typeof raw === 'string' ? raw.trim() : '';
    const definido = secret.length > 0 && secret !== 'dev-secret-change-in-production';
    logger.log(definido ? `JWT_SECRET definido (${secret.length} caracteres)` : 'JWT_SECRET ausente ou inválido');
    if (definido) {
      process.env.JWT_SECRET = secret;
    } else {
      process.env.JWT_SECRET = randomBytes(32).toString('hex');
      logger.warn('Usando JWT_SECRET temporário. Defina em Railway → Backend → Variables.');
    }
  }

  logger.log('Criando NestFactory...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Headers de segurança padrão (API)
  app.use(
    helmet({
      // CSP é mais útil para apps web servindo HTML; para API pode atrapalhar sem necessidade
      contentSecurityPolicy: false,
    }),
  );

  app.use(requestIdMiddleware);

  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const requestId = (req as unknown as { requestId?: string }).requestId ?? '-';
      httpLogger.log(`${requestId} ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
    });
    next();
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  let corsOrigin: string[] | true | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void) = true;
  if (isProduction) {
    const parsed = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
    if (parsed && parsed.length > 0) {
      corsOrigin = parsed;
    } else {
      logger.warn('CORS_ORIGINS não definido; aceitando qualquer origem.');
      corsOrigin = (_origin: string, callback: (err: Error | null, allow?: boolean) => void) => callback(null, true);
    }
  }
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const uploadsPath = join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Botão do Pânico API')
    .setDescription('API do painel e app Botão do Pânico. Autenticação via Bearer JWT.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.PORT ?? '3001', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  logger.log(`Backend rodando em http://${host}:${port}`);
}

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('unhandledRejection', reason, promise);
  process.exit(1);
});

bootstrap()
  .then(() => logger.log('Bootstrap concluído.'))
  .catch((err) => {
    logger.error('Falha ao iniciar', err?.stack ?? err);
    process.exit(1);
  });
