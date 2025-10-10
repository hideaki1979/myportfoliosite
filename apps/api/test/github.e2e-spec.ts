import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { GithubService } from 'src/modules/github/github.service';
import request from 'supertest';

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

    // Mock global fetch to avoid external network calls
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRepos),
    } as Response);

    app = await initApp();

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const res = await request(server)
      .get('/api/github/repositories?limit=1')
      .expect(200);

    expect(res.body).toEqual({
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
  });

  it('GET /api/github/repositories applies default limit when invalid (inspect fetch URL)', async () => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

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
        }),
    ]);
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server).get('/api/github/repositories').expect(503);
  });
});
