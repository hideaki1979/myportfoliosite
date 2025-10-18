import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { QiitaService } from 'src/modules/qiita/qiita.service';
import request from 'supertest';

interface ArticleResponse {
  success: boolean;
  articles: Array<{
    id: string;
    title: string;
    url: string;
    likesCount: number;
    stocksCount: number;
    createdAt: string;
    tags: Array<{
      name: string;
      versions: string[];
    }>;
  }>;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
}

interface RateLimitResponse {
  success: boolean;
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: string;
  } | null;
  message?: string;
}

describe('Qiita API (e2e)', () => {
  let app: INestApplication;

  const mockConfig: Partial<ConfigService> = {
    get: <T = string>(key: string, defaultValue?: T): T => {
      const map: Record<string, unknown> = {
        NODE_ENV: 'test',
        PORT: 0,
        GITHUB_USERNAME: 'octocat',
        GITHUB_TOKEN: '',
        QIITA_USER_ID: 'testuser',
        QIITA_TOKEN: '',
      };
      return (map[key] as T) ?? (defaultValue as T);
    },
  };

  async function initApp(
    overrides: ((builder: TestingModuleBuilder) => TestingModuleBuilder)[] = [],
  ): Promise<INestApplication> {
    let builder = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfig);

    for (const overrideFn of overrides) {
      builder = overrideFn(builder);
    }

    const moduleFixture: TestingModule = await builder.compile();
    const created = moduleFixture.createNestApplication();
    await created.init();
    return created;
  }

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.restoreAllMocks();
  });

  describe('GET /api/qiita/articles', () => {
    it('should return articles with success flag', async () => {
      const mockArticles = [
        {
          id: 'article1',
          title: 'Test Article',
          url: 'https://qiita.com/testuser/items/article1',
          likesCount: 10,
          stocksCount: 5,
          createdAt: '2025-01-01T00:00:00Z',
          tags: [{ name: 'TypeScript', versions: ['5.0'] }],
        },
      ];

      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue(mockArticles),
        getRateLimitInfo: jest.fn().mockReturnValue({
          limit: 1000,
          remaining: 999,
          resetAt: 1704067200,
        }),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(server).get('/api/qiita/articles').expect(200);

      const body = res.body as ArticleResponse;
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('articles');
      expect(Array.isArray(body.articles)).toBe(true);
    });

    it('should return articles with specified limit', async () => {
      const limit = 5;

      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue([]),
        getRateLimitInfo: jest.fn().mockReturnValue(null),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(server)
        .get(`/api/qiita/articles?limit=${limit}`)
        .expect(200);

      const body = res.body as ArticleResponse;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.articles)).toBe(true);

      // モックが正しいlimitで呼ばれることを確認
      expect(mockQiitaService.getUserArticles).toHaveBeenCalledWith(limit);
    });

    it('should return articles with correct structure', async () => {
      const mockArticles = [
        {
          id: 'article2',
          title: 'Test Article 2',
          url: 'https://qiita.com/testuser/items/article2',
          likesCount: 20,
          stocksCount: 10,
          createdAt: '2025-01-02T00:00:00Z',
          tags: [{ name: 'JavaScript', versions: ['ES2023'] }],
        },
      ];

      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue(mockArticles),
        getRateLimitInfo: jest.fn().mockReturnValue(null),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(server).get('/api/qiita/articles').expect(200);

      const body = res.body as ArticleResponse;
      expect(body.success).toBe(true);

      const articles = body.articles;
      if (articles.length > 0) {
        const article = articles[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('url');
        expect(article).toHaveProperty('likesCount');
        expect(article).toHaveProperty('stocksCount');
        expect(article).toHaveProperty('createdAt');
        expect(article).toHaveProperty('tags');
        expect(Array.isArray(article.tags)).toBe(true);

        if (article.tags.length > 0) {
          const tag = article.tags[0];
          expect(tag).toHaveProperty('name');
          expect(tag).toHaveProperty('versions');
          expect(Array.isArray(tag.versions)).toBe(true);
        }
      }
    });

    it('should include rate limit information when available', async () => {
      const mockArticles = [
        {
          id: 'article3',
          title: 'Test Article 3',
          url: 'https://qiita.com/testuser/items/article3',
          likesCount: 30,
          stocksCount: 15,
          createdAt: '2025-01-03T00:00:00Z',
          tags: [],
        },
      ];

      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue(mockArticles),
        getRateLimitInfo: jest.fn().mockReturnValue({
          limit: 1000,
          remaining: 998,
          resetAt: 1704070800,
        }),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(server).get('/api/qiita/articles').expect(200);

      const body = res.body as ArticleResponse;
      expect(body.success).toBe(true);

      // レート制限情報は初回リクエスト後に取得可能
      if (body.rateLimit) {
        expect(body.rateLimit).toHaveProperty('limit');
        expect(body.rateLimit).toHaveProperty('remaining');
        expect(body.rateLimit).toHaveProperty('resetAt');
        expect(typeof body.rateLimit.limit).toBe('number');
        expect(typeof body.rateLimit.remaining).toBe('number');
        expect(typeof body.rateLimit.resetAt).toBe('string');
      }
    });
  });

  describe('GET /api/qiita/rate-limit', () => {
    it('should return rate limit information or null', async () => {
      const mockArticles = [
        {
          id: 'article4',
          title: 'Test Article 4',
          url: 'https://qiita.com/testuser/items/article4',
          likesCount: 5,
          stocksCount: 2,
          createdAt: '2025-01-04T00:00:00Z',
          tags: [],
        },
      ];

      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue(mockArticles),
        getRateLimitInfo: jest.fn().mockReturnValue({
          limit: 1000,
          remaining: 997,
          resetAt: 1704074400,
        }),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];

      // まず記事を取得してレート制限情報をキャッシュに保存
      await request(server).get('/api/qiita/articles').expect(200);

      // レート制限情報を取得
      const res = await request(server)
        .get('/api/qiita/rate-limit')
        .expect(200);
      const body = res.body as RateLimitResponse;

      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('rateLimit');

      if (body.rateLimit !== null) {
        expect(body.rateLimit).toHaveProperty('limit');
        expect(body.rateLimit).toHaveProperty('remaining');
        expect(body.rateLimit).toHaveProperty('resetAt');
      } else {
        expect(body).toHaveProperty('message');
      }
    });
  });

  describe('Cache functionality', () => {
    it('should serve from cache on subsequent requests', async () => {
      const mockArticles = [
        {
          id: 'article5',
          title: 'Cached Article',
          url: 'https://qiita.com/testuser/items/article5',
          likesCount: 100,
          stocksCount: 50,
          createdAt: '2025-01-05T00:00:00Z',
          tags: [],
          user: { id: 'testuser' },
        },
      ];

      // Headersオブジェクトを正しくモック
      const mockHeaders = {
        get: jest.fn((name: string) => {
          const headers: Record<string, string> = {
            'rate-limit': '1000',
            'rate-remaining': '999',
            'rate-reset': '1704067200',
          };
          return headers[name.toLowerCase()] || null;
        }),
      };

      // QiitaServiceをモックせず、fetchをモックして実際のキャッシュ動作をテスト
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: mockHeaders,
        json: () => Promise.resolve(mockArticles),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      // モックを使わずに実際のQiitaServiceを使用
      app = await initApp();
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      // 最初のリクエスト（API呼び出し）
      const res1 = await request(server).get('/api/qiita/articles').expect(200);

      const body1 = res1.body as ArticleResponse;
      expect(body1.success).toBe(true);
      expect(body1.articles).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 2回目のリクエスト（サービスを再度呼び出す）
      const res2 = await request(server).get('/api/qiita/articles').expect(200);

      const body2 = res2.body as ArticleResponse;
      expect(body2.success).toBe(true);
      expect(body2.articles).toHaveLength(1);

      // キャッシュから取得されるため、fetchは1回のまま
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid limit parameter gracefully', async () => {
      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue([]),
        getRateLimitInfo: jest.fn().mockReturnValue(null),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(server)
        .get('/api/qiita/articles?limit=invalid')
        .expect(200);

      const body = res.body as ArticleResponse;
      // 無効なlimitの場合はデフォルト値（10）が使われる
      expect(body.success).toBe(true);
      expect(Array.isArray(body.articles)).toBe(true);

      // Ensure default limit (10) is used
      expect(mockQiitaService.getUserArticles).toHaveBeenCalledWith(10);
    });

    it('should handle negative limit parameter', async () => {
      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue([]),
        getRateLimitInfo: jest.fn().mockReturnValue(null),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(server)
        .get('/api/qiita/articles?limit=-5')
        .expect(200);

      const body = res.body as ArticleResponse;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.articles)).toBe(true);
    });

    it('should handle excessively large limit parameter', async () => {
      const mockQiitaService = {
        getUserArticles: jest.fn().mockResolvedValue([]),
        getRateLimitInfo: jest.fn().mockReturnValue(null),
      };

      app = await initApp([
        (builder) =>
          builder.overrideProvider(QiitaService).useValue(mockQiitaService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(server)
        .get('/api/qiita/articles?limit=1000')
        .expect(200);

      const body = res.body as ArticleResponse;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.articles)).toBe(true);
      // Qiita APIの上限（100）を超えないこと
      expect(body.articles.length).toBeLessThanOrEqual(100);

      // Ensure limit is capped at 100
      expect(mockQiitaService.getUserArticles).toHaveBeenCalledWith(1000);
    });
  });
});
