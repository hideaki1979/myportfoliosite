import { BadRequestException, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { ContactService } from 'src/modules/contact/contact.service';
import { RecaptchaService } from 'src/modules/contact/recaptcha.service';
import request from 'supertest';

interface ContactResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

describe('Contact API (e2e)', () => {
  let app: INestApplication;

  const mockConfig: Partial<ConfigService> = {
    get: <T = string>(key: string, defaultValue?: T): T => {
      const map: Record<string, unknown> = {
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

    for (const overfideFn of overrides) {
      builder = overfideFn(builder);
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

  describe('POST /api/contact', () => {
    it('成功: 有効なフォームデータとreCAPTCHAトークンで送信できる', async () => {
      // reCAPTCHA検証をモック
      const mockRecaptchaService = {
        verifyToken: jest.fn().mockResolvedValue(true),
      };

      // ContactServiceをモック（メール送信は実行しない）
      const mockContactService = {
        submitContactForm: jest.fn().mockResolvedValue({
          success: true,
          message: 'お問い合わせを受け付けました。ご連絡ありがとうございます。',
        }),
      };

      app = await initApp([
        (builder) =>
          builder
            .overrideProvider(RecaptchaService)
            .useValue(mockRecaptchaService),
        (builder) =>
          builder.overrideProvider(ContactService).useValue(mockContactService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const payload = {
        name: '山田太郎',
        email: 'test@example.com',
        subject: 'お問い合わせテスト',
        message: 'これはテストメッセージです。10文字以上必要です。',
        recaptchaToken: 'valid-recaptcha-token',
      };

      const res = await request(server)
        .post('/api/contact')
        .send(payload)
        .expect(200);

      const body = res.body as ContactResponse;
      expect(body).toMatchObject({
        success: true,
        message: 'お問い合わせを受け付けました。ご連絡ありがとうございます。',
      });

      // モックが呼ばれたことを確認
      expect(mockContactService.submitContactForm).toHaveBeenCalled();

      // 呼び出しの引数を検証
      const calls = mockContactService.submitContactForm.mock
        .calls as unknown as Array<
        [Record<string, string>, string, Record<string, string>]
      >;
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
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const payload = {
        name: 'A', // 2文字未満
        email: 'test@example.com',
        subject: 'お問い合わせテスト',
        message: 'これはテストメッセージです。10文字以上必要です。',
        recaptchaToken: 'valid-recaptcha-token',
      };

      const res = await request(server).post('/api/contact').send(payload);

      const body = res.body as ContactResponse;
      expect(body.success).toBe(false);
      expect(body.message).toBe('入力内容に誤りがあります。');
      expect(body.errors).toBeDefined();
      expect(body.errors?.name).toBeDefined();
    });

    it('失敗: バリデーションエラー - メールアドレスが無効', async () => {
      app = await initApp();
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const payload = {
        name: '山田太郎',
        email: 'invalid-email', // 無効なメールアドレス
        subject: 'お問い合わせテスト',
        message: 'これはテストメッセージです。10文字以上必要です。',
        recaptchaToken: 'valid-recaptcha-token',
      };

      const res = await request(server).post('/api/contact').send(payload);

      const body = res.body as ContactResponse;
      expect(body.success).toBe(false);
      expect(body.message).toBe('入力内容に誤りがあります。');
      expect(body.errors).toBeDefined();
      expect(body.errors?.email).toBeDefined();
    });

    it('失敗: バリデーションエラー - メッセージが短すぎる', async () => {
      app = await initApp();
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const payload = {
        name: '山田太郎',
        email: 'test@example.com',
        subject: 'お問い合わせテスト',
        message: '短い', // 10文字未満
        recaptchaToken: 'valid-recaptcha-token',
      };

      const res = await request(server).post('/api/contact').send(payload);

      const body = res.body as ContactResponse;
      expect(body.success).toBe(false);
      expect(body.message).toBe('入力内容に誤りがあります。');
      expect(body.errors).toBeDefined();
      expect(body.errors?.message).toBeDefined();
    });

    it('失敗: reCAPTCHAトークンが無効', async () => {
      // reCAPTCHA検証失敗をモック
      const mockRecaptchaService = {
        verifyToken: jest
          .fn()
          .mockRejectedValue(
            new BadRequestException('reCAPTCHAトークンが無効です'),
          ),
      };

      const mockContactService = {
        submitContactForm: jest
          .fn()
          .mockImplementation(async (formData, token) => {
            // reCAPTCHA検証を呼び出す
            await mockRecaptchaService.verifyToken(token);
          }),
      };

      app = await initApp([
        (builder) =>
          builder
            .overrideProvider(RecaptchaService)
            .useValue(mockRecaptchaService),
        (builder) =>
          builder.overrideProvider(ContactService).useValue(mockContactService),
      ]);

      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const payload = {
        name: '山田太郎',
        email: 'test@example.com',
        subject: 'お問い合わせテスト',
        message: 'これはテストメッセージです。10文字以上必要です。',
        recaptchaToken: 'invalid-recaptcha-token',
      };

      const res = await request(server).post('/api/contact').send(payload);

      const body = res.body as ContactResponse;
      expect(body.success).toBe(false);
      expect(body.message).toContain('reCAPTCHA');
    });

    it('失敗: reCAPTCHAトークンが未指定', async () => {
      app = await initApp();
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const payload = {
        name: '山田太郎',
        email: 'test@example.com',
        subject: 'お問い合わせテスト',
        message: 'これはテストメッセージです。10文字以上必要です。',
        // recaptchaToken を省略
      };

      const res = await request(server).post('/api/contact').send(payload);

      const body = res.body as ContactResponse;
      expect(body.success).toBe(false);
      expect(body.message).toBe('入力内容に誤りがあります。');
      expect(body.errors).toBeDefined();
      expect(body.errors?.recaptchaToken).toBeDefined();
    });

    it('失敗: 必須フィールドが全て空', async () => {
      app = await initApp();
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const payload = {};

      const res = await request(server).post('/api/contact').send(payload);

      const body = res.body as ContactResponse;
      expect(body.success).toBe(false);
      expect(body.message).toBe('入力内容に誤りがあります。');
      expect(body.errors).toBeDefined();
      expect(Object.keys(body.errors || {}).length).toBeGreaterThan(0);
    });
  });
});
