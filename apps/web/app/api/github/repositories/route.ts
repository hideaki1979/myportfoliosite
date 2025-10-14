import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || 'http://localhost:3100';

/**
 * GitHub リポジトリ一覧取得 API Route Handler
 * バックエンドAPIへのプロキシとして機能
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get('limit') || '20';

        // バックエンドAPIを呼び出し
        const response = await fetch(
            `${API_BASE_URL}/api/github/repositories?limit=${limit}`,
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
            const errorData = await response.json();
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'BACKEND_API_ERROR',
                        message:
                            errorData.error?.message ||
                            `Backend API request failed: ${response.status}`,
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