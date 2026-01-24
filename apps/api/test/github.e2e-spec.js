"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("src/app.module");
const github_service_1 = require("src/modules/github/github.service");
const supertest_1 = __importDefault(require("supertest"));
describe('Github Repositories API (e2e)', () => {
    let app;
    let fetchSpy;
    const mockConfig = {
        get: (key, defaultValue) => {
            const map = {
                NODE_ENV: 'test',
                PORT: 0,
                GITHUB_USERNAME: 'octocat',
                GITHUB_TOKEN: '',
                QIITA_USER_ID: 'testuser',
                QIITA_TOKEN: '',
            };
            return map[key] ?? defaultValue;
        },
    };
    async function initApp(overrides = []) {
        let builder = testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(config_1.ConfigService)
            .useValue(mockConfig);
        for (const overrideFn of overrides) {
            builder = overrideFn(builder);
        }
        const moduleFixture = await builder.compile();
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
        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockRepos),
            headers: {
                get: (key) => {
                    const headers = {
                        'x-ratelimit-limit': '5000',
                        'x-ratelimit-remaining': '4999',
                        'x-ratelimit-reset': '1704067200',
                    };
                    return headers[key.toLowerCase()] || null;
                },
            },
        });
        app = await initApp();
        const server = app.getHttpServer();
        const res = await (0, supertest_1.default)(server)
            .get('/api/github/repositories?limit=1')
            .expect(200);
        const body = res.body;
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
        expect(body.rateLimit).toBeDefined();
        expect(body.rateLimit).toMatchObject({
            limit: 5000,
            remaining: 4999,
        });
    });
    it('GET /api/github/repositories returns 400 when limit is invalid', async () => {
        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
            headers: {
                get: () => null,
            },
        });
        app = await initApp();
        const server = app.getHttpServer();
        await (0, supertest_1.default)(server)
            .get('/api/github/repositories?limit=not-a-number')
            .expect(400);
        expect(fetchSpy).not.toHaveBeenCalled();
    });
    it('GET /api/github/repositories returns 503 when service is unavailable', async () => {
        app = await initApp([
            (builder) => builder.overrideProvider(github_service_1.GithubService).useValue({
                getUserPublicRepositories: jest
                    .fn()
                    .mockRejectedValue(new common_1.ServiceUnavailableException('Github API error')),
                getRateLimitInfo: jest.fn().mockResolvedValue(null),
            }),
        ]);
        const server = app.getHttpServer();
        await (0, supertest_1.default)(server).get('/api/github/repositories').expect(503);
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
        });
        app = await initApp();
        const server = app.getHttpServer();
        const res1 = await (0, supertest_1.default)(server)
            .get('/api/github/repositories?limit=1')
            .expect(200);
        const body1 = res1.body;
        expect(body1.success).toBe(true);
        expect(body1.repositories).toHaveLength(1);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const res2 = await (0, supertest_1.default)(server)
            .get('/api/github/repositories?limit=1')
            .expect(200);
        const body2 = res2.body;
        expect(body2.success).toBe(true);
        expect(body2.repositories).toHaveLength(1);
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
            (builder) => builder.overrideProvider(github_service_1.GithubService).useValue(mockGithubService),
        ]);
        const server = app.getHttpServer();
        await (0, supertest_1.default)(server).get('/api/github/repositories?limit=1').expect(200);
        const res = await (0, supertest_1.default)(server).get('/api/github/rate-limit').expect(200);
        const body = res.body;
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
//# sourceMappingURL=github.e2e-spec.js.map