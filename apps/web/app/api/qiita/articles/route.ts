import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || 'http://localhost:3100';

/**
 * Qiita 記事一覧取得 API Route Handler
 * バックエンドAPIへのプロキシとして機能
 */
export async function GET(request: NextRequest) {
    try {
        const rawLimit = request.nextUrl.searchParams.get('limit');
        const parsed = rawLimit ? parseInt(rawLimit, 10) : 10;
        const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 10;

        const url = new URL(`${API_BASE_URL}/api/qiita/articles`);
        url.searchParams.set('limit', String(safeLimit));

        console.log('=== Qiita Articles API Debug ===');
        console.log('API_BASE_URL:', API_BASE_URL);
        console.log('Target URL:', url.toString());
        console.log('Limit:', safeLimit);

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

        console.log('Render API Response Status:', response.status);
        console.log('Render API Response Headers:', Object.fromEntries(response.headers.entries()));

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

        console.log('Render API Response Data:', JSON.stringify(data, null, 2));
        console.log('Data success:', data.success);
        console.log('Articles count:', data.articles?.length || 0);

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
            },
        });
    } catch (error) {
        console.error('Qiita API Route Handler Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to fetch Qiita articles',
                },
            },
            { status: 500 },
        );
    }
}
