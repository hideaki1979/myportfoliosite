import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || 'http://localhost:3100';

/**
 * GitHub コントリビューションキャッシュクリア＆リフレッシュ API
 * POST /api/github/contributions/refresh
 */
export async function POST() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/github/contributions/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // キャッシュを使用しない
            cache: 'no-store',
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
                            `Failed to refresh contributions: ${response.status}`,
                    },
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to refresh GitHub contributions:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error while refreshing contributions',
                },
            },
            { status: 500 },
        );
    }
}
