import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { securityMiddleware } from './common/middleware/security.middleware';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './common/metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(securityMiddleware);

  app.useGlobalFilters(new GlobalExceptionFilter(app.get(Logger)));
  app.useGlobalInterceptors(
    new MetricsInterceptor(app.get(Logger), app.get(MetricsService)),
  );

  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // 同一オリジン/ツール系は origin が undefined になることがある → 許可
      if (!origin || allowed.includes('*') || allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 3100);
}

void bootstrap();
