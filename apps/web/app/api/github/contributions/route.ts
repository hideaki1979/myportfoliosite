import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || 'http://localhost:3100';

/**
 * GitHub コントリビューションカレンダー取得 API
 * GET /api/github/contributions
 */
export async function GET() {
    try {

        const response = await fetch(`${API_BASE_URL}/api/github/contributions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // サーバーサイドキャッシュ: 10分
            next: { revalidate: 600 },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'GITHUB_API_ERROR',
                        message:
                            errorData.error?.message ||
                            `Failed to fetch contributions: ${response.status}`,
                    },
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch GitHub contributions:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error while fetching contributions',
                },
            },
            { status: 500 },
        );
    }
}