"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("src/app.module");
const qiita_service_1 = require("src/modules/qiita/qiita.service");
const supertest_1 = __importDefault(require("supertest"));
describe('Qiita API (e2e)', () => {
    let app;
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
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            const res = await (0, supertest_1.default)(server).get('/api/qiita/articles').expect(200);
            const body = res.body;
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
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            const res = await (0, supertest_1.default)(server)
                .get(`/api/qiita/articles?limit=${limit}`)
                .expect(200);
            const body = res.body;
            expect(body.success).toBe(true);
            expect(Array.isArray(body.articles)).toBe(true);
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
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            const res = await (0, supertest_1.default)(server).get('/api/qiita/articles').expect(200);
            const body = res.body;
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
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            const res = await (0, supertest_1.default)(server).get('/api/qiita/articles').expect(200);
            const body = res.body;
            expect(body.success).toBe(true);
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
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            await (0, supertest_1.default)(server).get('/api/qiita/articles').expect(200);
            const res = await (0, supertest_1.default)(server)
                .get('/api/qiita/rate-limit')
                .expect(200);
            const body = res.body;
            expect(body).toHaveProperty('success', true);
            expect(body).toHaveProperty('rateLimit');
            if (body.rateLimit !== null) {
                expect(body.rateLimit).toHaveProperty('limit');
                expect(body.rateLimit).toHaveProperty('remaining');
                expect(body.rateLimit).toHaveProperty('resetAt');
            }
            else {
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
            const mockHeaders = {
                get: jest.fn((name) => {
                    const headers = {
                        'rate-limit': '1000',
                        'rate-remaining': '999',
                        'rate-reset': '1704067200',
                    };
                    return headers[name.toLowerCase()] || null;
                }),
            };
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: mockHeaders,
                json: () => Promise.resolve(mockArticles),
            });
            global.fetch = mockFetch;
            app = await initApp();
            const server = app.getHttpServer();
            const res1 = await (0, supertest_1.default)(server).get('/api/qiita/articles').expect(200);
            const body1 = res1.body;
            expect(body1.success).toBe(true);
            expect(body1.articles).toHaveLength(1);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const res2 = await (0, supertest_1.default)(server).get('/api/qiita/articles').expect(200);
            const body2 = res2.body;
            expect(body2.success).toBe(true);
            expect(body2.articles).toHaveLength(1);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });
    describe('Error handling', () => {
        it('should return 400 for invalid limit parameter', async () => {
            const mockQiitaService = {
                getUserArticles: jest.fn().mockResolvedValue([]),
                getRateLimitInfo: jest.fn().mockReturnValue(null),
            };
            app = await initApp([
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            await (0, supertest_1.default)(server)
                .get('/api/qiita/articles?limit=invalid')
                .expect(400);
            expect(mockQiitaService.getUserArticles).not.toHaveBeenCalled();
        });
        it('should return 400 for negative limit parameter', async () => {
            const mockQiitaService = {
                getUserArticles: jest.fn().mockResolvedValue([]),
                getRateLimitInfo: jest.fn().mockReturnValue(null),
            };
            app = await initApp([
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            await (0, supertest_1.default)(server).get('/api/qiita/articles?limit=-5').expect(400);
            expect(mockQiitaService.getUserArticles).not.toHaveBeenCalled();
        });
        it('should handle excessively large limit parameter', async () => {
            const mockQiitaService = {
                getUserArticles: jest.fn().mockResolvedValue([]),
                getRateLimitInfo: jest.fn().mockReturnValue(null),
            };
            app = await initApp([
                (builder) => builder.overrideProvider(qiita_service_1.QiitaService).useValue(mockQiitaService),
            ]);
            const server = app.getHttpServer();
            const res = await (0, supertest_1.default)(server)
                .get('/api/qiita/articles?limit=1000')
                .expect(200);
            const body = res.body;
            expect(body.success).toBe(true);
            expect(Array.isArray(body.articles)).toBe(true);
            expect(body.articles.length).toBeLessThanOrEqual(100);
            expect(mockQiitaService.getUserArticles).toHaveBeenCalledWith(1000);
        });
    });
});
//# sourceMappingURL=qiita.e2e-spec.js.map