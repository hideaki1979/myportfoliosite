import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || 'http://localhost:3100';

/**
 * Qiita プロフィール取得 API Route Handler
 * バックエンドAPIへのプロキシとして機能
 */
export async function GET() {
    try {
        const url = `${API_BASE_URL}/api/qiita/profile`;

        // バックエンドAPIを呼び出し
        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // 1時間キャッシュ
                next: { revalidate: 3600 },
            },
        );

        if (!response.ok) {
            let message = `Backend API request failed: ${response.status}`;
            try {
                const errorData = await response.json();
                message = errorData.error?.message || errorData?.message || message;
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
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error('Qiita Profile API Route Handler Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to fetch Qiita profile',
                },
            },
            { status: 500 },
        );
    }
}
