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

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
  if (isProduction && (!allowedOrigins || allowedOrigins.length === 0)) {
    console.error('Em produção defina CORS_ORIGINS (separado por vírgula).');
    process.exit(1);
  }
  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
  });

  if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-in-production')) {
    console.error('Em produção defina JWT_SECRET e não use o valor de desenvolvimento.');
    process.exit(1);
  }

  const uploadsPath = join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  const port = process.env.PORT || 3001;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`Backend running at http://${host}:${port}`);
}

bootstrap();
