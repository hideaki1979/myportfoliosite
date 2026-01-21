import { NextRequest, NextResponse } from "next/server";
import { REVALIDATE_INTERVAL_SHORT } from '../../../../lib/constants';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3100';

/**
 * GitHub リポジトリ一覧取得 API Route Handler
 * バックエンドAPIへのプロキシとして機能
 */
export async function GET(request: NextRequest) {
    try {
        const rawLimit = request.nextUrl.searchParams.get('limit');
        const parsed = rawLimit ? parseInt(rawLimit, 10) : 20;
        const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20;

        const rawPage = request.nextUrl.searchParams.get('page');
        const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
        const safePage = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

        const url = new URL(`${API_BASE_URL}/api/github/repositories`);
        url.searchParams.set('limit', String(safeLimit));
        url.searchParams.set('page', String(safePage));

        // バックエンドAPIを呼び出し
        const response = await fetch(
            url.toString(),
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // 10分間キャッシュ
                next: { revalidate: REVALIDATE_INTERVAL_SHORT },
            },
        );

        if (!response.ok) {
            let message = `Backend API request failed: ${response.status}`;
            try {
                const errorData = await response.json();
                message = errorData.error?.message ||
                    errorData?.message || message;
            } catch {
                const text = await response.text().catch(() => '');
                if (text) message = text;
            }
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'BACKEND_API_ERROR',
                        message,
                    },
                },
                { status: response.status },
            );
        }

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': `public, s-maxage=${REVALIDATE_INTERVAL_SHORT}, stale-while-revalidate=${REVALIDATE_INTERVAL_SHORT * 2}`,
            },
        });
    } catch (error) {
        console.error('GitHub API Route Handler Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to fetch GitHub repositories',
                },
            },
            { status: 500 },
        );
    }
}