import { NextRequest, NextResponse } from "next/server";

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
        const url = new URL(`${API_BASE_URL}/api/github/repositories`);
        url.searchParams.set('limit', String(safeLimit))

        // バックエンドAPIを呼び出し
        const response = await fetch(
            url.toString(),
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // 15分間キャッシュ
                next: { revalidate: 900 },
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
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
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