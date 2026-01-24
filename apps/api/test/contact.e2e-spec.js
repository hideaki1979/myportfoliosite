"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("src/app.module");
const http_exception_filter_1 = require("src/common/filters/http-exception.filter");
const contact_service_1 = require("src/modules/contact/contact.service");
const recaptcha_service_1 = require("src/modules/contact/recaptcha.service");
const supertest_1 = __importDefault(require("supertest"));
const nestjs_pino_1 = require("nestjs-pino");
describe('Contact API (e2e)', () => {
    let app;
    const mockConfig = {
        get: (key, defaultValue) => {
            const map = {
                NODE_ENV: 'test',
                PORT: 0,
                GITHUB_USERNAME: 'testuser',
                GITHUB_TOKEN: '',
                QIITA_USER_ID: 'testuser',
                QIITA_TOKEN: '',
                RECAPTCHA_SECRET_KEY: 'test-secret-key',
                RESEND_API_KEY: '',
                RESEND_FROM: 'test@example.com',
                RESEND_TO: 'admin@example.com',
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
        for (const overfideFn of overrides) {
            builder = overfideFn(builder);
        }
        const moduleFixture = await builder.compile();
        const created = moduleFixture.createNestApplication();
        created.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter(created.get(nestjs_pino_1.Logger)));
        await created.init();
        return created;
    }
    afterEach(async () => {
        if (app) {
            await app.close();
        }
        jest.restoreAllMocks();
    });
    describe('POST /api/contact', () => {
        it('成功: 有効なフォームデータとreCAPTCHAトークンで送信できる', async () => {
            const mockRecaptchaService = {
                verifyToken: jest.fn().mockResolvedValue(true),
            };
            const mockContactService = {
                submitContactForm: jest.fn().mockResolvedValue({
                    success: true,
                    message: 'お問い合わせを受け付けました。ご連絡ありがとうございます。',
                }),
            };
            app = await initApp([
                (builder) => builder
                    .overrideProvider(recaptcha_service_1.RecaptchaService)
                    .useValue(mockRecaptchaService),
                (builder) => builder.overrideProvider(contact_service_1.ContactService).useValue(mockContactService),
            ]);
            const server = app.getHttpServer();
            const payload = {
                name: '山田太郎',
                email: 'test@example.com',
                subject: 'お問い合わせテスト',
                message: 'これはテストメッセージです。10文字以上必要です。',
                recaptchaToken: 'valid-recaptcha-token',
            };
            const res = await (0, supertest_1.default)(server)
                .post('/api/contact')
                .send(payload)
                .expect(201);
            const body = res.body;
            expect(body).toMatchObject({
                success: true,
                message: 'お問い合わせを受け付けました。ご連絡ありがとうございます。',
            });
            expect(mockContactService.submitContactForm).toHaveBeenCalled();
            const calls = mockContactService.submitContactForm.mock
                .calls;
            const [formData, token, metadata] = calls[0];
            expect(formData).toEqual({
                name: '山田太郎',
                email: 'test@example.com',
                subject: 'お問い合わせテスト',
                message: 'これはテストメッセージです。10文字以上必要です。',
            });
            expect(token).toBe('valid-recaptcha-token');
            expect(metadata).toHaveProperty('ip');
            expect(metadata).toHaveProperty('userAgent');
            expect(typeof metadata.ip).toBe('string');
            expect(typeof metadata.userAgent).toBe('string');
        });
        it('失敗: バリデーションエラー - 名前が短すぎる', async () => {
            app = await initApp();
            const server = app.getHttpServer();
            const payload = {
                name: 'A',
                email: 'test@example.com',
                subject: 'お問い合わせテスト',
                message: 'これはテストメッセージです。10文字以上必要です。',
                recaptchaToken: 'valid-recaptcha-token',
            };
            const res = await (0, supertest_1.default)(server).post('/api/contact').send(payload);
            const body = res.body;
            expect(body.success).toBe(false);
            expect(body.message).toBe('入力内容に誤りがあります。');
            expect(body.errors).toBeDefined();
            expect(body.errors?.name).toBeDefined();
        });
        it('失敗: バリデーションエラー - メールアドレスが無効', async () => {
            app = await initApp();
            const server = app.getHttpServer();
            const payload = {
                name: '山田太郎',
                email: 'invalid-email',
                subject: 'お問い合わせテスト',
                message: 'これはテストメッセージです。10文字以上必要です。',
                recaptchaToken: 'valid-recaptcha-token',
            };
            const res = await (0, supertest_1.default)(server).post('/api/contact').send(payload);
            const body = res.body;
            expect(body.success).toBe(false);
            expect(body.message).toBe('入力内容に誤りがあります。');
            expect(body.errors).toBeDefined();
            expect(body.errors?.email).toBeDefined();
        });
        it('失敗: バリデーションエラー - メッセージが短すぎる', async () => {
            app = await initApp();
            const server = app.getHttpServer();
            const payload = {
                name: '山田太郎',
                email: 'test@example.com',
                subject: 'お問い合わせテスト',
                message: '短い',
                recaptchaToken: 'valid-recaptcha-token',
            };
            const res = await (0, supertest_1.default)(server).post('/api/contact').send(payload);
            const body = res.body;
            expect(body.success).toBe(false);
            expect(body.message).toBe('入力内容に誤りがあります。');
            expect(body.errors).toBeDefined();
            expect(body.errors?.message).toBeDefined();
        });
        it('失敗: reCAPTCHAトークンが無効', async () => {
            const mockRecaptchaService = {
                verifyToken: jest
                    .fn()
                    .mockRejectedValue(new common_1.BadRequestException('reCAPTCHAトークンが無効です')),
            };
            const mockContactService = {
                submitContactForm: jest
                    .fn()
                    .mockImplementation(async (formData, token) => {
                    await mockRecaptchaService.verifyToken(token);
                }),
            };
            app = await initApp([
                (builder) => builder
                    .overrideProvider(recaptcha_service_1.RecaptchaService)
                    .useValue(mockRecaptchaService),
                (builder) => builder.overrideProvider(contact_service_1.ContactService).useValue(mockContactService),
            ]);
            const server = app.getHttpServer();
            const payload = {
                name: '山田太郎',
                email: 'test@example.com',
                subject: 'お問い合わせテスト',
                message: 'これはテストメッセージです。10文字以上必要です。',
                recaptchaToken: 'invalid-recaptcha-token',
            };
            const res = await (0, supertest_1.default)(server)
                .post('/api/contact')
                .send(payload)
                .expect(400);
            const body = res.body;
            expect(body.success).toBe(false);
            expect(body.error?.message).toContain('reCAPTCHA');
        });
        it('失敗: reCAPTCHAトークンが未指定', async () => {
            app = await initApp();
            const server = app.getHttpServer();
            const payload = {
                name: '山田太郎',
                email: 'test@example.com',
                subject: 'お問い合わせテスト',
                message: 'これはテストメッセージです。10文字以上必要です。',
            };
            const res = await (0, supertest_1.default)(server).post('/api/contact').send(payload);
            const body = res.body;
            expect(body.success).toBe(false);
            expect(body.message).toBe('入力内容に誤りがあります。');
            expect(body.errors).toBeDefined();
            expect(body.errors?.recaptchaToken).toBeDefined();
        });
        it('失敗: 必須フィールドが全て空', async () => {
            app = await initApp();
            const server = app.getHttpServer();
            const payload = {};
            const res = await (0, supertest_1.default)(server).post('/api/contact').send(payload);
            const body = res.body;
            expect(body.success).toBe(false);
            expect(body.message).toBe('入力内容に誤りがあります。');
            expect(body.errors).toBeDefined();
            expect(Object.keys(body.errors || {}).length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=contact.e2e-spec.js.map