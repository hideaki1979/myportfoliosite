import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGitHubRepositories, fetchGitHubRepositoriesClient } from '../../../lib/api/github';
import { mockRepositories } from '../../mocks/github';
import { REVALIDATE_INTERVAL_SHORT } from '../../../lib/constants';


// constants.tsをモック（サーバーサイド関数はapiBaseUrlを使用）
vi.mock('../../../lib/constants', () => ({
    baseUrl: 'http://localhost:3000',
    apiBaseUrl: 'http://localhost:3100',
    REVALIDATE_INTERVAL_SHORT: 600,
    REVALIDATE_INTERVAL_LONG: 3600,
}));

const mockPagination = {
    page: 1,
    perPage: 20,
    hasMore: false,
};

const mockSuccessResponse = {
    success: true,
    repositories: mockRepositories,
    pagination: mockPagination,
};

const mockExpectedResponse = {
    repositories: mockRepositories,
    pagination: mockPagination,
};

const mockEmptyResponse = {
    repositories: [],
    pagination: { page: 1, perPage: 20, hasMore: false },
};

describe('GitHub API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe('fetchGitHubRepositories (Server-side)', () => {
        it('正常にリポジトリを取得できること', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });
            global.fetch = fetchMock;

            const result = await fetchGitHubRepositories(20);

            expect(result).toEqual(mockExpectedResponse);
            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/github/repositories?limit=20&page=1',
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    next: { revalidate: REVALIDATE_INTERVAL_SHORT },
                })
            );
        });

        it('デフォルトのlimitパラメータで呼ばれること', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchGitHubRepositories();

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/github/repositories?limit=20&page=1',
                expect.any(Object)
            );
        });

        const errorCases = [
            {
                description: 'APIがエラーレスポンスを返した場合、空レスポンスを返すこと',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: false,
                        status: 500,
                        statusText: 'Internal Server Error',
                        json: async () => ({
                            success: false,
                            error: {
                                code: 'INTERNAL_ERROR',
                                message: 'Internal server error',
                            },
                        }),
                    })
            },
            {
                description: 'successがfalseの場合、空レスポンスを返すこと',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        json: async () => ({
                            success: false,
                        }),
                    })
            },
            {
                description: 'repositoriesが存在しない場合、空レスポンスを返すこと',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        json: async () => ({
                            success: true,
                        }),
                    })
            },
            {
                description: 'ネットワークエラーが発生した場合、空レスポンスを返すこと',
                setup: () => vi.fn().mockRejectedValue(new Error('Network error')),
            },
        ];

        it.each(errorCases)('$description', async ({ setup }) => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
            global.fetch = setup();

            const result = await fetchGitHubRepositories(20);
            expect(result).toEqual(mockEmptyResponse);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('apiBaseUrlを使用してバックエンドAPIを直接呼び出すこと', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchGitHubRepositories(20);

            // バックエンドAPIのURL（apiBaseUrl）を使用していることを確認
            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3100/api/github/repositories?limit=20&page=1',
                expect.objectContaining({
                    method: 'GET',
                    next: { revalidate: REVALIDATE_INTERVAL_SHORT },
                })
            );
        });
    });

    describe('fetchGitHubRepositoriesClient (Client-side)', () => {
        it('正常にリポジトリを取得できること', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });
            global.fetch = fetchMock;

            const result = await fetchGitHubRepositoriesClient(20);

            expect(result).toEqual(mockExpectedResponse);
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/api/github/repositories?limit=20&page=1'),
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                })
            );
        });

        it('デフォルトのlimitパラメータで呼ばれること', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            global.fetch = fetchMock;

            await fetchGitHubRepositoriesClient();

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/api/github/repositories?limit=20&page=1'),
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
                        json: async () => ({
                            success: false,
                            error: {
                                code: 'INTERNAL_ERROR',
                                message: 'Internal server error',
                            },
                        }),
                    }),
            },
            {
                description: 'successがfalseの場合、エラーをスローすること',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        json: async () => ({ success: false }),
                    }),
            },
            {
                description: 'repositoriesが存在しない場合、エラーをスローすること',
                setup: () =>
                    vi.fn().mockResolvedValue({
                        ok: true,
                        json: async () => ({ success: true }),
                    }),
            },
            {
                description: 'ネットワークエラーが発生した場合、エラーをスローすること',
                setup: () => vi.fn().mockRejectedValue(new Error('Network error')),
            },
            {
                description: '未知のエラーが発生した場合、汎用エラーメッセージをスローすること',
                setup: () => vi.fn().mockRejectedValue('Unknown error'),
            },
        ];

        it.each(errorCases)('$description', async ({ setup }) => {
            global.fetch = setup();

            await expect(fetchGitHubRepositoriesClient()).rejects.toThrow();
        })
    });
});

