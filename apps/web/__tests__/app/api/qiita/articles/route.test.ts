import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockQiitaArticles } from '../../../../mocks/qiita';
import { NextRequest } from 'next/server';
import { GET } from '../../../../../app/api/qiita/articles/route';

describe('Qiita Articles Route Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('API_URL', 'http://localhost:3100');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('正常に記事を取得できること', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                articles: mockQiitaArticles,
            }),
        });
        global.fetch = mockFetch;

        const request = new NextRequest(
            'http://localhost:3000/api/qiita/articles?limit=10'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.articles).toEqual(mockQiitaArticles);
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3100/api/qiita/articles?limit=10',
            expect.objectContaining({
                method: 'GET',
                next: { revalidate: 600 },
            })
        );
    });

    it('limitパラメータが正しく処理されること', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                articles: [],
            }),
        });
        global.fetch = mockFetch;

        const request = new NextRequest(
            'http://localhost:3000/api/qiita/articles?limit=20'
        );

        await GET(request);

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3100/api/qiita/articles?limit=20',
            expect.any(Object)
        );
    });

    it('limitパラメータがない場合、デフォルト値10が使用されること', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                articles: [],
            }),
        });
        global.fetch = mockFetch;

        const request = new NextRequest(
            'http://localhost:3000/api/qiita/articles'
        );

        await GET(request);

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3100/api/qiita/articles?limit=10',
            expect.any(Object)
        );
    });

    it('バックエンドAPIがエラーを返した場合、エラーレスポンスを返すこと', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({
                error: { message: 'Internal Server Error' },
            }),
            text: async () => '',
        });
        global.fetch = mockFetch;

        const request = new NextRequest(
            'http://localhost:3000/api/qiita/articles?limit=10'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('BACKEND_API_ERROR')
    });

    it('ネットワークエラーが発生した場合、500エラーを返すこと', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
        global.fetch = mockFetch;

        const request = new NextRequest(
            'http://localhost:3000/api/qiita/articles?limit=10'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
        expect(data.error.message).toBe('Network error');
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
