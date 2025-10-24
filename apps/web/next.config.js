/** @type {import('next').NextConfig} */
// APIのベースURLを環境変数から取得
const apiDomain = process.env.API_URL || 'http://localhost:3100';

const nextConfig = {
    // Vercel向けの最適化
    transpilePackages: ['@repo/ui'],
    compiler: {
        styledComponents: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.com'
            },
        ],
    },
    async headers() {
        const isProd = process.env.NODE_ENV === 'production';

        const csp = [
            "default-src 'self'",
            // prodではinline/eval禁止、devはNextのHMR/overlayの都合で許容
            isProd ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
        ].filter(Boolean).join(': ');

        const baseHeaders = [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            { key: 'Content-Security-Policy', value: csp },
        ];

        if (isProd) {
            baseHeaders.push({
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload',
            });
        }

        return [{
            source: '/(.*)',
            headers: baseHeaders,
        }];
    },
    async redirects() {
        return [
            { source: '/home', destination: '/', permanent: true }
        ]
    },
};

export default nextConfig;
