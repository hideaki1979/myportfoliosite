# NestJS (API) 固有ルール

## モジュール構成

### ディレクトリ構造
```
src/
├── modules/
│   ├── articles/
│   │   ├── articles.module.ts
│   │   ├── articles.controller.ts
│   │   ├── articles.service.ts
│   │   ├── dto/
│   │   │   ├── create-article.dto.ts
│   │   │   └── search-article.dto.ts
│   │   └── entities/
│   │       └── article.entity.ts
│   │
│   └── [other-modules]/
│
├── common/
│   ├── guards/
│   │   └── api-key.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── decorators/
│   │   └── api-key.decorator.ts
│   └── interceptors/
│       └── cache.interceptor.ts
│
└── constants/
    └── cache.constants.ts
```

### モジュール作成テンプレート
```typescript
// modules/[feature]/[feature].module.ts
import { Module } from '@nestjs/common';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

## Controller/Service/DTOパターン

### Controller
```typescript
// modules/articles/articles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { SearchArticleDto } from './dto/search-article.dto';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import type { ApiResponse, Article } from '@repo/shared-types';

@Controller('articles')
@UseGuards(ApiKeyGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async findAll(): Promise<ApiResponse<Article[]>> {
    const data = await this.articlesService.findAll();
    return { data, success: true };
  }

  @Get('search')
  async search(
    @Query() dto: SearchArticleDto,
  ): Promise<ApiResponse<Article[]>> {
    const data = await this.articlesService.search(dto);
    return { data, success: true };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Article>> {
    const data = await this.articlesService.findOne(id);
    return { data, success: true };
  }

  @Post()
  async create(
    @Body() dto: CreateArticleDto,
  ): Promise<ApiResponse<Article>> {
    const data = await this.articlesService.create(dto);
    return { data, success: true };
  }
}
```

### Service
```typescript
// modules/articles/articles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { SearchArticleDto } from './dto/search-article.dto';
import { CACHE_TTL, CACHE_STALE_TTL } from '@/constants/cache.constants';
import type { Article } from '@repo/shared-types';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<Article[]> {
    const cacheKey = 'articles:all';
    
    // キャッシュから取得
    const cached = await this.cache.get<Article[]>(cacheKey);
    if (cached) return cached;

    // DBから取得
    const articles = await this.prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
    });

    // キャッシュに保存
    await this.cache.set(cacheKey, articles, CACHE_TTL);
    
    return articles;
  }

  async search(dto: SearchArticleDto): Promise<Article[]> {
    const { q, limit = 10, offset = 0 } = dto;

    return this.prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      skip: offset,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`記事が見つかりません: ${id}`);
    }

    return article;
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    const article = await this.prisma.article.create({
      data: dto,
    });

    // キャッシュを無効化
    await this.cache.del('articles:all');

    return article;
  }
}
```

### DTO
```typescript
// modules/articles/dto/create-article.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty({ message: 'タイトルは必須です' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '本文は必須です' })
  content: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;
}

// modules/articles/dto/search-article.dto.ts
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchArticleDto {
  @IsString()
  q: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
```

## キャッシング戦略

### 2層キャッシュ
```typescript
// constants/cache.constants.ts
export const CACHE_TTL = 900; // 15分（通常キャッシュ）
export const CACHE_STALE_TTL = 3600; // 1時間（Staleキャッシュ）

// common/services/cache.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }
}
```

### キャッシュキー命名規則
```
{module}:{action}:{identifier?}

例:
- articles:all
- articles:single:abc123
- articles:search:keyword
- users:profile:user123
```

## カスタムGuard/Decoratorパターン

### ApiKeyGuard
```typescript
// common/guards/api-key.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get('API_KEY');

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('無効なAPIキーです');
    }

    return true;
  }
}
```

### Publicデコレータ
```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// 使用例
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check(): string {
    return 'OK';
  }
}
```

## テスト設定

### Jest設定
```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### サービステストテンプレート
```typescript
// modules/articles/articles.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/services/cache.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let prisma: PrismaService;
  let cache: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
  });

  describe('findAll', () => {
    it('should return cached articles if available', async () => {
      const mockArticles = [{ id: '1', title: 'Test' }];
      jest.spyOn(cache, 'get').mockResolvedValue(mockArticles);

      const result = await service.findAll();

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if not cached', async () => {
      const mockArticles = [{ id: '1', title: 'Test' }];
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(prisma.article, 'findMany').mockResolvedValue(mockArticles);

      const result = await service.findAll();

      expect(result).toEqual(mockArticles);
      expect(cache.set).toHaveBeenCalled();
    });
  });
});
```

## 環境変数バリデーション

### Joiスキーマ
```typescript
// config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  API_KEY: Joi.string().required(),
  REDIS_URL: Joi.string().optional(),
});

// app.module.ts
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
  ],
})
export class AppModule {}
```

## ロギング設定

### nestjs-pino
```typescript
// app.module.ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty' }
          : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
  ],
})
export class AppModule {}
```
