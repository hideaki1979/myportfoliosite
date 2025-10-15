import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGitHubRepositories, fetchGitHubRepositoriesClient } from '../../../lib/api/github';
import { GitHubRepository } from '../../../components/features/GitHubRepos/types';

const mockRepositories: GitHubRepository[] = [
    {
        id: "1",
        name: 'test-repo-1',
        description: 'Test repository 1',
        url: 'https://github.com/user/test-repo-1',
        starCount: 10,
        forkCount: 5,
        primaryLanguage: 'TypeScript',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: "2",
        name: 'test-repo-2',
        description: 'Test repository 2',
        url: 'https://github.com/user/test-repo-2',
        starCount: 20,
        forkCount: 10,
        primaryLanguage: 'JavaScript',
        updatedAt: '2024-01-02T00:00:00Z',
    },
    {
        id: "3",
        name: 'test-repo-3',
        description: 'Test repository 3',
        url: 'https://github.com/user/test-repo-3',
        starCount: 30,
        forkCount: 12,
        primaryLanguage: 'Python',
        updatedAt: '2024-01-02T00:00:00Z',
    },
];

const mockSuccessResponse = {
    success: true,
    repositories: mockRepositories,
};

describe('GitHub API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
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
            const originalEnv = process.env.NEXT_PUBLIC_BASE_URL;
            process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';

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

            process.env.NEXT_PUBLIC_BASE_URL = originalEnv;
        });

        it('環境変数NEXT_PUBLIC_BASE_URLが未設定の場合、localhostを使用すること', async () => {
            const originalEnv = process.env.NEXT_PUBLIC_BASE_URL;
            delete process.env.NEXT_PUBLIC_BASE_URL;

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

            process.env.NEXT_PUBLIC_BASE_URL = originalEnv;
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

