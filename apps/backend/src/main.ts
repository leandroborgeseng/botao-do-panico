/* eslint-disable no-console */
console.log('[START] Iniciando backend...');
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/http-exception.filter';
import helmet from 'helmet';
import { requestIdMiddleware } from './common/request-id.middleware';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev-secret-change-in-production') {
      console.error('[FATAL] Em produção JWT_SECRET é obrigatório. Defina a variável no Railway (ex: openssl rand -base64 32).');
      process.exit(1);
    }
  }

  console.log('[START] Criando NestFactory...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Headers de segurança padrão (API)
  app.use(
    helmet({
      // CSP é mais útil para apps web servindo HTML; para API pode atrapalhar sem necessidade
      contentSecurityPolicy: false,
    }),
  );

  app.use(requestIdMiddleware);

  // Log simples de request (sem mudar lógica)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const requestId = (req as unknown as { requestId?: string }).requestId ?? '-';
      console.log(
        `[${requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`,
      );
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
      // Com credentials: true o navegador não aceita *. Refletir a origem da requisição permite qualquer frontend.
      console.warn('[CORS] CORS_ORIGINS não definido; aceitando qualquer origem (recomendado: defina no Railway).');
      corsOrigin = (_origin: string, callback: (err: Error | null, allow?: boolean) => void) => callback(null, true);
    }
  }
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const uploadsPath = join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  const port = parseInt(process.env.PORT ?? '3001', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  console.log(`[START] Ouvindo em ${host}:${port} (PORT=${process.env.PORT})`);
  await app.listen(port, host);
  console.log(`[OK] Backend running at http://${host}:${port}`);
}

process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] unhandledRejection:', reason, promise);
  process.exit(1);
});

bootstrap()
  .then(() => console.log('[START] Bootstrap concluído.'))
  .catch((err) => {
    console.error('[FATAL] Falha ao iniciar:', err?.stack || err);
    process.exit(1);
  });
