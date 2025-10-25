import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    // nonceの生成（リクエストごとにユニーク）
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    const isProd = process.env.NODE_ENV === 'production';
    // APIのベースURLを環境変数から取得
    const apiDomain = process.env.API_URL || 'http://localhost:3100';

    const cspHeader = [
        "default-src 'self'",
        // prodではinline/eval禁止、devはNextのHMR/overlayの都合で許容
        `script-src 'self' 'nonce-${nonce}' ${isProd ? "'strict-dynamic'" : "'unsafe-eval'"}`,
        // styled-components考慮でinline styleは許容
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        // devは HMR 等で ws/wss/http/https を許容。prodは https と API のみ
        `connect-src 'self' ${apiDomain} ${isProd ? "https:" : "http: https: ws: wss:"}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        // 本番のみ自動HTTPS化（任意）
        isProd ? "upgrade-insecure-requests" : null,
    ].filter(Boolean).join('; ');

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    if (isProd) {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload',
        );
    }

    return response;
}

export const config = {
    matcher: [
        {
            source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
