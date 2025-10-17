import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ConfigService } from '@nestjs/config';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
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

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfig)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
