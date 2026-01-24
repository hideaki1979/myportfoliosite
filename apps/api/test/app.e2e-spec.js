"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("./../src/app.module");
const config_1 = require("@nestjs/config");
describe('AppController (e2e)', () => {
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
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(config_1.ConfigService)
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
        await (0, supertest_1.default)(app.getHttpServer())
            .get('/')
            .expect(200)
            .expect('Hello World!');
    });
});
//# sourceMappingURL=app.e2e-spec.js.map