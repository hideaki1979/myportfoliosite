import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { GithubService } from 'src/modules/github/github.service';
import request from 'supertest';

interface RepositoryResponse {
  success: boolean;
  repositories: Array<{
    id: string;
    name: string;
    description: string | null;
    url: string;
    starCount: number;
    forkCount: number;
    primaryLanguage: string | null;
    updatedAt: string;
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

describe('Github Repositories API (e2e)', () => {
  let app: INestApplication;
  let fetchSpy: jest.SpiedFunction<typeof fetch> | undefined;

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
    fetchSpy = undefined;
  });

  it('GET /api/github/repositories returns mapped repositories (success)', async () => {
    const mockRepos = [
      {
        id: 123,
        name: 'my-repo',
        description: 'desc',
        html_url: 'https://github.com/octocat/my-repo',
        stargazers_count: 42,
        forks_count: 7,
        language: 'TypeScript',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock global fetch with rate limit headers
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRepos),
      headers: {
        get: (key: string) => {
          const headers: Record<string, string> = {
            'x-ratelimit-limit': '5000',
            'x-ratelimit-remaining': '4999',
            'x-ratelimit-reset': '1704067200',
          };
          return headers[key.toLowerCase()] || null;
        },
      },
    } as Response);

    app = await initApp();

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const res = await request(server)
      .get('/api/github/repositories?limit=1')
      .expect(200);

    const body = res.body as RepositoryResponse;
    expect(body).toMatchObject({
      success: true,
      repositories: [
        {
          id: '123',
          name: 'my-repo',
          description: 'desc',
          url: 'https://github.com/octocat/my-repo',
          starCount: 42,
          forkCount: 7,
          primaryLanguage: 'TypeScript',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    });

    // レート制限情報が含まれることを確認
    expect(body.rateLimit).toBeDefined();
    expect(body.rateLimit).toMatchObject({
      limit: 5000,
      remaining: 4999,
    });
  });

  it('GET /api/github/repositories applies default limit when invalid (inspect fetch URL)', async () => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
      headers: {
        get: () => null,
      },
    } as unknown as Response);

    app = await initApp();

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server)
      .get('/api/github/repositories?limit=not-a-number')
      .expect(200);

    // Ensure default limit (20) is used in the GitHub API request
    const firstCall = fetchSpy?.mock.calls[0];
    const calledWithUrl =
      firstCall && typeof firstCall[0] === 'string' ? firstCall[0] : '';
    expect(calledWithUrl).toContain('per_page=20');
  });

  it('GET /api/github/repositories returns 503 when service is unavailable', async () => {
    app = await initApp([
      (builder) =>
        builder.overrideProvider(GithubService).useValue({
          getUserPublicRepositories: jest
            .fn()
            .mockRejectedValue(
              new ServiceUnavailableException('Github API error'),
            ),
          getRateLimitInfo: jest.fn().mockResolvedValue(null),
        }),
    ]);
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server).get('/api/github/repositories').expect(503);
  });

  it('GET /api/github/repositories uses cache on second request', async () => {
    const mockRepos = [
      {
        id: 456,
        name: 'cached-repo',
        description: 'cached',
        html_url: 'https://github.com/octocat/cached-repo',
        stargazers_count: 10,
        forks_count: 2,
        language: 'TypeScript',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRepos),
      headers: {
        get: () => null,
      },
    } as unknown as Response);

    app = await initApp();
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    // 初回リクエスト（APIを呼び出す）
    const res1 = await request(server)
      .get('/api/github/repositories?limit=1')
      .expect(200);

    const body1 = res1.body as RepositoryResponse;
    expect(body1.success).toBe(true);
    expect(body1.repositories).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // 2回目のリクエスト（キャッシュから返却される）
    const res2 = await request(server)
      .get('/api/github/repositories?limit=1')
      .expect(200);

    const body2 = res2.body as RepositoryResponse;

    expect(body2.success).toBe(true);
    expect(body2.repositories).toHaveLength(1);
    // fetchは1回だけ呼ばれる（キャッシュが使われた）
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('GET /api/github/rate-limit returns rate limit info', async () => {
    const mockRepos = [
      {
        id: '789',
        name: 'test-repo',
        description: 'test',
        url: 'https://github.com/octocat/test-repo',
        starCount: 5,
        forkCount: 1,
        primaryLanguage: 'Python',
        updatedAt: '2025-01-03T00:00:00Z',
      },
    ];

    const mockGithubService = {
      getUserPublicRepositories: jest.fn().mockResolvedValue(mockRepos),
      getRateLimitInfo: jest.fn().mockReturnValue({
        limit: 5000,
        remaining: 4998,
        resetAt: 1704070800,
      }),
    };

    app = await initApp([
      (builder) =>
        builder.overrideProvider(GithubService).useValue(mockGithubService),
    ]);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    // まずリポジトリを取得してレート制限情報をキャッシュに保存
    await request(server).get('/api/github/repositories?limit=1').expect(200);

    // レート制限情報を取得
    const res = await request(server).get('/api/github/rate-limit').expect(200);
    const body = res.body as RateLimitResponse;

    expect(body).toMatchObject({
      success: true,
      rateLimit: {
        limit: 5000,
        remaining: 4998,
      },
    });
    expect(body.rateLimit?.resetAt).toBeDefined();
  });
});
