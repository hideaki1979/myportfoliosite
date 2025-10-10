import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { GithubService } from 'src/modules/github/github.service';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Github Repositories API (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  it('GET /api/github/repositories returns mapped repositories (success)', async () => {
    process.env.GITHUB_USERNAME = 'octocat';
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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRepos),
    } as unknown as Response);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
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
    process.env.GITHUB_USERNAME = 'octocat';

    const fetchMock = jest
      .fn<Promise<Response>, [string, RequestInit?]>()
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([] as unknown[]),
      } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/api/github/repositories?limit=not-a-number')
      .expect(200);

    // Ensure default limit (20) is used in the GitHub API request
    const firstCall = fetchMock.mock.calls[0];
    const calledWithUrl = firstCall ? firstCall[0] : '';
    expect(String(calledWithUrl)).toContain('per_page=20');
  });

  it('GET /api/github/repositories returns 503 when service is unavailable', async () => {
    process.env.GITHUB_USERNAME = 'octocat';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GithubService)
      .useValue({
        getUserPublicRepositories: jest
          .fn()
          .mockRejectedValue(
            new ServiceUnavailableException('Github API error'),
          ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/api/github/repositories')
      .expect(503);
  });
});
