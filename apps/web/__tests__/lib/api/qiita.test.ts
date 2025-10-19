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
        beforeEach(() => {
            vi.stubEnv('API_URL', 'http://localhost:3100');
        });

        it('正常に記事を取得できること', async () => {
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
                }),
            );
        });

        it('デフォルトのlimitパラメータで呼ばれること', async () => {
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

        const errorCases = [
            {
                description: 'APIがエラーレスポンスを返す',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: false,
                        status: 500,
                        statusText: 'Internal Server Error',
                        json: async () => ({ success: false }),
                    }),
            },
            {
                description: 'successがfalseの場合',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        json: async () => ({ success: false }),
                    }),
            },
            {
                description: 'ネットワークエラーが発生する',
                setup: () => vi.fn().mockRejectedValue(new Error('Network error')),
            },
        ];

        it.each(errorCases)('$description', async ({ setup }) => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
            global.fetch = setup();

            const result = await fetchQiitaArticles(10);
            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('環境変数API_URLが正しく使用されること', async () => {
            vi.unstubAllEnvs();
            vi.stubEnv('API_URL', 'https://api.example.com');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaArticles(10);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/qiita/articles?limit=10',
                expect.objectContaining({ next: { revalidate: 900 } }),
            );
        });
    });

    describe('fetchQiitaArticlesClient (Client-side)', () => {
        beforeEach(() => {
            vi.stubEnv('API_URL', 'http://localhost:3100');
        });

        it('正常に記事を取得できること', async () => {
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

        const errorCases = [
            {
                description: 'APIがエラーレスポンスを返した場合、エラーをスローすること',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: false,
                        status: 500,
                        statusText: 'Internal Server Error',
                        json: async () => ({ success: false }),
                    }),
                expectedErrorMessage: 'Qiita API error: 500 Internal Server Error',
            },
            {
                description: 'successがfalseの場合、エラーをスローすること',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        statusText: 'Internal Server Error',
                        json: async () => ({ success: false }),
                    }),
                expectedErrorMessage: 'Qiita API returned unsuccessful response',
            },
            {
                description: 'ネットワークエラーが発生する',
                setup: () => vi.fn().mockRejectedValue(new Error('Network error')),
                expectedErrorMessage: 'Network error',
            },
        ];

        it.each(errorCases)('$description', async ({ setup, expectedErrorMessage }) => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
            global.fetch = setup();

            await expect(fetchQiitaArticlesClient(10)).rejects.toThrow(expectedErrorMessage);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('環境変数API_URLが正しく使用されること', async () => {
            vi.unstubAllEnvs();
            vi.stubEnv('API_URL', 'https://api.example.com');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockArticlesSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaArticlesClient(10);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/qiita/articles?limit=10',
                expect.objectContaining({
                    cache: "no-store",
                }),
            );
        });
    });

    describe('fetchQiitaProfile (Server-side)', () => {
        beforeEach(() => {
            vi.stubEnv('API_URL', 'http://localhost:3100');
        });

        it('正常にプロフィールを取得できること', async () => {
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

        const errorCases = [
            {
                description: 'APIがエラーレスポンスを返した場合、nullを返すこと',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: false,
                        status: 500,
                        statusText: 'Internal Server Error',
                    }),
            },
            {
                description: 'successがfalseの場合、nullを返すこと',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        json: async () => ({
                            success: false,
                            message: 'Profile not found',
                        }),
                    }),
            },
            {
                description: 'profileがnullの場合、nullを返すこと',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        json: async () => ({
                            success: true,
                            profile: null,
                        }),
                    }),
            },
            {
                description: 'ネットワークエラーが発生した場合、nullを返すこと',
                setup: () => vi.fn().mockRejectedValue(new Error('Network error')),
            },
        ];

        it.each(errorCases)('$description', async ({ setup }) => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
            global.fetch = setup();

            const result = await fetchQiitaProfile();
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('環境変数API_URLが正しく使用されること', async () => {
            vi.unstubAllEnvs();
            vi.stubEnv('API_URL', 'https://api.example.com');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockProfileSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchQiitaProfile();

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/api/qiita/profile',
                expect.objectContaining({ next: { revalidate: 3600 } }),
            );
        });
    });
});
