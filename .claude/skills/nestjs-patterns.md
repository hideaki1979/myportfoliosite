# NestJS開発パターン スキル

## スキル概要

NestJS 11 + Prisma + PostgreSQL環境での開発パターンを提供するサブエージェントスキル。

## モジュール作成チェックリスト

新規モジュール作成時に確認すべき項目:

### 1. モジュール構成の決定
- [ ] Controller: HTTPリクエストのハンドリング
- [ ] Service: ビジネスロジック
- [ ] DTO: 入力バリデーション
- [ ] Entity: データモデル定義

### 2. ファイル構成
```
modules/[feature]/
├── [feature].module.ts     # モジュール定義
├── [feature].controller.ts # コントローラー
├── [feature].service.ts    # サービス
├── [feature].service.spec.ts # サービステスト
├── dto/
│   ├── create-[feature].dto.ts
│   ├── update-[feature].dto.ts
│   └── query-[feature].dto.ts
└── entities/
    └── [feature].entity.ts
```

### 3. モジュールテンプレート

#### Module
```typescript
// modules/articles/articles.module.ts
import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
```

#### Controller
```typescript
// modules/articles/articles.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import type { ApiResponse, Article } from '@repo/shared-types';

@Controller('articles')
@UseGuards(ApiKeyGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async findAll(
    @Query() query: QueryArticleDto,
  ): Promise<ApiResponse<Article[]>> {
    const data = await this.articlesService.findAll(query);
    return { data, success: true };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Article>> {
    const data = await this.articlesService.findOne(id);
    return { data, success: true };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateArticleDto,
  ): Promise<ApiResponse<Article>> {
    const data = await this.articlesService.create(dto);
    return { data, success: true };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ): Promise<ApiResponse<Article>> {
    const data = await this.articlesService.update(id, dto);
    return { data, success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.articlesService.remove(id);
  }
}
```

#### Service
```typescript
// modules/articles/articles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { CACHE_TTL } from '@/constants/cache.constants';
import type { Article } from '@repo/shared-types';

@Injectable()
export class ArticlesService {
  private readonly CACHE_PREFIX = 'articles';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: QueryArticleDto): Promise<Article[]> {
    const { limit = 10, offset = 0, orderBy = 'publishedAt' } = query;
    
    return this.prisma.article.findMany({
      take: limit,
      skip: offset,
      orderBy: { [orderBy]: 'desc' },
    });
  }

  async findOne(id: string): Promise<Article> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    
    // キャッシュチェック
    const cached = await this.cache.get<Article>(cacheKey);
    if (cached) return cached;

    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`記事が見つかりません: ${id}`);
    }

    // キャッシュに保存
    await this.cache.set(cacheKey, article, CACHE_TTL);

    return article;
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    const article = await this.prisma.article.create({
      data: {
        ...dto,
        publishedAt: dto.publishedAt ?? new Date().toISOString(),
      },
    });

    // リストキャッシュを無効化
    await this.cache.invalidatePattern(`${this.CACHE_PREFIX}:list:*`);

    return article;
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.prisma.article.update({
      where: { id },
      data: dto,
    });

    // 個別キャッシュを無効化
    await this.cache.del(`${this.CACHE_PREFIX}:${id}`);

    return article;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.article.delete({
      where: { id },
    });

    // キャッシュを無効化
    await this.cache.del(`${this.CACHE_PREFIX}:${id}`);
    await this.cache.invalidatePattern(`${this.CACHE_PREFIX}:list:*`);
  }
}
```

## キャッシング戦略

### 2層キャッシュ実装
```typescript
// common/cache/cache.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly defaultTTL: number;
  private readonly staleTTL: number;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(this.configService.get('REDIS_URL'));
    this.defaultTTL = 900; // 15分
    this.staleTTL = 3600; // 1時間
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    
    // Staleデータの場合はフラグを付けて返す
    if (parsed.stale) {
      return { ...parsed.data, _stale: true };
    }

    return parsed.data;
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    const data = JSON.stringify({ data: value, stale: false });
    await this.redis.setex(key, ttl, data);

    // Staleキャッシュも設定
    const staleData = JSON.stringify({ data: value, stale: true });
    await this.redis.setex(`${key}:stale`, this.staleTTL, staleData);
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // 通常キャッシュをチェック
    let cached = await this.get<T>(key);
    if (cached && !(cached as any)._stale) {
      return cached;
    }

    // Staleキャッシュをチェック
    if (!cached) {
      const staleData = await this.redis.get(`${key}:stale`);
      if (staleData) {
        cached = JSON.parse(staleData).data;
      }
    }

    // バックグラウンドで更新
    const freshData = fetcher().then(async (data) => {
      await this.set(key, data, ttl);
      return data;
    });

    // Staleデータがあれば先に返す
    if (cached) {
      freshData.catch(console.error); // エラーをログ
      return cached;
    }

    // キャッシュがない場合は待つ
    return freshData;
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
    await this.redis.del(`${key}:stale`);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
```

### キャッシュキー命名規則
```typescript
// constants/cache.constants.ts

// TTL定義
export const CACHE_TTL = 900; // 15分
export const CACHE_STALE_TTL = 3600; // 1時間
export const CACHE_LONG_TTL = 86400; // 24時間

// キープレフィックス
export const CACHE_KEYS = {
  ARTICLES: 'articles',
  ARTICLES_LIST: 'articles:list',
  ARTICLES_SEARCH: 'articles:search',
  USERS: 'users',
} as const;

// キー生成ヘルパー
export const cacheKey = {
  article: (id: string) => `${CACHE_KEYS.ARTICLES}:${id}`,
  articlesList: (page: number, limit: number) => 
    `${CACHE_KEYS.ARTICLES_LIST}:${page}:${limit}`,
  articlesSearch: (query: string, page: number) =>
    `${CACHE_KEYS.ARTICLES_SEARCH}:${encodeURIComponent(query)}:${page}`,
};
```

## エラーハンドリングパターン

### グローバル例外フィルター
```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { ApiResponse } from '@repo/shared-types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '予期しないエラーが発生しました';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        code = (exceptionResponse as any).code || code;
      }
    }

    // エラーログ
    this.logger.error({
      message: exception instanceof Error ? exception.message : 'Unknown error',
      stack: exception instanceof Error ? exception.stack : undefined,
      path: request.url,
      method: request.method,
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: message,
      code,
    };

    response.status(status).json(errorResponse);
  }
}
```

### カスタム例外
```typescript
// common/exceptions/app.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    message: string,
    public readonly code: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super({ message, code }, status);
  }
}

export class NotFoundAppException extends AppException {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource}が見つかりません: ${id}` : `${resource}が見つかりません`,
      'NOT_FOUND',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ValidationAppException extends AppException {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST);
  }
}

export class UnauthorizedAppException extends AppException {
  constructor(message: string = '認証が必要です') {
    super(message, 'UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
  }
}
```

## APIレスポンスフォーマット

### 標準レスポンス型
```typescript
// @repo/shared-types で定義

// 成功レスポンス
interface ApiSuccessResponse<T> {
  data: T;
  success: true;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// エラーレスポンス
interface ApiErrorResponse {
  data: null;
  success: false;
  error: string;
  code: string;
}

// ユニオン型
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### レスポンスインターセプター
```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@repo/shared-types';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        success: true as const,
      })),
    );
  }
}
```

## テストパターン

### サービスユニットテスト
```typescript
// modules/articles/articles.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  article: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  invalidatePattern: jest.fn(),
};

describe('ArticlesService', () => {
  let service: ArticlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    const mockArticle = {
      id: '1',
      title: 'Test Article',
      content: 'Test content',
    };

    it('should return cached article if available', async () => {
      mockCacheService.get.mockResolvedValue(mockArticle);

      const result = await service.findOne('1');

      expect(result).toEqual(mockArticle);
      expect(mockPrismaService.article.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findOne('1');

      expect(result).toEqual(mockArticle);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'articles:1',
        mockArticle,
        expect.any(Number),
      );
    });

    it('should throw NotFoundException if article not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

## 推奨ライブラリ

### バリデーション
- **class-validator**: DTOバリデーション
- **class-transformer**: 型変換

### データベース
- **Prisma**: ORM
- **ioredis**: Redisクライアント

### ロギング・監視
- **nestjs-pino**: 構造化ロギング
- **@nestjs/terminus**: ヘルスチェック

### ドキュメント
- **@nestjs/swagger**: OpenAPI生成

### セキュリティ
- **helmet**: HTTPセキュリティヘッダー
- **@nestjs/throttler**: レート制限
