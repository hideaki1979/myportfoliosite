import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockQiitaProfile } from '../../../../mocks/qiita';
import { GET } from '../../../../../app/api/qiita/profile/route';

describe('Qiita Profile Route Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('API_URL', 'http://localhost:3100');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('正常にプロフィールを取得できること', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                profile: mockQiitaProfile,
            }),
        });
        global.fetch = mockFetch;

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.profile).toEqual(mockQiitaProfile);
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3100/api/qiita/profile',
            expect.objectContaining({
                method: 'GET',
                next: { revalidate: 600 },
            })
        );
    });

    it('バックエンドAPIがエラーを返した場合、エラーレスポンスを返すこと', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({
                error: { message: 'Profile not found' },
            }),
            text: async () => '',
        });
        global.fetch = mockFetch;

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('BACKEND_API_ERROR')
    });

    it('ネットワークエラーが発生した場合、500エラーを返すこと', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
        global.fetch = mockFetch;

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
