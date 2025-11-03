import { NextRequest, NextResponse } from "next/server";

/**
 * コンタクトフォーム送信API
 * コンタクトフォーム送信 API Route Handler
 * バックエンドAPIへのプロキシとして機能
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // バックエンドAPIを呼び出し
        const response = await fetch(`${process.env.API_URL}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let message = `Backend API request failed: ${response.status}`;
            try {
                const errorData = await response.json();
                message = errorData.message || errorData.error?.message || message;
            } catch {
                const text = await response.text().catch(() => '');
                if (text) message = text;
            }
            return NextResponse.json(
                {
                    success: false,
                    message,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        // 成功レスポンス
        return NextResponse.json(data);
    } catch (error) {
        console.error('Contact API Route Handler Error:', error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。',
            },
            { status: 500 },
        );
    }
}
