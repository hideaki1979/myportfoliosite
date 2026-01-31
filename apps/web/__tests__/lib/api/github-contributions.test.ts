import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGitHubContributions, fetchGitHubContributionsClient, refreshGitHubContributions } from '../../../lib/api/github';

// fetchのモック
global.fetch = vi.fn();

describe('GitHub Contributions API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchGitHubContributions (Server)', () => {
        it('成功時にコントリビューションデータを返す', async () => {
            const mockResponse = {
                success: true,
                contributions: {
                    totalContributions: 100,
                    weeks: [
                        {
                            contributionDays: [
                                { date: '2024-01-01', contributionCount: 5, color: '#40c463' },
                            ],
                        },
                    ],
                },
            };

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await fetchGitHubContributions();

            expect(result).toEqual(mockResponse.contributions);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/github/contributions'),
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );
        });

        it('APIが非OKレスポンスを返した時に空のデータを返す', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: { code: 'SERVER_ERROR', message: 'Server error' },
                }),
            });

            const result = await fetchGitHubContributions();

            expect(result).toEqual({
                totalContributions: 0,
                weeks: [],
            });
        });

        it('ネットワークエラー時に空のデータを返す', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                new Error('Network error')
            );

            const result = await fetchGitHubContributions();

            expect(result).toEqual({
                totalContributions: 0,
                weeks: [],
            });
        });
    });

    describe('fetchGitHubContributionsClient (Client)', () => {
        it('成功時にコントリビューションデータを返す', async () => {
            const mockResponse = {
                success: true,
                contributions: {
                    totalContributions: 50,
                    weeks: [
                        {
                            contributionDays: [
                                { date: '2024-01-01', contributionCount: 3, color: '#9be9a8' },
                            ],
                        },
                    ],
                },
            };

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await fetchGitHubContributionsClient();

            expect(result).toEqual(mockResponse.contributions);
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/github/contributions',
                expect.objectContaining({
                    method: 'GET',
                    cache: 'no-store',
                })
            );
        });

        it('APIエラー時にエラーをスローする', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: false,
                status: 503,
                json: async () => ({
                    success: false,
                    error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' },
                }),
            });

            await expect(fetchGitHubContributionsClient()).rejects.toThrow();
        });
    });

    describe('refreshGitHubContributions (Client)', () => {
        it('成功時にリフレッシュされたコントリビューションデータを返す', async () => {
            const mockResponse = {
                success: true,
                contributions: {
                    totalContributions: 150,
                    weeks: [
                        {
                            contributionDays: [
                                { date: '2024-01-01', contributionCount: 10, color: '#40c463' },
                            ],
                        },
                    ],
                },
                refreshedAt: '2024-01-01T00:00:00Z',
            };

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await refreshGitHubContributions();

            expect(result).toEqual(mockResponse.contributions);
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/github/contributions/refresh',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                })
            );
        });

        it('APIが非OKレスポンスを返した時にエラーをスローする', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: { code: 'SERVER_ERROR', message: 'Refresh failed' },
                }),
            });

            await expect(refreshGitHubContributions()).rejects.toThrow('Refresh failed');
        });

        it('successがfalseの場合にエラーをスローする', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                }),
            });

            await expect(refreshGitHubContributions()).rejects.toThrow(
                'GitHub contributions refresh API returned invalid response'
            );
        });

        it('contributionsがない場合にエラーをスローする', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                }),
            });

            await expect(refreshGitHubContributions()).rejects.toThrow(
                'GitHub contributions refresh API returned invalid response'
            );
        });

        it('ネットワークエラー時にエラーをスローする', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                new Error('Network error')
            );

            await expect(refreshGitHubContributions()).rejects.toThrow('Network error');
        });

        it('未知のエラー時に汎用エラーメッセージをスローする', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                'Unknown error'
            );

            await expect(refreshGitHubContributions()).rejects.toThrow(
                'Failed to refresh GitHub contributions'
            );
        });
    });
});