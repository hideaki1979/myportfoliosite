import { fetchQiitaArticles, fetchQiitaArticlesClient, fetchQiitaProfile } from "../../../lib/api/qiita";
import { mockQiitaArticles, mockQiitaProfile } from "../../mocks/qiita";

const mockArticlesSuccessResponse = {
    success: true,
    articles: mockQiitaArticles,
};

const mockProfileSuccessResponse = {
    success: true,
    profile: mockQiitaProfile,
};

describe('Qiita API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe('fetchQiitaArticles (Server-side)', () => {
        it('正常に記事を取得できること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            const result = await fetchQiitaArticles(10);

            expect(result).toEqual(mockQiitaArticles);
            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/qiita/articles?limit=10',
                expect.objectContaining({
                    next: { revalidate: 900 },
                })
            );
        });

        it('デフォルトのlimitパラメータで呼ばれること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaArticles();

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/qiita/articles?limit=10',
                expect.any(Object)
            );
        });

        it('APIがエラーレスポンスを返した場合、空配列をスローすること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({
                    success: false,
                }),
            });
            global.fetch = fetchMock;

            await expect(fetchQiitaArticles(10)).rejects.toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('successがfalseの場合、空配列をスローすること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: false,
                }),
            });
            global.fetch = fetchMock;

            await expect(fetchQiitaArticles(10)).rejects.toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('ネットワークエラーが発生した場合、空配列をスローすること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = fetchMock;

            await expect(fetchQiitaArticles(10)).rejects.toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('環境変数API_URLが正しく使用されること', async () => {
            vi.stubEnv('API_URL', 'https://api.example.com');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaArticles(10);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/qiita/articles?limit=10',
                expect.any(Object)
            );
        });
    });

    describe('fetchQiitaArticlesClient (Client-side)', () => {
        it('正常に記事を取得できること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            const result = await fetchQiitaArticlesClient(10);

            expect(result).toEqual(mockQiitaArticles);
            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/qiita/articles?limit=10',
                expect.objectContaining({
                    cache: 'no-store',
                })
            );
        });

        it('デフォルトのlimitパラメータで呼ばれること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaArticlesClient();

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/qiita/articles?limit=10',
                expect.any(Object)
            );
        });

        it('APIがエラーレスポンスを返した場合、エラーをスローすること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({
                    success: false,
                }),
            });
            global.fetch = fetchMock;

            await expect(fetchQiitaArticlesClient(10)).rejects.toThrow(
                'Qiita API error: 500 Internal Server Error'
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('successがfalseの場合、エラーをスローすること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: false,
                }),
            });
            global.fetch = fetchMock;

            await expect(fetchQiitaArticlesClient(10)).rejects.toThrow(
                'Qiita API returned unsuccessful response'
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('ネットワークエラーが発生した場合、エラーをスローすること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:4000');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = fetchMock;

            await expect(fetchQiitaArticlesClient(10)).rejects.toThrow('Network error');
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('環境変数API_URLが正しく使用されること', async () => {
            vi.stubEnv('API_URL', 'https://api.example.com');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaArticlesClient(10);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/qiita/articles?limit=10',
                expect.any(Object)
            );
        });
    });

    describe('fetchQiitaProfile (Server-side)', () => {
        it('正常にプロフィールを取得できること', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockProfileSuccessResponse,
            });
            global.fetch = fetchMock;

            const result = await fetchQiitaProfile();

            expect(result).toEqual(mockQiitaProfile);
            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/qiita/profile',
                expect.objectContaining({
                    next: { revalidate: 3600 },
                })
            );
        });

        it('APIがエラーレスポンスを返した場合、nullを返すこと', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            global.fetch = fetchMock;

            const result = await fetchQiitaProfile();

            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('successがfalseの場合、nullを返すこと', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: false,
                    message: 'Profile not found',
                }),
            });
            global.fetch = fetchMock;

            const result = await fetchQiitaProfile();

            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('profileがnullの場合、nullを返すこと', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: true,
                    profile: null,
                }),
            });
            global.fetch = fetchMock;

            const result = await fetchQiitaProfile();

            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('ネットワークエラーが発生した場合、nullを返すこと', async () => {
            vi.stubEnv('API_URL', 'http://localhost:3100');

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = fetchMock;

            const result = await fetchQiitaProfile();

            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('環境変数API_URLが正しく使用されること', async () => {
            vi.stubEnv('API_URL', 'https://api.example.com');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockProfileSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaProfile();

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/qiita/profile',
                expect.any(Object)
            );
        });
    });
});
