import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGitHubRepositories, fetchGitHubRepositoriesClient } from '../../../lib/api/github';
import { mockRepositories } from '../../mocks/github';

const mockSuccessResponse = {
    success: true,
    repositories: mockRepositories,
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

            expect(result).toEqual(mockRepositories);
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/api/github/repositories?limit=20'),
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'force-cache',
                    next: { revalidate: 900 },
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
                expect.stringContaining('/api/github/repositories?limit=20'),
                expect.any(Object)
            );
        });

        it('APIがエラーレスポンスを返した場合、空配列を返すこと', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                    },
                }),
            });
            global.fetch = fetchMock;

            const result = await fetchGitHubRepositories(20);

            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('successがfalseの場合、空配列を返すこと', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: false,
                }),
            });
            global.fetch = fetchMock;

            const result = await fetchGitHubRepositories(20);

            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('repositoriesが存在しない場合、空配列を返すこと', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: true,
                }),
            });
            global.fetch = fetchMock;

            const result = await fetchGitHubRepositories(20);

            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('ネットワークエラーが発生した場合、空配列を返すこと', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = fetchMock;

            const result = await fetchGitHubRepositories(20);

            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('環境変数NEXT_PUBLIC_BASE_URLが設定されている場合、そのURLを使用すること', async () => {
            vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.com');

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchGitHubRepositories(20);

            expect(fetchMock).toHaveBeenCalledWith(
                'https://example.com/api/github/repositories?limit=20',
                expect.any(Object)
            );
        });

        it('環境変数NEXT_PUBLIC_BASE_URLが未設定の場合、localhostを使用すること', async () => {
            vi.stubEnv('NEXT_PUBLIC_BASE_URL', undefined);

            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });
            global.fetch = fetchMock;

            await fetchGitHubRepositories(20);

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:3000/api/github/repositories?limit=20',
                expect.any(Object)
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

            expect(result).toEqual(mockRepositories);
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/github/repositories?limit=20',
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
                '/api/github/repositories?limit=20',
                expect.any(Object)
            );
        });

        it('APIがエラーレスポンスを返した場合、エラーをスローすること', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                    },
                }),
            });
            global.fetch = fetchMock;

            await expect(fetchGitHubRepositoriesClient(20)).rejects.toThrow('Internal server error');
        });

        it('successがfalseの場合、エラーをスローすること', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: false,
                }),
            });
            global.fetch = fetchMock;

            await expect(fetchGitHubRepositoriesClient(20)).rejects.toThrow('GitHub API returned invalid response');
        });

        it('repositoriesが存在しない場合、エラーをスローすること', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: true,
                }),
            });
            global.fetch = fetchMock;

            await expect(fetchGitHubRepositoriesClient(20)).rejects.toThrow('GitHub API returned invalid response');
        });

        it('ネットワークエラーが発生した場合、エラーをスローすること', async () => {
            const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = fetchMock;

            await expect(fetchGitHubRepositoriesClient(20)).rejects.toThrow('Network error');
        });

        it('未知のエラーが発生した場合、汎用エラーメッセージをスローすること', async () => {
            const fetchMock = vi.fn().mockRejectedValue('Unknown error');
            global.fetch = fetchMock;

            await expect(fetchGitHubRepositoriesClient(20)).rejects.toThrow('Failed to fetch GitHub repositories');
        });
    });
});

