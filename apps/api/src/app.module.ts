import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { GithubModule } from './modules/github/github.module';
import { CacheModule } from './modules/cache/cache.module';
import { QiitaModule } from './modules/qiita/qiita.module';
import { ContactModule } from './modules/contact/contact.module';
import { AIArticlesModule } from './modules/ai-articles/ai-articles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().port().default(3100),
        GITHUB_TOKEN: Joi.string().allow('').default(''),
        GITHUB_USERNAME: Joi.string().trim().min(1).required(),
        QIITA_TOKEN: Joi.string().allow('').default(''),
        QIITA_USER_ID: Joi.string().trim().min(1).required(),
        RECAPTCHA_SECRET_KEY: Joi.string().allow('').default(''),
        RESEND_API_KEY: Joi.string().allow('').default(''),
        RESEND_FROM: Joi.when('RESEND_API_KEY', {
          is: Joi.string().min(1),
          then: Joi.string().min(1).required(),
          otherwise: Joi.string().empty('').default('noreply@example.com'),
        }),
        RESEND_TO: Joi.when('RESEND_API_KEY', {
          is: Joi.string().min(1),
          then: Joi.string().email().required(),
          otherwise: Joi.string().empty('').default('admin@example.com'),
        }),
        AI_ARTICLES_REFRESH_API_KEY: Joi.string().allow('').default(''),
        GITHUB_CONTRIBUTIONS_REFRESH_API_KEY: Joi.string()
          .allow('')
          .default(''),
      }),
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV');
        return {
          pinoHttp: {
            level: nodeEnv === 'development' ? 'info' : 'warn',
            transport:
              nodeEnv === 'development'
                ? {
                    target: 'pino-pretty',
                    options: { colorize: true, singleLine: true },
                  }
                : undefined,
          },
        };
      },
    }),
    ScheduleModule.forRoot(),
    CacheModule,
    HealthModule,
    MetricsModule,
    GithubModule,
    QiitaModule,
    ContactModule,
    AIArticlesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          transformOptions: { enableImplicitConversion: true },
        }),
    },
  ],
})
export class AppModule {}
